// src/lib/fetchKnowledge.ts

export async function fetchKnowledgeSummary(query: string) {
  const formatted = query.trim().toLowerCase();

  try {
    // 1️⃣ Base ecosystem and Covalent analytics
    const base = await tryBaseChain(formatted);
    if (base) return base;

    const covalent = await tryCovalent(formatted);
    if (covalent) return covalent;

    // 2️⃣ CoinGecko token / project details
    const gecko = await tryCoinGecko(formatted);
    if (gecko) return gecko;

    // 3️⃣ CryptoCompare or CoinMarketCap news
    const marketNews = await tryCryptoCompare(formatted);
    if (marketNews) return marketNews;

    // 4️⃣ DeFi + L2 protocols
    const defi = await tryDefiLlama(formatted);
    if (defi) return defi;

    const l2beat = await tryL2Beat(formatted);
    if (l2beat) return l2beat;

    // 5️⃣ General fallback
    const wiki = await tryWiki(formatted);
    if (wiki) return wiki;

    const panic = await tryCryptoPanic(formatted);
    if (panic) return panic;

    const duck = await tryDuckDuckGo(formatted);
    if (duck) return duck;

    return `I couldn’t find reliable crypto or Base-related info about "${query}".`;

  } catch (error) {
    console.error("fetchKnowledgeSummary error:", error);
    return "⚠️ Something went wrong fetching crypto intelligence.";
  }
}

// 🟦 BaseChain details via BaseScan
async function tryBaseChain(query: string) {
  try {
    if (query.includes("base")) {
      const res = await fetch("https://api.basescan.org/api?module=stats&action=chaininfo");
      const json = await res.json();
      if (json?.result?.chainid)
        return `🟦 Base Chain: Coinbase’s Layer 2 built on the OP Stack (Chain ID: ${json.result.chainid}).`;
    }
  } catch {}
  return null;
}

// 🧠 Covalent — Base on-chain data
async function tryCovalent(query: string) {
  try {
    // Free demo key works fine for Base testnet/mainnet
    const API_KEY = process.env.NEXT_PUBLIC_COVALENT_KEY || "ckey_demo";
    const chainId = 8453; // Base Mainnet

    // Token info lookup
    const tokenRes = await fetch(`https://api.covalenthq.com/v1/${chainId}/tokens/?key=${API_KEY}`);
    const data = await tokenRes.json();
    const found = data.data.items?.find((t: any) =>
      t.contract_name?.toLowerCase().includes(query) ||
      t.contract_ticker_symbol?.toLowerCase().includes(query)
    );

    if (found)
      return `🧩 Covalent: ${found.contract_name} (${found.contract_ticker_symbol}) — contract: ${found.contract_address.slice(0, 8)}... on Base.`;

    // Fallback: Base network stats
    const statsRes = await fetch(`https://api.covalenthq.com/v1/${chainId}/block_v2/latest/?key=${API_KEY}`);
    const stats = await statsRes.json();
    if (query.includes("gas") || query.includes("transaction"))
      return `⛽ Base Network: Latest block ${stats.data.items[0].height} with gas used ${stats.data.items[0].gas_used}.`;

  } catch (err) {
    console.warn("Covalent fetch error", err);
  }
  return null;
}

// 💰 CoinGecko
async function tryCoinGecko(query: string) {
  try {
    const search = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`);
    const json = await search.json();
    const coin = json.coins?.[0];
    if (!coin) return null;

    const details = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false`);
    const data = await details.json();
    const desc = data.description?.en?.split(".")[0];
    if (desc) return `💰 ${data.name}: ${desc}.`;
  } catch {}
  return null;
}

// 📰 CryptoCompare
async function tryCryptoCompare(query: string) {
  try {
    const res = await fetch(`https://min-api.cryptocompare.com/data/v2/news/?lang=EN`);
    const data = await res.json();
    const match = data.Data.find((n: any) =>
      n.title.toLowerCase().includes(query)
    );
    if (match) return `📰 CryptoCompare: ${match.title}`;
  } catch {}
  return null;
}

// 🦙 DeFiLlama
async function tryDefiLlama(query: string) {
  try {
    const res = await fetch("https://api.llama.fi/protocols");
    const list = await res.json();
    const found = list.find((p: any) =>
      p.name.toLowerCase().includes(query)
    );
    if (found) return `🦙 ${found.name}: ${found.description || "No description available."}`;
  } catch {}
  return null;
}
// ⚡ L2Beat
async function tryL2Beat(query: string) {
  try {
    const res = await fetch("https://l2beat.com/api/scaling/tvl.json");
    const list = await res.json();
    const projects = Object.values(list.projects || {});
    const found = (projects as any[]).find(
      (p) => (p as any).name?.toLowerCase()?.includes(query)
    );
    if (found)
      return `⚡ ${(found as any).name} L2: ${(found as any).purpose || "Layer 2 scaling solution"}.`;
  } catch {}
  return null;
}


// 📘 Wikipedia
async function tryWiki(query: string) {
  try {
    const q = query.replace(/\s+/g, "_");
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${q}`);
    if (res.ok) {
      const data = await res.json();
      return data.extract ? `📘 Wikipedia: ${data.extract}` : null;
    }
  } catch {}
  return null;
}

// 🗞️ CryptoPanic
async function tryCryptoPanic(query: string) {
  try {
    const res = await fetch(`https://cryptopanic.com/api/v1/posts/?auth_token=demo&public=true&kind=news&currencies=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const first = data.results?.[0];
    if (first?.title) return `🗞️ CryptoPanic: ${first.title}`;
  } catch {}
  return null;
}

// 🔎 DuckDuckGo
async function tryDuckDuckGo(query: string) {
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
    const data = await res.json();
    if (data.AbstractText) return `🔎 ${data.AbstractText}`;
  } catch {}
  return null;
}
