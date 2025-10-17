import { NextResponse } from "next/server";
import { detectIntent } from "@/lib/detectIntent";
import { fetchCrypto, CryptoData } from "@/lib/fetchCrypto";
import { fetchWikiSummary } from "@/lib/fetchWiki";
import { fetchTokenByAddress } from "@/lib/fetchByAddress"; // <-- your new util

// ✅ Helper: detect if message looks like a contract address
function looksLikeAddress(q: string): boolean {
  if (!q) return false;
  const t = q.trim();
  // EVM (0x...)
  if (/^0x[0-9a-fA-F]{40}$/.test(t)) return true;
  // Solana or Base58-like (length 32–44)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(t)) return true;
  return false;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { reply: "Please provide a valid message." },
        { status: 400 }
      );
    }

    // 🧩 STEP 1: detect if user pasted a token contract address
    const addressMatch = message.match(
      /(0x[0-9a-fA-F]{40})|([1-9A-HJ-NP-Za-km-z]{32,44})/
    );

    if (addressMatch) {
      const address = addressMatch[0];
      const tokenData = await fetchTokenByAddress(address);

      if (typeof tokenData === "string") {
        return NextResponse.json({ reply: tokenData });
      }

      // ✅ Build chart summary
      const chartPreview = tokenData.chartPoints?.length
        ? tokenData.chartPoints
            .slice(-10)
            .map((p: number) => p.toFixed(2))
            .join(" → ")
        : "No chart data";

      // ✅ Build reply
      const reply = `**${tokenData.name} (${tokenData.symbol})**
🔗 Platform: ${tokenData.platform || "Unknown"}
💰 Price: ${tokenData.price}
📉 24h Change: ${tokenData.change ?? "N/A"}%
📖 ${tokenData.description || "No description available"}
📊 Chart (latest): ${chartPreview}`;

      return NextResponse.json({
        reply,
        image: tokenData.image,
        chartPoints: tokenData.chartPoints,
        contractAddress: address,
        slug: tokenData.slug ?? tokenData.symbol?.toLowerCase(),
        
      });
    }

    // 🧠 STEP 2: otherwise handle general crypto queries
    const intent = detectIntent(message);

    switch (intent) {
      case "crypto_price": {
        const result = await fetchCrypto(message);

        if (typeof result === "string") {
          return NextResponse.json({ reply: result });
        }

        const crypto = result as CryptoData;

        const chartPreview = crypto.chartPoints.length
          ? crypto.chartPoints
              .slice(-10)
              .map((p: number) => p.toFixed(2))
              .join(" → ")
          : "No chart data";

        const reply = `**${crypto.name} (${crypto.symbol})**
💰 Price: ${crypto.price}
📉 24h Change: ${crypto.change ?? "N/A"}%
📖 ${crypto.description}
🪙 Chart (last points): ${chartPreview}`;

        return NextResponse.json({
          reply,
          image: crypto.image,
          chartPoints: crypto.chartPoints,
          slug: crypto.slug ?? crypto.symbol?.toLowerCase(),
        });
      }

      case "crypto_info":
      case "network_info":
      case "company_info": {
        const wikiSummary = await fetchWikiSummary(message);
        return NextResponse.json({ reply: wikiSummary });
      }

      case "general":
      default:
        return NextResponse.json({
          reply:
            "I'm your crypto AI agent 🤖 — try asking something like:\n" +
            "- `$BTC price`\n" +
            "- `Who founded Base network?`\n" +
            "- `When was Ethereum launched?`\n" +
            "- Paste a token contract address (e.g. `0x...`) to view **live token info + chart!**",
        });
    }
  } catch (err) {
    console.error("Agent route error:", err);
    return NextResponse.json(
      { reply: "Something went wrong while processing your request." },
      { status: 500 }
    );
  }
}

