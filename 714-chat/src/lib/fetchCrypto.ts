// src/lib/fetchCrypto.ts

export interface CryptoData {
  name: string;
  symbol: string;
  price: string;
  change: string;
  chartPoints: number[];
  image: string;
  slug?: string;
  description: string;
}

/**
 * Fetch crypto data intelligently from Covalent (multi-chain)
 * with fallback to CoinGecko for unmatched assets.
 */
export async function fetchCrypto(rawQuery: string): Promise<CryptoData | string> {
  try {
    const term = extractCoinQuery(rawQuery);
    if (!term) {
      return `I couldn’t determine which crypto you meant. Try "$BTC" or "price of solana".`;
    }

    const apiKey = process.env.NEXT_PUBLIC_COVALENT_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ Missing Covalent API key!");
    }

    const searchTerm = term.toLowerCase();

    // 🔹 Try fetching from Covalent across all supported chains
    const covalentUrl = `https://api.covalenthq.com/v1/pricing/tickers/?tickers=${encodeURIComponent(
      searchTerm
    )}&key=${apiKey}`;

    const covalentRes = await fetch(covalentUrl);
    const covalentJson = await covalentRes.json();

    const found =
      covalentJson?.data?.items?.find(
        (t: any) =>
          t.contract_ticker_symbol?.toLowerCase() === searchTerm ||
          t.contract_name?.toLowerCase().includes(searchTerm)
      ) ||
      covalentJson?.data?.items?.[0];

    if (found) {
      // ✅ Build response
      return {
        name: found.contract_name || found.label || "Unknown Token",
        symbol: found.contract_ticker_symbol?.toUpperCase() || searchTerm.toUpperCase(),
        price: found.quote_rate
          ? `$${Number(found.quote_rate).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}`
          : "N/A",
        change:
          found.quote_rate_24h && found.quote_rate
            ? (((found.quote_rate - found.quote_rate_24h) / found.quote_rate_24h) * 100).toFixed(2)
            : "N/A",
        chartPoints: [], // Covalent free tier doesn’t provide sparkline yet
        image:
          found.logo_url ||
          `https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png`, // fallback
        description: `Live price data fetched from Covalent for ${found.contract_name}.`,
        slug: found.contract_address || found.contract_ticker_symbol?.toLowerCase(),
      };
    }

    // 🔸 Fallback: CoinGecko
    const fallback = await fetchFromCoinGecko(searchTerm);
    if (fallback) return fallback;

    return `Couldn't find data for "${term}". Try another token or network.`;
  } catch (err) {
    console.error("fetchCrypto error:", err);
    return "Something went wrong while fetching crypto data.";
  }
}

/**
 * Fallback: fetch from CoinGecko if Covalent has no match
 */
async function fetchFromCoinGecko(term: string): Promise<CryptoData | null> {
  try {
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(term)}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchJson = await searchRes.json();
    const match = searchJson.coins?.find(
      (c: any) =>
        c.id?.includes(term) ||
        c.name?.toLowerCase().includes(term) ||
        c.symbol?.toLowerCase() === term
    );

    if (!match?.id) return null;

    const coinUrl = `https://api.coingecko.com/api/v3/coins/${match.id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`;
    const res = await fetch(coinUrl);
    if (!res.ok) return null;

    const data = await res.json();
    const market = data.market_data;

    const formattedPrice = market?.current_price?.usd
      ? market.current_price.usd.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })
      : "N/A";

    return {
      name: data.name || "Unknown",
      symbol: data.symbol?.toUpperCase() || "N/A",
      price: formattedPrice,
      change: market?.price_change_percentage_24h?.toFixed(2) || "N/A",
      chartPoints: market?.sparkline_7d?.price || [],
      image: data.image?.thumb || "",
      slug: data.id,
      description:
        (data.description?.en &&
          data.description.en.split("\n")[0].split(".")[0]) ||
        `No description available for ${data.name}.`,
    };
  } catch (e) {
    console.error("CoinGecko fallback failed:", e);
    return null;
  }
}

/**
 * Extracts probable token name/ticker from user text.
 */
function extractCoinQuery(message: string): string | null {
  if (!message || typeof message !== "string") return null;
  const text = message.trim().toLowerCase();

  const matchDollar = text.match(/\$([a-z0-9]{2,10})/i);
  if (matchDollar && matchDollar[1]) return matchDollar[1];

  const cleaned = text.replace(/[?.,!]/g, " ");
  const ignore = /\b(price|chart|token|coin|crypto|worth|show|value|network|today|usd|please|tell|me|info|data)\b/g;
  const words = cleaned.replace(ignore, " ").split(/\s+/).filter(Boolean);

  return words.length ? words[0] : null;
}
