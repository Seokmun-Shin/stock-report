import type { StockQuote } from "@/lib/types";
import { withRetry } from "@/lib/server/fetchUtil";

function yahooSymbolsForCode(code: string): string[] {
  const c = code.replace(/\D/g, "").padStart(6, "0");
  return [`${c}.KS`, `${c}.KQ`];
}

async function fetchOneSymbol(sym: string): Promise<StockQuote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    chart?: {
      result?: {
        meta?: {
          regularMarketPrice?: number;
          chartPreviousClose?: number;
          previousClose?: number;
          regularMarketDayHigh?: number;
          regularMarketDayLow?: number;
        };
      }[];
    };
  };

  const m = data.chart?.result?.[0]?.meta;
  const price = m?.regularMarketPrice ?? 0;
  const prev = m?.chartPreviousClose ?? m?.previousClose ?? price;
  if (price <= 0) return null;

  const changeAmount = price - prev;
  const changeRate = prev > 0 ? (changeAmount / prev) * 100 : 0;

  return {
    price,
    prevClose: prev,
    changeAmount,
    changeRate,
    high: m?.regularMarketDayHigh ?? price,
    low: m?.regularMarketDayLow ?? price,
    updatedAt: new Date().toISOString(),
  };
}

/** KIS 미설정 시 Yahoo Finance 종목 시세 (코스피·코스닥 자동 판별) */
export async function fetchYahooStockQuote(code: string): Promise<StockQuote | null> {
  const normalized = code.replace(/\D/g, "").padStart(6, "0");
  for (const sym of yahooSymbolsForCode(normalized)) {
    const q = await withRetry(() => fetchOneSymbol(sym), 1, 250);
    if (q) return q;
  }
  return null;
}

export async function fetchYahooStockQuotes(codes: string[]): Promise<{
  quotes: Record<string, StockQuote>;
  prices: Record<string, number>;
  errors: Record<string, string>;
}> {
  const quotes: Record<string, StockQuote> = {};
  const prices: Record<string, number> = {};
  const errors: Record<string, string> = {};

  for (const raw of codes) {
    const normalized = raw.replace(/\D/g, "").padStart(6, "0");
    try {
      const q = await fetchYahooStockQuote(normalized);
      if (!q) {
        errors[normalized] = "Yahoo 시세 없음";
        continue;
      }
      quotes[normalized] = q;
      prices[normalized] = q.price;
    } catch (err) {
      errors[normalized] = err instanceof Error ? err.message : "조회 실패";
    }
  }

  return { quotes, prices, errors };
}
