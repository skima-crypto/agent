import { NextResponse } from "next/server";
import { fetchKnowledgeSummary } from "@/lib/general/fetchKnowledge";

/**
 * 🧠 Agent Route — General Knowledge
 * ---------------------------------------------------------
 * Handles general knowledge or informational queries.
 * ChatGPT is the main engine, with Wikipedia/DuckDuckGo as fallbacks.
 */
export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { reply: "Please provide a valid question or topic." },
        { status: 400 }
      );
    }

    const query = message.trim();
    const reply = await fetchKnowledgeSummary(query);

    return NextResponse.json({
      reply,
      source: "general_knowledge",
      query,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error in /api/agent/general:", err);
    return NextResponse.json(
      {
        reply: "An error occurred while fetching general knowledge information.",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
