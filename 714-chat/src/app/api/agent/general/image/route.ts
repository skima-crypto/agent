import { NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * 🖼️ Image Generation Route
 * ---------------------------------------------------------
 * Handles AI image generation via OpenAI.
 */
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid image prompt." },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image." },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("❌ Error generating image:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate image.",
      },
      { status: 500 }
    );
  }
}
