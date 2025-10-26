// src/app/api/crypto/route.ts
import { NextResponse } from "next/server";
import { fetchByAddress, fetchMarket, fetchKnowledge } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const trimmed = query?.trim() || "";

    console.log(`🚀 Incoming query: ${trimmed || "market overview"}`);

    // 1️⃣ No query → general market summary
    if (!trimmed) {
      const market = await fetchMarket();
      return NextResponse.json({ type: "market_summary", data: market });
    }

    // 2️⃣ Try wallet/token detection
    const addressData = await fetchByAddress(trimmed);

    // 3️⃣ Market-level data (price, trends)
    const marketData = await fetchMarket(trimmed);

    // 4️⃣ Knowledge / summaries
    const knowledge = await fetchKnowledge(trimmed);

    // 5️⃣ Merge
    const combined = {
      query: trimmed,
      ...(addressData || {}),
      market: marketData || null,
      knowledge: knowledge || null,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(combined);
  } catch (err: any) {
    console.error("💥 /api/crypto POST error:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal API error" },
      { status: 500 }
    );
  }
}
