import { NextResponse } from "next/server";

export const runtime = "edge"; // Faster cold starts for image generation

/**
 * 🖼️ POST /api/agent/general/image
 * Body: { prompt: string }
 * Response: { imageUrl?: string, error?: string }
 */
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: "Invalid prompt. Please describe your image clearly." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
      return NextResponse.json(
        { error: "Missing OpenAI API key." },
        { status: 500 }
      );

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1", // DALL·E 3 (new OpenAI image model)
        prompt: prompt,
        size: "1024x1024",
        n: 1,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.data?.[0]?.url) {
      console.error("OpenAI Image API error:", data);
      return NextResponse.json(
        { error: "Failed to generate image." },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl: data.data[0].url });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Unexpected server error during image generation." },
      { status: 500 }
    );
  }
}
