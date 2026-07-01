import type { AppData, KospiBenchmark, StockQuote, StockSummary } from "./types";

/** 보유 종목 가중 전일比 수익률 % */
export function computePortfolioDayChange(
  stocks: AppData["stocks"],
  summaries: Record<string, StockSummary>,
  stockQuotes: Record<string, StockQuote> | undefined
): number | null {
  if (!stockQuotes) return null;

  let marketValue = 0;
  let prevValue = 0;

  for (const s of stocks) {
    const qty = summaries[s.id]?.holdingQty ?? 0;
    if (qty <= 0) continue;
    const q = stockQuotes[s.id];
    if (!q || q.prevClose <= 0) continue;
    marketValue += q.price * qty;
    prevValue += q.prevClose * qty;
  }

  if (prevValue <= 0) return null;
  return ((marketValue - prevValue) / prevValue) * 100;
}

export function compareToKospi(
  portfolioDayChange: number | null,
  kospi: KospiBenchmark | undefined
): { portfolio: number | null; kospi: number | null; alpha: number | null } {
  const k = kospi?.changeRate ?? null;
  if (portfolioDayChange == null || k == null) {
    return { portfolio: portfolioDayChange, kospi: k, alpha: null };
  }
  return {
    portfolio: portfolioDayChange,
    kospi: k,
    alpha: portfolioDayChange - k,
  };
}

export function changeTone(rate: number | null | undefined): "gain" | "loss" | "neutral" {
  if (rate == null || rate === 0) return "neutral";
  return rate > 0 ? "gain" : "loss";
}
