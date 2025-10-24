// src/lib/general/tools.ts

import { safeFetch } from "@/lib/utils";

/** 🧹 Clean text from HTML and formatting */
export function cleanText(text: string): string {
  return text
    .replace(/<\/?[^>]+(>|$)/g, "") // remove HTML tags
    .replace(/\s+/g, " ")
    .trim();
}

/** ✂️ Truncate text for brevity */
export function truncate(text: string, length = 400): string {
  if (!text) return "";
  return text.length > length ? text.slice(0, length) + "..." : text;
}

/** 🌐 Fetch Wikipedia summary */
export async function fetchWikipediaSummary(query: string): Promise<string | null> {
  const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    query
  )}`;
  const res = await safeFetch<any>(apiUrl);
  if (!res) return null;

  const summary = res.extract || res.description;
  return summary ? cleanText(summary) : null;
}

/** 🦆 Fallback: DuckDuckGo Instant Answer API */
export async function fetchDuckDuckGoInfo(query: string): Promise<string | null> {
  const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(
    query
  )}&format=json&no_redirect=1&no_html=1`;
  const res = await safeFetch<any>(apiUrl);
  if (!res) return null;

  if (res.AbstractText) return cleanText(res.AbstractText);
  if (res.RelatedTopics?.length)
    return cleanText(res.RelatedTopics[0].Text || "");
  return null;
}
