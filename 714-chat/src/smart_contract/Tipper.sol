// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Tipper.sol (Updated)
 *
 * - Accepts tips in native ETH (address(0)) or ERC20 tokens
 * - Deducts a 2% fee (200 basis points) and sends to feeReceiver
 * - USD cap check removed (frontend enforces max send)
 * - Owner can set token -> priceFeed mappings (Chainlink aggregators)
 * - Uses OpenZeppelin SafeERC20, ReentrancyGuard, Ownable
 */

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/utils/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/token/ERC20/utils/SafeERC20.sol";

interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function decimals() external view returns (uint8);
}

contract Tipper is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant FEE_BPS = 200; // 2%
    uint256 public constant BPS_DENOM = 10000;

    address public feeReceiver;
    mapping(address => address) public priceFeed;

    event TipSentNative(address indexed sender, address indexed recipient, uint256 amount, uint256 fee);
    event TipSentERC20(address indexed sender, address indexed recipient, address indexed token, uint256 amount, uint256 fee);
    event PriceFeedSet(address indexed token, address indexed feed);
    event FeeReceiverUpdated(address indexed oldReceiver, address indexed newReceiver);
    event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount);

    /// @notice Pass msg.sender to Ownable constructor (OpenZeppelin v5)
    constructor(address _feeReceiver) Ownable(msg.sender) {
        require(_feeReceiver != address(0), "feeReceiver=0");
        feeReceiver = _feeReceiver;
    }

    // ============ OWNER FUNCTIONS ============

    function setPriceFeed(address token, address feed) external onlyOwner {
        require(feed != address(0), "feed=0");
        priceFeed[token] = feed;
        emit PriceFeedSet(token, feed);
    }

    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        require(_feeReceiver != address(0), "feeReceiver=0");
        address old = feeReceiver;
        feeReceiver = _feeReceiver;
        emit FeeReceiverUpdated(old, _feeReceiver);
    }

    function emergencyWithdraw(address token, address to) external onlyOwner nonReentrant {
        require(to != address(0), "to=0");
        if (token == address(0)) {
            uint256 bal = address(this).balance;
            (bool ok, ) = to.call{value: bal}("");
            require(ok, "native withdraw failed");
            emit EmergencyWithdraw(token, to, bal);
        } else {
            IERC20 t = IERC20(token);
            uint256 bal = t.balanceOf(address(this));
            if (bal > 0) {
                t.safeTransfer(to, bal);
                emit EmergencyWithdraw(token, to, bal);
            }
        }
    }

    // ============ TIP FUNCTIONS ============

    function tipNative(address payable recipient) external payable nonReentrant {
        require(recipient != address(0), "recipient=0");
        require(msg.value > 0, "zero amount");

        // Optional: still get price feed (for frontend display if needed)
        address feedAddr = priceFeed[address(0)];
        if (feedAddr != address(0)) {
            _getLatestPrice(feedAddr);
        }

        // 💡 USD cap check removed — any amount allowed
        uint256 fee = (msg.value * FEE_BPS) / BPS_DENOM;
        uint256 net = msg.value - fee;

        (bool sentRecipient, ) = recipient.call{value: net}("");
        require(sentRecipient, "recipient transfer failed");

        (bool sentFee, ) = feeReceiver.call{value: fee}("");
        require(sentFee, "fee transfer failed");

        emit TipSentNative(msg.sender, recipient, msg.value, fee);
    }

    function tipERC20(address token, address recipient, uint256 amount) external nonReentrant {
        require(token != address(0), "token=0");
        require(recipient != address(0), "recipient=0");
        require(amount > 0, "zero amount");

        // Optional: still call feed for tracking
        address feedAddr = priceFeed[token];
        if (feedAddr != address(0)) {
            _getLatestPrice(feedAddr);
        }

        // 💡 USD cap check removed — any amount allowed
        uint256 fee = (amount * FEE_BPS) / BPS_DENOM;
        uint256 net = amount - fee;

        IERC20 tokenContract = IERC20(token);
        tokenContract.safeTransferFrom(msg.sender, recipient, net);
        if (fee > 0) {
            tokenContract.safeTransferFrom(msg.sender, feeReceiver, fee);
        }

        emit TipSentERC20(msg.sender, recipient, token, amount, fee);
    }

    // ============ INTERNAL HELPERS ============

    function _getTokenDecimals(address token) internal view returns (uint8) {
        (bool ok, bytes memory data) = token.staticcall(abi.encodeWithSignature("decimals()"));
        if (ok && data.length >= 32) {
            return abi.decode(data, (uint8));
        }
        return 18;
    }

    function _getLatestPrice(address feed) internal view returns (uint256) {
        AggregatorV3Interface aggregator = AggregatorV3Interface(feed);
        (, int256 answer, , , ) = aggregator.latestRoundData();
        if (answer <= 0) return 0; // skip invalid feed
        uint8 decimals = aggregator.decimals();
        if (decimals == 8) return uint256(answer);
        if (decimals > 8) return uint256(answer) / (10 ** (decimals - 8));
        return uint256(answer) * (10 ** (8 - decimals));
    }

    // Allow contract to receive native ETH
    receive() external payable {}
    fallback() external payable {}
}