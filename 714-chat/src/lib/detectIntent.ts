// src/lib/detectIntent.ts
import Fuse from "fuse.js"

export type IntentType =
  | "crypto_price"
  | "crypto_info"
  | "network_info"
  | "company_info"
  | "market_info"
  | "news_info"
  | "rephrase"
  | "writing"
  | "general"

// 🪙 Keywords for crypto, chains, projects
const cryptoKeywords = [
  // Top chains
  "btc", "bitcoin", "eth", "ethereum", "bnb", "binance", "sol", "solana",
  "ada", "cardano", "xrp", "ripple", "avax", "avalanche", "dot", "polkadot",
  "matic", "polygon", "ton", "tron", "doge", "dogecoin", "ltc", "litecoin",
  "base", "optimism", "arbitrum", "zksync", "scroll", "linea", "blast",
  "cosmos", "atom", "celestia", "sei", "sui", "aptos", "near", "algorand",
  "starknet", "mantle", "hedera", "icp", "flow", "eos", "fantom", "moonbeam",
  "ronin", "core", "taiko", "scroll", "zeta", "mode", "frax", "blast", "zora",
  // Meme & trending
  "pepe", "shib", "floki", "bonk", "dogwifhat", "wif", "mew", "turf", "rekt",
]

// 💬 Financial & market-related words
const priceWords = [
  "price", "worth", "value", "chart", "rate", "market", "cap", "supply",
  "circulating", "trend", "increase", "decrease", "rise", "fall", "up", "down",
]

// 🌐 Network/technical terms
const networkWords = [
  "network", "chain", "layer2", "layer 2", "rollup", "bridge", "rpc", "node",
  "mainnet", "testnet", "bridge", "ecosystem", "staking", "validator",
]

// 🧠 Writing / grammar improvements
const writingWords = [
  "rephrase", "rewrite", "fix grammar", "make better", "improve", "polish",
  "simplify", "correct", "enhance", "summarize", "paraphrase",
]

// 🗞️ News / updates / general info
const newsWords = [
  "news", "update", "announcement", "launch", "event", "partnership",
  "integration", "hack", "airdrop", "scam", "release", "whats new", "today",
]

// Fuzzy matcher
const fuse = new Fuse(cryptoKeywords, { includeScore: true, threshold: 0.38 })

export function detectIntent(message: string): IntentType {
  const lower = message.toLowerCase().trim()

  // Handle empty, emoji, or numeric-only input gracefully
  if (!lower || /^[\d\s.,!?]+$/.test(lower)) {
    return "general"
  }

  // 💬 Writing or rephrase detection
  if (writingWords.some(w => lower.includes(w)) || /^polish:?/.test(lower)) {
    return "rephrase"
  }

  // 💰 Crypto detection logic
  const hasDollar = /\$[a-z]{2,10}/i.test(lower)
  const fuzzyMatch = fuse.search(lower)
  const hasCryptoWord =
    cryptoKeywords.some(k => lower.includes(k)) || fuzzyMatch.length > 0

  const hasPriceWord = priceWords.some(w => lower.includes(w))
  const hasNetworkWord = networkWords.some(w => lower.includes(w))
  const hasNewsWord = newsWords.some(w => lower.includes(w))

  // 1️⃣ Price intent
  if ((hasCryptoWord || hasDollar) && hasPriceWord) {
    return "crypto_price"
  }

  // 2️⃣ Network/chain intent
  if (hasNetworkWord && hasCryptoWord) {
    return "network_info"
  }

  // 3️⃣ Crypto info (project, tokenomics, supply, etc.)
  if (
    hasCryptoWord &&
    /(what|who|how|when|show|explain|info|details|about|project)/.test(lower)
  ) {
    return "crypto_info"
  }

  // 4️⃣ Market sentiment or overview
  if (/(market|bullish|bearish|trend|prediction|cap)/.test(lower)) {
    return "market_info"
  }

  // 5️⃣ News or announcements
  if (hasNewsWord || /(what.?new|latest|update|today)/.test(lower)) {
    return "news_info"
  }

  // 6️⃣ Company or person info
  if (/(ceo|founder|company|owner|team|who built|creator|developer)/.test(lower)) {
    return "company_info"
  }

  // 7️⃣ Short “crypto mention” only (like “btc”)
  if (hasCryptoWord || hasDollar) {
    // If user typed only 2–5 letters like “btc” or “eth”
    if (lower.length <= 6) {
      return "crypto_price"
    }
    return "crypto_info"
  }

  // 8️⃣ Writing or grammar tasks
  if (/(sentence|grammar|write|essay|caption|bio)/.test(lower)) {
    return "writing"
  }

  // 9️⃣ Fallback
  return "general"
}
