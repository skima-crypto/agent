// src/lib/detectIntent.ts

export type IntentType =
  | "crypto_price"
  | "crypto_info"
  | "company_info"
  | "network_info"
  | "general";

export function detectIntent(message: string): IntentType {
  const lower = message.toLowerCase();

  // 🔹 Match crypto ticker or project symbols like $BTC, $SOL, etc.
  const hasCryptoSymbol =
    /\$[a-zA-Z]{2,10}/.test(lower) ||
    /(bitcoin|ethereum|solana|cardano|bnb|base|dogecoin|tron|xrp|avax|ton|optimism|arbitrum|zksync|polygon|blast|scroll|linea)/.test(
      lower
    );

  // 💰 Price-related queries
  if (hasCryptoSymbol && /(price|chart|value|worth|market)/.test(lower)) {
    return "crypto_price";
  }

  // 🔍 Questions about networks or protocols specifically
  if (
    /(network|chain|protocol|layer 2|rollup)/.test(lower) ||
    /(when|who|what).* (founded|created|launched|built|made)/.test(lower)
  ) {
    // If includes known network names (Base, Optimism, etc.)
    if (
      /(base|optimism|arbitrum|zksync|polygon|blast|scroll|linea)/.test(lower)
    ) {
      return "network_info";
    }
    return "crypto_info";
  }

  // 🧑‍💼 General company/person info
  if (
    /(ceo|founder|owner|who is|what is|company|project|protocol)/.test(lower)
  ) {
    return "company_info";
  }

  // 🗣️ Default
  return "general";
}
