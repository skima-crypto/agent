// src/lib/detectIntent.ts
import Fuse from "fuse.js";
import { cleanInput, looksLikeAddress } from "./utils";

const cryptoKeywords = [
  "price", "token", "coin", "market", "chart", "address", "base", "defi", "supply", "cap",
];
const generalKeywords = [
  "define", "explain", "translate", "rephrase", "food", "learn", "study", "english",
];

const fuseCrypto = new Fuse(cryptoKeywords, { threshold: 0.4 });
const fuseGeneral = new Fuse(generalKeywords, { threshold: 0.4 });

/**
 * 🔍 Detects intent: "crypto" | "general"
 */
export function detectIntent(message: string): "crypto" | "general" {
  const text = cleanInput(message);

  if (looksLikeAddress(text)) return "crypto";
  if (text.startsWith("$") || fuseCrypto.search(text).length > 0) return "crypto";
  if (fuseGeneral.search(text).length > 0) return "general";

  // fallback: guess based on keywords
  if (/\b(price|token|btc|eth|sol|base|coin)\b/i.test(text)) return "crypto";
  return "general";
}
