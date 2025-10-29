import { NextResponse } from "next/server";
import { fetchByAddress } from "@/lib/crypto/fetchByAddress";   // ✅ make sure this exists
import { fetchMarket } from "@/lib/crypto/fetchMarket";
import { fetchKnowledge } from "@/lib/crypto/fetchKnowledge";

/* -----------------------------------------------
   ✅ Handle GET requests
------------------------------------------------ */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";

    console.log(`🚀 [GET] /api/crypto query: ${query || "market overview"}`);

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
      { error: err.message || "Internal API error (GET)" },
      { status: 500 }
    );
  }
}

/* -----------------------------------------------
   ✅ Handle POST requests
------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    console.log(`🚀 [POST] /api/crypto query: ${query || "market overview"}`);

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
    console.error("💥 /api/crypto POST error:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal API error (POST)" },
      { status: 500 }
    );
  }
}
