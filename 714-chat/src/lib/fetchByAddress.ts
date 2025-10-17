// src/lib/fetchByAddress.ts
export interface TokenByAddressResult {
  id: string; // coingecko id
  name: string;
  symbol: string;
  image: string;
  price: string;
  change: string;
  chartPoints: number[];
  description: string;
  slug?: string;
  platform: string; // which platform matched (ethereum, polygon-pos, solana, ...)
}

/**
 * Try to resolve a token by contract address across platforms.
 * Accepts raw address string and optional chain hint (e.g. "ethereum", "solana").
 */
export async function fetchTokenByAddress(
  address: string,
  chainHint?: string
): Promise<TokenByAddressResult | string> {
  try {
    if (!address || typeof address !== "string") return "Invalid address";

    const normalized = address.trim();

    // Quick normalizers
    const isEvm = /^0x[0-9a-fA-F]{20,}$/.test(normalized);
    const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(normalized); // rough base58
    // If chainHint given, prefer it
    const preferPlatforms: string[] = [];

    if (chainHint) preferPlatforms.push(chainHint.toLowerCase());

    // Popular CoinGecko platform ids (order affects lookup speed)
    const knownPlatforms = [
      "ethereum",
      "polygon-pos",
      "binance-smart-chain",
      "avalanche",
      "optimism",
      "arbitrum-one",
      "fantom",
      "celo",
      "tron",
      "solana",
      "base", // might or might not exist — we'll still attempt via list fallback
    ];

    // If EVM-like and no hint, try common EVM platforms first
    const evmFirst = isEvm
      ? ["ethereum", "polygon-pos", "binance-smart-chain", "avalanche", "optimism", "arbitrum-one", "base"]
      : [];

    const platformCandidates = [
      ...new Set([...preferPlatforms, ...evmFirst, ...knownPlatforms]),
    ];

    // 1) Try CoinGecko contract endpoint for each platform candidate (works for EVM-style platforms)
    for (const platform of platformCandidates) {
      // CoinGecko contract endpoints often expect platforms like "ethereum", "polygon-pos", "binance-smart-chain", "avalanche", "optimism", "arbitrum-one"
      // Some platforms may not support contract endpoint — handle with try/catch
      try {
        // Many CoinGecko contract endpoints use the path /coins/{platform}/contract/{contract_address}
        const url = `https://api.coingecko.com/api/v3/coins/${platform}/contract/${encodeURIComponent(
          normalized
        )}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`;
        const res = await fetch(url);
        if (!res.ok) {
          // 404 or rate limit -> continue to next
          continue;
        }
        const data = await res.json();
        if (data?.id && data?.market_data) {
          const market = data.market_data;
          const price = market.current_price?.usd;
          const change24 = market.price_change_percentage_24h;
          const chartPoints: number[] = market.sparkline_7d?.price || [];

          const result: TokenByAddressResult = {
            id: data.id,
            name: data.name || data.symbol || "Unknown",
            symbol: (data.symbol || "").toUpperCase(),
            image: data.image?.thumb || "",
            price:
              typeof price === "number"
                ? price.toLocaleString("en-US", { style: "currency", currency: "USD" })
                : "N/A",
            change: typeof change24 === "number" ? change24.toFixed(2) : "N/A",
            chartPoints: Array.isArray(chartPoints) ? chartPoints : [],
            description:
              (data?.description?.en && data.description.en.split("\n")[0].split(".")[0]) ||
              `No description for ${data.name || data.id}.`,
            platform,
          };
          return result;
        }
      } catch (err) {
        // ignore and continue trying
        console.warn("contract lookup error for platform", platform, err);
        continue;
      }
    }

    // 2) Fallback: fetch full coin list with platforms (cached recommended)
    // Note: /coins/list?include_platform=true returns an array where each item has `platforms` mapping
    const listUrl = `https://api.coingecko.com/api/v3/coins/list?include_platform=true`;
    const listRes = await fetch(listUrl);
    if (!listRes.ok) return `Unable to search CoinGecko list (status ${listRes.status})`;
    const coins: any[] = await listRes.json();

    // Normalize address to lower for comparison
    const lowerAddr = normalized.toLowerCase();

    // Search through coins' platforms map
    const match = coins.find((c) => {
      if (!c.platforms) return false;
      for (const [platform, addr] of Object.entries(c.platforms)) {
        if (!addr) continue;
        if (addr.toString().toLowerCase() === lowerAddr) return true;
      }
      return false;
    });

    if (!match) {
      return `No token found on CoinGecko for address ${normalized}.`;
    }

    // Now fetch coin details by id
    const coinId = match.id;
    const detailUrl = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`;
    const dRes = await fetch(detailUrl);
    if (!dRes.ok) {
      return `Failed to fetch coin details for ${coinId}`;
    }
    const coinData = await dRes.json();
    const market = coinData.market_data;
    const price = market?.current_price?.usd;
    const change24 = market?.price_change_percentage_24h;
    const chartPoints = market?.sparkline_7d?.price || [];

    // try to detect which platform matched (scan platforms)
    let matchedPlatform = "unknown";
    for (const [platform, addr] of Object.entries(match.platforms || {})) {
      if (!addr) continue;
      if (addr.toString().toLowerCase() === lowerAddr) {
        matchedPlatform = platform;
        break;
      }
    }

    const result: TokenByAddressResult = {
      id: coinData.id,
      name: coinData.name || match.name || coinData.id,
      symbol: (coinData.symbol || "").toUpperCase(),
      image: coinData.image?.thumb || "",
      price:
        typeof price === "number"
          ? price.toLocaleString("en-US", { style: "currency", currency: "USD" })
          : "N/A",
      change: typeof change24 === "number" ? change24.toFixed(2) : "N/A",
      chartPoints: Array.isArray(chartPoints) ? chartPoints : [],
      description:
        (coinData?.description?.en && coinData.description.en.split("\n")[0].split(".")[0]) ||
        `No description available for ${coinData.name || coinData.id}.`,
      platform: matchedPlatform,
    };

    return result;
  } catch (err) {
    console.error("fetchTokenByAddress error:", err);
    return "Something went wrong while searching token by address.";
  }
}
