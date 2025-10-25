// src/lib/crypto/index.ts

import { fetchByAddress } from "./fetchByAddress";
import { fetchMarket } from "./fetchMarket";
import { fetchKnowledge } from "./fetchKnowledge";
// (Optional future addition)
// import { fetchToken } from "./fetchToken";

export {
  fetchByAddress,
  fetchMarket,
  fetchKnowledge,
  // fetchToken, // uncomment when added
};

/**
 * 🧩 Unified crypto data toolkit
 * - fetchByAddress → auto-detects and fetches wallet/token data
 * - fetchMarket → trending, top gainers/losers, and token prices
 * - fetchKnowledge → generates rich context & summaries
 *
 * Usage:
 * import { fetchMarket, fetchByAddress, fetchKnowledge } from "@/lib/crypto";
 */
