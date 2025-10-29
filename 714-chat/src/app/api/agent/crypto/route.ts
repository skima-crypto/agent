import { NextResponse } from "next/server";
import { fetchByAddress, fetchMarket, fetchKnowledge } from "@/lib/crypto";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";

    console.log(`🚀 Incoming query: ${query || "market overview"}`);

    if (!query) {
      const market = await fetchMarket();
      return NextResponse.json({ type: "market_summary", data: market });
    }

    const addressData = await fetchByAddress(query);
    const marketData = await fetchMarket(query);
    const knowledge = await fetchKnowledge(query);

    return NextResponse.json({
      query,
      ...(addressData || {}),
      market: marketData || null,
      knowledge: knowledge || null,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("💥 /api/crypto GET error:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal API error" },
      { status: 500 }
    );
  }
}
