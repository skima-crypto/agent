// src/lib/crypto/fetchToken.ts
import axios from "axios";

const COINGECKO_API = "https://api.coingecko.com/api/v3";
const DEXSCREENER_API = "https://api.dexscreener.com/latest/dex/tokens";
const COVALENT_API_KEY = process.env.COVALENT_API_KEY;

/**
 * ⚡ fetchToken
 * Fetches detailed token info by symbol, contract address, or CoinGecko ID.
 * Prioritizes CoinGecko → Dexscreener → Covalent fallback.
 */
export async function fetchToken(query: string) {
  try {
    // 1️⃣ CoinGecko direct search
    const search = await axios.get(`${COINGECKO_API}/search?query=${query}`);
    if (search.data.coins?.length > 0) {
      const coin = search.data.coins[0];
      const { data: coinData } = await axios.get(
        `${COINGECKO_API}/coins/${coin.id}`
      );

      return {
        source: "coingecko",
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        marketCapRank: coinData.market_cap_rank,
        priceUSD: coinData.market_data?.current_price?.usd ?? null,
        change24h: coinData.market_data?.price_change_percentage_24h ?? null,
        description:
          coinData.description?.en
            ?.replace(/<\/?[^>]+(>|$)/g, "")
            ?.slice(0, 300) || "No description available.",
        image: coinData.image?.large,
        homepage: coinData.links?.homepage?.[0],
        explorers: coinData.links?.blockchain_site?.filter(Boolean).slice(0, 3),
        categories: coinData.categories,
        volume24h: coinData.market_data?.total_volume?.usd ?? null,
        liquidity: coinData.liquidity_score || null,
        updatedAt: new Date().toISOString(),
      };
    }

    // 2️⃣ Dexscreener fallback — fast on-chain price, chart, and liquidity
    try {
      const { data } = await axios.get(`${DEXSCREENER_API}/${query}`);
      if (data?.pairs?.length > 0) {
        const pair = data.pairs[0];
        return {
          source: "dexscreener",
          token: pair.baseToken.name,
          symbol: pair.baseToken.symbol,
          chain: pair.chainId,
          priceUSD: pair.priceUsd,
          liquidityUSD: pair.liquidity?.usd,
          volume24h: pair.volume?.h24,
          miniChart: `https://dexscreener.com/${pair.chainId}/${pair.pairAddress}`,
          url: pair.url,
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn("⚠️ Dexscreener fallback failed:", (err as any).message);
    }

    // 3️⃣ Covalent fallback — check if query is an address
    if (/^(0x)?[0-9a-fA-F]{40}$/.test(query)) {
      const chains = ["eth-mainnet", "bsc-mainnet", "polygon-mainnet"];
      for (const chain of chains) {
        try {
          const url = `https://api.covalenthq.com/v1/${chain}/tokens/${query}/token_holders/?key=${COVALENT_API_KEY}`;
          const { data } = await axios.get(url);
          if (data?.data?.items?.length > 0) {
            const token = data.data.items[0];
            return {
              source: "covalent",
              name: token.contract_name,
              symbol: token.contract_ticker_symbol,
              holders: token.holder_count,
              chain,
              updatedAt: new Date().toISOString(),
            };
          }
        } catch {
          continue;
        }
      }
    }

    // 4️⃣ Fallback
    return { error: "Token not found in any data source.", query };
  } catch (err: any) {
    console.error("💥 fetchToken error:", err.message);
    return { error: err.message || "Failed to fetch token data." };
  }
}