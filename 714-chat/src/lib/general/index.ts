// src/lib/general/index.ts

import { detectIntent } from "@/lib/detectIntent";
import { fetchKnowledgeSummary } from "./fetchKnowledge";
import { askChatGPT } from "@/lib/chatgptClient";

/**
 * 🎯 Main entry point for the General Agent.
 * - Detects if query is educational, creative, or factual.
 * - Chooses ChatGPT or external data accordingly.
 */
export async function getGeneralResponse(message: string): Promise<string> {
  const intent = detectIntent(message);

  // If looks like an educational / general question → external knowledge first
  if (intent === "general") {
    const info = await fetchKnowledgeSummary(message);
    return info;
  }

  // Otherwise → ChatGPT creative / language / polish
  const response = await askChatGPT(message, {
    systemPrompt:
      "You are a helpful, knowledgeable assistant skilled in education, research, and communication. " +
      "Be clear, structured, and friendly. Use markdown formatting when helpful.",
  });

  return response;
}
