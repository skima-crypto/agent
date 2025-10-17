// src/lib/fetchCrypto.ts

export interface CryptoData {
  name: string;
  symbol: string;
  price: string; // formatted USD string
  change: string; // always string (never null)
  chartPoints: number[]; // sparkline 7d points
  image: string;
  slug?: string; 
  description: string;
}

export async function fetchCrypto(rawQuery: string): Promise<CryptoData | string> {
  try {
    const term = extractCoinQuery(rawQuery);
    if (!term) {
      return `I couldn't determine which crypto you're asking about. Try "$BTC" or "price of solana".`;
    }

    const lower = term.toLowerCase();

    // 🎯 mapping for common ambiguous names & Base ecosystem
    const coinMap: Record<string, string> = {
      base: "base-protocol", // Base network
      "base-protocol": "base-protocol",
      coinbase: "coinbase-stock",
      optimism: "optimism",
      arbitrum: "arbitrum",
      ethereum: "ethereum",
      eth: "ethereum",
      sol: "solana",
      solana: "solana",
      ada: "cardano",
      cardano: "cardano",
      bnb: "binancecoin",
      btc: "bitcoin",
      bitcoin: "bitcoin",
      doge: "dogecoin",
      dogecoin: "dogecoin",
      avax: "avalanche-2",
      polygon: "matic-network",
      matic: "matic-network",
      zksync: "zksync-era",
      blast: "blast",
      tron: "tron",
      ton: "the-open-network",
      linea: "linea",
      baseeth: "ethereum", // special case for “base eth”
      "base-eth": "ethereum",
    };

    // primary lookup
    let coinId: string | null = coinMap[lower] || null;

if (!coinId) {
  coinId = await findCoinId(lower);
}

if (!coinId) {
  return `I couldn't find any crypto project called "${term}".`;
}

    // fetch coin details (include sparkline)
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`;
    const res = await fetch(url);
    if (!res.ok) {
      return `Failed to fetch data for "${term}".`;
    }

    const data = await res.json();
    if (!data?.market_data) {
      return `Couldn't load detailed info for "${term}".`;
    }

    const market = data.market_data;
    const currentPrice = market.current_price?.usd;
    const change24 = market.price_change_percentage_24h;
    const chartPoints: number[] = market.sparkline_7d?.price || [];

    const formattedPrice =
      typeof currentPrice === "number"
        ? currentPrice.toLocaleString("en-US", { style: "currency", currency: "USD" })
        : "N/A";

    const reply: CryptoData = {
      name: data.name || "Unknown",
      symbol: (data.symbol || "").toUpperCase(),
      price: formattedPrice,
      change: typeof change24 === "number" ? change24.toFixed(2) : "N/A",
      chartPoints: Array.isArray(chartPoints) ? chartPoints : [],
      image: data.image?.thumb || "",
      description:
        (data?.description?.en &&
          data.description.en.split("\n")[0].split(".")[0]) ||
        `No short description available for ${data.name || "this coin"}.`,
    };

    return reply;
  } catch (err) {
    console.error("fetchCrypto error:", err);
    return "Something went wrong while fetching crypto data.";
  }
}

/**
 * Find potential coin id using CoinGecko search endpoint.
 */
async function findCoinId(term: string): Promise<string | null> {
  try {
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(term)}`;
    const res = await fetch(searchUrl);
    if (!res.ok) return null;
    const json = await res.json();

    // try matching Base network or Base ETH
    const match =
      json.coins?.find(
        (c: any) =>
          c.id?.includes("base") ||
          c.name?.toLowerCase().includes(term) ||
          c.symbol?.toLowerCase() === term
      ) || json.coins?.[0];

    return match?.id || null;
  } catch (err) {
    console.error("findCoinId error:", err);
    return null;
  }
}

/**
 * Extracts the most likely coin token/name from user's free-text query.
 */
function extractCoinQuery(message: string): string | null {
  if (!message || typeof message !== "string") return null;
  const original = message.trim();

  // 1) Match $TICKER (like $ETH or $BASE)
  const dollar = original.match(/\$([a-zA-Z0-9]{1,10})/);
  if (dollar && dollar[1]) return dollar[1];

  const lower = original.toLowerCase();
  const cleaned = lower.replace(/[?.,!()]/g, " ");

  // remove filler words
  const noisePattern = /\b(price|chart|current|today|show|what|is|the|of|please|tell|me|how|much|worth|in|usd|network|token|coin|crypto)\b/gi;
  const cleaned2 = cleaned.replace(noisePattern, " ").replace(/\s+/g, " ").trim();

  if (!cleaned2) return null;

  const tokens = cleaned2.split(" ");
  const candidates = [tokens[0], tokens[tokens.length - 1], tokens.slice(0, 2).join(" ")];

  for (const c of candidates) {
    if (c && c.length > 1) return c;
  }

  return tokens[tokens.length - 1] || null;
}
