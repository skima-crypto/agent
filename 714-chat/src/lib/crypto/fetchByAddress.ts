import axios from "axios";

const COVALENT_API_KEY = process.env.COVALENT_API_KEY!;
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const DEXSCREENER_BASE_URL = "https://api.dexscreener.com/latest/dex/tokens";

/**
 * 🧭 Detect what kind of query user entered
 * (address, tx hash, or token symbol/name)
 */
function detectInputType(query: string) {
  if (/^(0x)?[0-9a-fA-F]{40}$/.test(query)) return "evm_address";
  if (/^[1-9A-HJ-NP-Za-km-z]{25,35}$/.test(query)) return "btc_address";
  if (/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(query)) return "solana_address";
  if (/^0x[a-fA-F0-9]{64}$/.test(query)) return "tx_hash";
  return "symbol_or_name";
}

/**
 * ⚡ Unified multi-chain token & wallet fetcher
 * Supports: EVM, Solana, Bitcoin, Aptos, Cardano, etc.
 * Falls back to Dexscreener and CoinGecko.
 */
export async function fetchByAddress(query: string) {
  const type = detectInputType(query);
  console.log(`🔍 Detected input type: ${type}`);

  try {
    // 1️⃣ Try Covalent (multi-chain wallet + token data)
    if (["evm_address", "solana_address", "btc_address"].includes(type)) {
      const chains = [
        "eth-mainnet",
        "bsc-mainnet",
        "polygon-mainnet",
        "arbitrum-mainnet",
        "base-mainnet",
        "avalanche-mainnet",
        "optimism-mainnet",
        "fantom-mainnet",
        "zksync-mainnet",
        "celo-mainnet",
        "gnosis-mainnet",
        "linea-mainnet",
        "scroll-mainnet",
        "mantle-mainnet",
        "moonbeam-mainnet",
        "solana-mainnet",
        "bitcoin-mainnet",
        "aptos-mainnet",
        "cardano-mainnet",
        "tron-mainnet",
        "cronos-mainnet",
        "blast-mainnet",
        "opbnb-mainnet",
        "hedera-mainnet",
        "near-mainnet",
      ];

      const promises = chains.map(async (chain) => {
        try {
          const url = `https://api.covalenthq.com/v1/${chain}/address/${query}/balances_v2/?key=${COVALENT_API_KEY}`;
          const { data } = await axios.get(url);
          if (data?.data?.items?.length > 0) return { chain, data: data.data };
          return null;
        } catch {
          return null;
        }
      });

      const results = (await Promise.all(promises)).filter(
  (r): r is { chain: string; data: any } => r !== null
);

if (results.length > 0)
  return {
    source: "covalent",
    type: "wallet",
    query,
    results,
    fetchedChains: results.map((r) => r.chain),
    updatedAt: new Date().toISOString(),
  };

    }

    // 2️⃣ Try Dexscreener for token contracts or tickers
    try {
      const { data } = await axios.get(`${DEXSCREENER_BASE_URL}/${query}`);
      if (data?.pairs?.length > 0) {
        return {
          source: "dexscreener",
          type: "token",
          results: data.pairs.map((p: any) => ({
            token: p.baseToken.name,
            symbol: p.baseToken.symbol,
            chain: p.chainId,
            priceUSD: p.priceUsd,
            liquidity: p.liquidity?.usd,
            volume24h: p.volume?.h24,
            chartUrl: p.url,
          })),
        };
      }
    } catch (err: any) {
      console.warn("⚠️ Dexscreener fetch failed:", err.message);
    }

    // 3️⃣ Try CoinGecko fallback by token name or symbol
    try {
      const { data: search } = await axios.get(
        `${COINGECKO_BASE_URL}/search?query=${query}`
      );
      if (search.coins?.length > 0) {
        const token = search.coins[0];
        const { data: price } = await axios.get(
          `${COINGECKO_BASE_URL}/simple/price?ids=${token.id}&vs_currencies=usd`
        );

        return {
          source: "coingecko",
          type: "token",
          token: {
            name: token.name,
            symbol: token.symbol,
            rank: token.market_cap_rank,
            image: token.large,
            id: token.id,
          },
          priceUSD: price[token.id]?.usd || null,
        };
      }
    } catch (err: any) {
      console.warn("⚠️ CoinGecko fetch failed:", err.message);
    }

    // 4️⃣ Fallback if nothing matches
    return {
      error: "❌ No wallet, token, or market data found for this query.",
      query,
    };
  } catch (err: any) {
    console.error("💥 fetchByAddress fatal error:", err.message);
    return { error: err.message || "Failed to fetch data." };
  }
}
