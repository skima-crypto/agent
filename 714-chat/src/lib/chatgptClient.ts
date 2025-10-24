// src/lib/chatgptClient.ts

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

interface ChatCompletionOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 🧠 Simple wrapper around ChatGPT API
 */
export async function askChatGPT(
  prompt: string,
  opts: ChatCompletionOptions = {}
): Promise<string> {
  const { systemPrompt, temperature = 0.7, maxTokens = 800 } = opts;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI API error: ${text}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "No response.";
  } catch (err) {
    console.error("ChatGPT request error:", err);
    return "I'm sorry, something went wrong while processing your request.";
  }
}
