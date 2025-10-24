// src/lib/general/fetchKnowledge.ts

import { fetchWikipediaSummary, fetchDuckDuckGoInfo, truncate } from "./tools";
import { askChatGPT } from "@/lib/chatgptClient";

/**
 * 🌐 Fetch knowledge using ChatGPT as the main source,
 * with Wikipedia/DuckDuckGo as fallbacks only if ChatGPT fails.
 */
export async function fetchKnowledgeSummary(query: string): Promise<string> {
  const cleanQ = query.trim();

  // 1️⃣ Try ChatGPT first
  const chatResponse = await askChatGPT(
    `Answer this query comprehensively and clearly: "${cleanQ}". 
If factual, ensure correctness and cite key points when relevant. 
Be concise and structured.`,
    {
      systemPrompt:
        "You are a knowledgeable AI assistant with access to general world knowledge. " +
        "You provide accurate, verified, and clear responses to educational or factual questions.",
    }
  );

  if (chatResponse && chatResponse.length > 40) {
    return `🤖 **AI Response:**\n${truncate(chatResponse, 900)}`;
  }

  // 2️⃣ ChatGPT failed → Wikipedia fallback
  const wiki = await fetchWikipediaSummary(cleanQ);
  if (wiki) return `📘 **Wikipedia Summary:**\n${truncate(wiki)}`;

  // 3️⃣ DuckDuckGo fallback
  const duck = await fetchDuckDuckGoInfo(cleanQ);
  if (duck) return `🦆 **DuckDuckGo Info:**\n${truncate(duck)}`;

  // 4️⃣ Nothing found
  return "⚠️ Sorry, I couldn’t find reliable information about that topic right now.";
}
