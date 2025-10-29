import { NextResponse } from "next/server";
import { fetchByAddress, fetchMarket, fetchKnowledge } from "@/lib/crypto";

/**
 * 🌍 /api/crypto
 * Handles all crypto intelligence queries via GET
 * Example:
 *   /api/crypto?query=eth
 *   /api/crypto?query=0x1234...
 *   /api/crypto → market overview
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";

    console.log(`🚀 Incoming query: ${query || "market overview"}`);

    // 1️⃣ No query → general market summary
    if (!query) {
      const market = await fetchMarket();
      return NextResponse.json({ type: "market_summary", data: market });
    }

    // 2️⃣ Try wallet/token detection
    const addressData = await fetchByAddress(query);

    // 3️⃣ Market-level data (price, trends)
    const marketData = await fetchMarket(query);

    // 4️⃣ Knowledge / summaries
    const knowledge = await fetchKnowledge(query);

    // 5️⃣ Merge
    const combined = {
      query,
      ...(addressData || {}),
      market: marketData || null,
      knowledge: knowledge || null,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(combined);
  } catch (err: any) {
    console.error("💥 /api/crypto GET error:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal API error" },
      { status: 500 }
    );
  }
}
