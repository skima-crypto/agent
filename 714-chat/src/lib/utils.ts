// src/lib/utils.ts

/** 🧹 Clean and normalize user input */
export function cleanInput(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/** 🌐 Safe fetch wrapper with error handling */
export async function safeFetch<T>(
  url: string,
  options: RequestInit = {},
  fallback?: T
): Promise<T | undefined> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    console.warn("safeFetch error:", err);
    return fallback;
  }
}

/** 📊 Format numbers like 12345 → 12.3K */
export function formatNumber(n: number | string | null | undefined): string {
  if (!n) return "N/A";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "N/A";
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

/** 🧠 Check if a string looks like a contract address (EVM or Base58) */
export function looksLikeAddress(q: string): boolean {
  if (!q) return false;
  const t = q.trim();
  if (/^0x[0-9a-fA-F]{40}$/.test(t)) return true;
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(t)) return true;
  return false;
}
