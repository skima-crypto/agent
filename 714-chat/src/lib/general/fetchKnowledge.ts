// src/lib/general/fetchKnowledge.ts

import { fetchWikipediaSummary, fetchDuckDuckGoInfo, truncate } from "./tools";
import { askChatGPT } from "@/lib/chatgptClient";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * 🌐 Fetch knowledge using ChatGPT as the main source,
 * with Wikipedia/DuckDuckGo as fallbacks only if ChatGPT fails.
 * 🖼️ Supports image generation prompts using OpenAI's image API.
 */
export async function fetchKnowledgeSummary(query: string): Promise<{
  reply: string;
  image?: string;
}> {
  const cleanQ = query.trim();

  // 🖼️ Detect image-related prompt
  const imageTriggers = [
    "generate an image of",
    "create an image of",
    "draw",
    "show me",
    "illustrate",
    "visualize",
    "render",
  ];
  const isImagePrompt = imageTriggers.some((t) =>
    cleanQ.toLowerCase().startsWith(t)
  );

  // 🧩 1️⃣ Handle image generation requests
  if (isImagePrompt) {
    try {
      const prompt = cleanQ.replace(
        new RegExp(`^(${imageTriggers.join("|")})`, "i"),
        ""
      ).trim();

      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size: "1024x1024",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Image generation failed:", data);
        throw new Error(data.error?.message || "Image API error");
      }

      const imageUrl = data.data?.[0]?.url;
      return {
        reply: `🖼️ Generated Image for: **${prompt}**`,
        image: imageUrl,
      };
    } catch (error: any) {
      console.error("Image generation error:", error);
      return {
        reply:
          "⚠️ Sorry, image generation failed. Please try again later or simplify your prompt.",
      };
    }
  }

  // 🤖 2️⃣ Normal text response via ChatGPT
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
    return { reply: `🤖 **AI Response:**\n${truncate(chatResponse, 900)}` };
  }

  // 📘 3️⃣ Wikipedia fallback
  const wiki = await fetchWikipediaSummary(cleanQ);
  if (wiki) return { reply: `📘 **Wikipedia Summary:**\n${truncate(wiki)}` };

  // 🦆 4️⃣ DuckDuckGo fallback
  const duck = await fetchDuckDuckGoInfo(cleanQ);
  if (duck) return { reply: `🦆 **DuckDuckGo Info:**\n${truncate(duck)}` };

  // ❌ 5️⃣ Nothing found
  return {
    reply: "⚠️ Sorry, I couldn’t find reliable information about that topic right now.",
  };
}
