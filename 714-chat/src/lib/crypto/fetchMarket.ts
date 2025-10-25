// src/lib/crypto/fetchMarket.ts
import axios from "axios";

const COINGECKO_API = "https://api.coingecko.com/api/v3";
const DEXSCREENER_API = "https://api.dexscreener.com/latest/dex";
const OKX_API_KEY = process.env.OKX_API_KEY;
const COVALENT_API_KEY = process.env.COVALENT_API_KEY;

/**
 * 🔹 Fetch trending, top gainers, or token market data across multiple sources
 * Includes liquidity, volume, and mini chart URLs from Dexscreener.
 * @param query Optional — if provided, searches for a specific token or ticker.
 */
export async function fetchMarket(query?: string) {
  try {
    // 1️⃣ If a token query is provided
    if (query) {
      // Try CoinGecko first
      const search = await axios.get(`${COINGECKO_API}/search?query=${query}`);
      if (search.data.coins?.length > 0) {
        const coin = search.data.coins[0];
        const price = await axios.get(
          `${COINGECKO_API}/simple/price?ids=${coin.id}&vs_currencies=usd`
        );

        return {
          source: "coingecko",
          type: "token",
          data: {
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            rank: coin.market_cap_rank,
            thumb: coin.thumb,
            large: coin.large,
            priceUSD: price.data[coin.id]?.usd ?? null,
            chart: `https://www.coingecko.com/en/coins/${coin.id}`, // mini chart link
          },
        };
      }

      // Fallback → Dexscreener token pairs
      const dex = await axios.get(`${DEXSCREENER_API}/search?q=${query}`);
      if (dex.data.pairs?.length > 0) {
        const pairs = dex.data.pairs.map((p: any) => ({
          name: p.baseToken.name,
          symbol: p.baseToken.symbol,
          chain: p.chainId,
          priceUSD: p.priceUsd,
          liquidityUSD: p.liquidity?.usd || 0,
          volume24h: p.volume?.h24 || 0,
          txns24h: p.txns?.h24?.buys + p.txns?.h24?.sells || 0,
          pairUrl: p.url,
          miniChart: `https://dexscreener.com/${p.chainId}/${p.pairAddress}`, // ✅ embeddable mini chart
        }));

        return {
          source: "dexscreener",
          type: "token_pairs",
          results: pairs,
        };
      }
    }

    // 2️⃣ No query → global market data
    const [trending, markets] = await Promise.all([
      axios.get(`${COINGECKO_API}/search/trending`),
      axios.get(`${COINGECKO_API}/coins/markets`, {
        params: { vs_currency: "usd", order: "market_cap_desc", per_page: 50 },
      }),
    ]);

    const topGainers = [...markets.data]
      .sort(
        (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h
      )
      .slice(0, 10);

    const topLosers = [...markets.data]
      .sort(
        (a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h
      )
      .slice(0, 10);

    return {
      source: "coingecko",
      type: "market_summary",
      trending: trending.data.coins.map((c: any) => ({
        name: c.item.name,
        symbol: c.item.symbol,
        id: c.item.id,
        thumb: c.item.thumb,
        score: c.item.score,
      })),
      topGainers: topGainers.map((t: any) => ({
        id: t.id,
        name: t.name,
        symbol: t.symbol,
        priceUSD: t.current_price,
        change24h: t.price_change_percentage_24h,
        chart: `https://www.coingecko.com/en/coins/${t.id}`,
      })),
      topLosers: topLosers.map((t: any) => ({
        id: t.id,
        name: t.name,
        symbol: t.symbol,
        priceUSD: t.current_price,
        change24h: t.price_change_percentage_24h,
        chart: `https://www.coingecko.com/en/coins/${t.id}`,
      })),
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    console.warn("⚠️ Market fetch failed:", err.message);

    // 3️⃣ OKX fallback
    try {
      const okxRes = await axios.get(
        "https://www.okx.com/api/v5/market/tickers?instType=SPOT",
        { headers: { "OK-ACCESS-KEY": OKX_API_KEY || "" } }
      );
      const data = okxRes.data.data?.slice(0, 20) || [];

      return {
        source: "okx",
        type: "market_summary",
        results: data.map((t: any) => ({
          symbol: t.instId,
          last: t.last,
          high24h: t.high24h,
          low24h: t.low24h,
          volCcy24h: t.volCcy24h,
        })),
      };
    } catch (okxErr) {
      console.error("❌ OKX fallback failed:", okxErr);
      return { error: "All market data sources failed." };
    }
  }
}
