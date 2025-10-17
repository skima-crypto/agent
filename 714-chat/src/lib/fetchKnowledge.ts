// src/lib/fetchKnowledge.ts

export async function fetchKnowledgeSummary(query: string) {
  const formatted = query.trim();

  try {
    // 1️⃣ Wikipedia summary
    const wiki = await tryWiki(formatted);
    if (wiki) return wiki;

    // 2️⃣ CoinGecko asset info (useful for crypto terms)
    const gecko = await tryCoinGecko(formatted);
    if (gecko) return gecko;


    // 3️⃣ CryptoPanic (real-time news headlines)
    const cryptoNews = await tryCryptoPanic(formatted);
    if (cryptoNews) return cryptoNews;

    // 4️⃣ DuckDuckGo Instant Answer fallback (non-crypto topics)
    const duck = await tryDuckDuckGo(formatted);
    if (duck) return duck;

    // 5️⃣ DefiLlama protocol info
    const defi = await tryDefiLlama(formatted);
    if (defi) return defi;

    // 6️⃣ CoinDesk RSS (keywords filter)
    const coindesk = await tryCoinDesk(formatted);
    if (coindesk) return coindesk;

    return `I couldn't find reliable info or recent news about "${formatted}".`;

  } catch (error) {
    console.error("fetchKnowledgeSummary error:", error);
    return "I had trouble fetching that info right now.";
  }
}

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

async function tryCryptoPanic(query: string) {
  try {
    const res = await fetch(`https://cryptopanic.com/api/v1/posts/?auth_token=demo&public=true&kind=news&currencies=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const first = data.results?.[0];
    if (first?.title) return `📰 Latest news: ${first.title}`;
  } catch {}
  return null;
}

async function tryDuckDuckGo(query: string) {
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
    const data = await res.json();
    if (data.AbstractText) return `🔎 ${data.AbstractText}`;
  } catch {}
  return null;
}

async function tryDefiLlama(query: string) {
  try {
    const res = await fetch("https://api.llama.fi/protocols");
    const list = await res.json();
    const found = list.find((p: any) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
    if (found) return `🦙 ${found.name}: ${found.description || "No description available."}`;
  } catch {}
  return null;
}

async function tryCoinDesk(query: string) {
  try {
    const res = await fetch("https://feeds.feedburner.com/CoinDesk");
    const xml = await res.text();
    const regex = new RegExp(`<title>(.*?)<\/title>`, "g");
    const matches = Array.from(xml.matchAll(regex)).map((m) => m[1]);
    const article = matches.find((t) => t.toLowerCase().includes(query.toLowerCase()));
    if (article) return `🗞️ CoinDesk: ${article}`;
  } catch {}
  return null;
}
