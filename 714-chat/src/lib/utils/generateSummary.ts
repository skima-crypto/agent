// src/lib/utils/generateSummary.ts

interface TokenSummary {
  name: string;
  symbol: string;
  priceUSD?: number;
  change24h?: number;
  liquidity?: number;
  volume24h?: number;
}

interface SummaryInput {
  tokens?: TokenSummary[];
  trending?: any[];
  topGainers?: any[];
  topLosers?: any[];
}

export function generateSummary(data: SummaryInput): string {
  if (!data) return "No data available.";

  const parts: string[] = [];

  if (data.trending?.length) {
    const trendingList = data.trending
      .slice(0, 5)
      .map((c: any) => c.item?.name || c.name)
      .join(", ");
    parts.push(`🔥 Trending: ${trendingList}.`);
  }

  if (data.topGainers?.length) {
    const gainer = data.topGainers[0];
    parts.push(
      `🚀 Top gainer: ${gainer.name} (${gainer.symbol}) up ${gainer.price_change_percentage_24h.toFixed(2)}% in 24h.`
    );
  }

  if (data.topLosers?.length) {
    const loser = data.topLosers[0];
    parts.push(
      `🔻 Top loser: ${loser.name} (${loser.symbol}) down ${loser.price_change_percentage_24h.toFixed(2)}% in 24h.`
    );
  }

  if (data.tokens?.length) {
    const totalValue = data.tokens.reduce((sum, t) => sum + (t.priceUSD || 0), 0);
    parts.push(`💰 Portfolio value estimate: ~$${totalValue.toFixed(2)} USD.`);
  }

  return parts.join(" ");
}
