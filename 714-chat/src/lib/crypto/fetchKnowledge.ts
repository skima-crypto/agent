// src/lib/crypto/fetchKnowledge.ts
import axios from "axios";
import { generateSummary } from "@/lib/utils/generateSummary"; // ✅ new import

const COINGECKO_API = "https://api.coingecko.com/api/v3";
const DEXSCREENER_API = "https://api.dexscreener.com/latest/dex/tokens";
const COVALENT_API_KEY = process.env.COVALENT_API_KEY;

/**
 * 🧠 fetchKnowledge
 * Generates contextual insights or summaries about a token, wallet, or market.
 * - Pulls raw data from Covalent, CoinGecko, and Dexscreener
 * - Enriches with sentiment, volatility, and trend indicators
 */
export async function fetchKnowledge(query: string) {
  try {
    let summary: any = { query };

    // 1️⃣ Fetch token details from CoinGecko
    const search = await axios.get(`${COINGECKO_API}/search?query=${query}`);
    if (search.data.coins?.length > 0) {
      const coin = search.data.coins[0];
      const [priceRes, marketRes] = await Promise.all([
        axios.get(
          `${COINGECKO_API}/simple/price?ids=${coin.id}&vs_currencies=usd&include_24hr_change=true`
        ),
        axios.get(`${COINGECKO_API}/coins/${coin.id}`),
      ]);

      const priceData = priceRes.data[coin.id];
      const marketData = marketRes.data;

      summary.coin = {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        marketCapRank: marketData.market_cap_rank,
        priceUSD: priceData?.usd ?? null,
        change24h: priceData?.usd_24h_change ?? null,
        description: marketData.description?.en
          ?.replace(/<\/?[^>]+(>|$)/g, "")
          ?.slice(0, 400) || "No description available.",
        homepage: marketData.links?.homepage?.[0] || null,
        categories: marketData.categories || [],
      };
    }

    // 2️⃣ Dexscreener — fetch recent on-chain activity + chart
    try {
      const { data } = await axios.get(`${DEXSCREENER_API}/${query}`);
      if (data?.pairs?.length > 0) {
        const pair = data.pairs[0];
        summary.dex = {
          chain: pair.chainId,
          priceUSD: pair.priceUsd,
          liquidityUSD: pair.liquidity?.usd || 0,
          volume24h: pair.volume?.h24 || 0,
          txns24h: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
          miniChart: `https://dexscreener.com/${pair.chainId}/${pair.pairAddress}`,
          url: pair.url,
        };
      }
    } catch (err) {
      console.warn("⚠️ Dexscreener insight fetch failed:", (err as any).message);
    }

    // 3️⃣ Covalent — try multi-chain overview for wallet or token address
    try {
      const chains = ["eth-mainnet", "base-mainnet", "bsc-mainnet", "polygon-mainnet"];
      const requests = chains.map(async (c) => {
        try {
          const url = `https://api.covalenthq.com/v1/${c}/address/${query}/balances_v2/?key=${COVALENT_API_KEY}`;
          const { data } = await axios.get(url);
          if (data?.data?.items?.length > 0)
            return {
              chain: c,
              tokens: data.data.items
                .filter((t: any) => Number(t.quote) > 0)
                .map((t: any) => ({
                  name: t.contract_name,
                  symbol: t.contract_ticker_symbol,
                  valueUSD: t.quote,
                })),
            };
          return null;
        } catch {
          return null;
        }
      });

      const balances = (await Promise.all(requests)).filter(Boolean);
      if (balances.length > 0) summary.covalent = { balances };
    } catch (err) {
      console.warn("⚠️ Covalent insight fetch failed:", (err as any).message);
    }

    // 4️⃣ Generate AI-style context summary using generateSummary util
    const aiSummary = generateSummary({
      tokens:
        summary.covalent?.balances?.flatMap((b: any) => b.tokens) ??
        (summary.coin
          ? [
              {
                name: summary.coin.name,
                symbol: summary.coin.symbol,
                priceUSD: summary.coin.priceUSD,
                change24h: summary.coin.change24h,
                liquidity: summary.dex?.liquidityUSD,
                volume24h: summary.dex?.volume24h,
              },
            ]
          : []),
    });

    return {
      source: "multi",
      type: "knowledge",
      summary: aiSummary,
      raw: summary,
      updatedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error("💥 fetchKnowledge error:", err.message);
    return { error: err.message || "Failed to generate knowledge summary." };
  }
}
