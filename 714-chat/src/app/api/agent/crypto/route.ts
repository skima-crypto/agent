// src/app/api/crypto/route.ts
import { NextResponse } from "next/server";
import { fetchToken } from "@/lib/crypto/fetchToken";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const trimmed = query?.trim();

    console.log(`🚀 Incoming crypto query: ${trimmed || "market overview"}`);

    if (!trimmed) {
      return NextResponse.json({
        error: "Please enter a token name, symbol, or contract address.",
      });
    }

    // main fetch
    const tokenData = await fetchToken(trimmed);

    if (tokenData?.error) {
      return NextResponse.json(
        { error: tokenData.error, query: trimmed },
        { status: 404 }
      );
    }

    return NextResponse.json({
      type: "token_info",
      query: trimmed,
      data: tokenData,
    });
  } catch (err: any) {
    console.error("💥 /api/crypto POST error:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
