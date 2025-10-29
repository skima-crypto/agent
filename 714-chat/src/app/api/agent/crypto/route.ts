import { NextResponse } from "next/server";
import { fetchByAddress, fetchMarket, fetchKnowledge } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const trimmed = query?.trim() || "";

    console.log(`🚀 Incoming query: ${trimmed || "market overview"}`);

    // no query → general market summary
    if (!trimmed) {
      const market = await fetchMarket();
      return NextResponse.json({ type: "market_summary", data: market });
    }

    const addressData = await fetchByAddress(trimmed);
    const marketData = await fetchMarket(trimmed);
    const knowledge = await fetchKnowledge(trimmed);

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
