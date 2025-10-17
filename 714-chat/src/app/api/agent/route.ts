// src/app/api/agent/route.ts

import { NextResponse } from "next/server";
import { detectIntent } from "@/lib/detectIntent";
import { fetchCrypto, CryptoData } from "@/lib/fetchCrypto";
import { fetchKnowledgeSummary } from "@/lib/fetchKnowledge";
import { fetchTokenByAddress } from "@/lib/fetchByAddress";

/* --------------------------------------------------------
   🔍 Helper: detect if input looks like a contract address
--------------------------------------------------------- */
function looksLikeAddress(q: string): boolean {
  if (!q) return false;
  const t = q.trim();
  // EVM-style
  if (/^0x[0-9a-fA-F]{40}$/.test(t)) return true;
  // Solana or Base58-like
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(t)) return true;
  return false;
}

/* --------------------------------------------------------
   🚀 MAIN ROUTE
--------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { reply: "Please provide a valid message." },
        { status: 400 }
      );
    }

    const cleaned = message.trim();

    /* --------------------------------------------------------
       🧩 STEP 1: Contract Address Mode
    --------------------------------------------------------- */
    if (looksLikeAddress(cleaned)) {
      const tokenData = await fetchTokenByAddress(cleaned);

      if (typeof tokenData === "string") {
        return NextResponse.json({ reply: tokenData });
      }

      const chartPreview = tokenData.chartPoints?.length
        ? tokenData.chartPoints.slice(-10).map((p) => p.toFixed(2)).join(" → ")
        : "No chart data";

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
        contractAddress: cleaned,
        slug:
          tokenData.slug ||
          tokenData.symbol?.toLowerCase() ||
          tokenData.name?.toLowerCase(),
      });
    }

    /* --------------------------------------------------------
       🧠 STEP 2: Detect Intent
    --------------------------------------------------------- */
    const intent = detectIntent(cleaned);

    /* --------------------------------------------------------
       💰 CRYPTO PRICE / MARKET INFO
    --------------------------------------------------------- */
    if (intent === "crypto_price") {
      const result = await fetchCrypto(cleaned);

      if (typeof result === "string") {
        return NextResponse.json({ reply: result });
      }

      const crypto = result as CryptoData;

      const chartPreview = crypto.chartPoints?.length
        ? crypto.chartPoints.slice(-10).map((p) => p.toFixed(2)).join(" → ")
        : "No chart data";

      const reply = `**${crypto.name} (${crypto.symbol})**
💰 Price: ${crypto.price}
📉 24h Change: ${crypto.change ?? "N/A"}%
📖 ${crypto.description || "No summary available"}
🪙 Chart (last points): ${chartPreview}`;

      return NextResponse.json({
        reply,
        image: crypto.image,
        chartPoints: crypto.chartPoints,
        slug:
          crypto.slug ||
          crypto.symbol?.toLowerCase() ||
          crypto.name?.toLowerCase(),
      });
    }

    /* --------------------------------------------------------
       🌐 KNOWLEDGE (network, company, project, or general info)
    --------------------------------------------------------- */
    if (
      ["crypto_info", "network_info", "company_info"].includes(intent)
    ) {
      const knowledge = await fetchKnowledgeSummary(cleaned);
      return NextResponse.json({ reply: knowledge });
    }

    /* --------------------------------------------------------
       🗣️ DEFAULT RESPONSE
    --------------------------------------------------------- */
    return NextResponse.json({
      reply: `I'm your **Crypto AI Agent 🤖** — try asking me:
- \`$BTC price\`
- \`Who founded Base network?\`
- \`When was Ethereum launched?\`
- Paste a token address (e.g. \`0x...\`) for live info + chart!
- Or ask about any project, token, or blockchain!`,
    });
  } catch (err) {
    console.error("Agent route error:", err);
    return NextResponse.json(
      { reply: "Something went wrong while processing your request." },
      { status: 500 }
    );
  }
}
