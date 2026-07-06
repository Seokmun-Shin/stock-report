/** 종목·지수 OHLC 시계열 — Yahoo Finance (서버 전용) */

import type { DailySnapshot } from "./types";

export type HistoryRange = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y";
export type HistoryInterval = "5m" | "1d" | "1wk";

export const HISTORY_RANGE_LABEL: Record<HistoryRange, string> = {
  "1d": "당일",
  "5d": "5일",
  "1mo": "1개월",
  "3mo": "3개월",
  "6mo": "6개월",
  "1y": "1년",
};

export const HISTORY_INTERVAL_LABEL: Record<HistoryInterval, string> = {
  "5m": "일일",
  "1d": "일봉",
  "1wk": "주봉",
};

export function rangeOptionsForInterval(interval: HistoryInterval): HistoryRange[] {
  if (interval === "5m") return ["1d", "5d"];
  if (interval === "1wk") return ["3mo", "6mo", "1y"];
  return ["1mo", "3mo", "6mo"];
}

/** 구간별 유효 range 로 보정 */
export function resolveRangeForInterval(range: HistoryRange, interval: HistoryInterval): HistoryRange {
  const allowed = rangeOptionsForInterval(interval);
  if (allowed.includes(range)) return range;
  return allowed[0];
}

export interface PriceHistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface StockPriceHistory {
  points: PriceHistoryPoint[];
  source: "yahoo" | "snapshot";
  range: HistoryRange;
  interval: HistoryInterval;
  periodChangePct: number;
  kospiChangePct: number | null;
  alpha: number | null;
  yahooSymbol?: string;
}

interface YahooChartResult {
  timestamp?: number[];
  indicators?: {
    quote?: {
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      close?: (number | null)[];
    }[];
  };
}

function yahooSymbolsForCode(code: string): string[] {
  const c = code.replace(/\D/g, "").padStart(6, "0");
  return [`${c}.KS`, `${c}.KQ`];
}

function formatPointDate(timestamp: number, interval: HistoryInterval): string {
  const d = new Date(timestamp * 1000);
  if (interval === "5m") {
    return d.toLocaleString("sv-SE", { timeZone: "Asia/Seoul" });
  }
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

function parseOhlcPoint(
  timestamp: number,
  open: number | null | undefined,
  high: number | null | undefined,
  low: number | null | undefined,
  close: number | null | undefined,
  interval: HistoryInterval
): PriceHistoryPoint | null {
  if (close == null || !Number.isFinite(close) || close <= 0) return null;
  const c = close;
  const o = open != null && open > 0 ? open : c;
  const h = high != null && high > 0 ? high : Math.max(o, c);
  const l = low != null && low > 0 ? low : Math.min(o, c);
  return {
    date: formatPointDate(timestamp, interval),
    open: o,
    high: h,
    low: l,
    close: c,
  };
}

async function fetchYahooSeries(
  yahooSymbol: string,
  range: HistoryRange,
  interval: HistoryInterval
): Promise<PriceHistoryPoint[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; stock-report/1.0)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Yahoo (${res.status})`);

  const data = (await res.json()) as { chart?: { result?: YahooChartResult[] } };
  const result = data.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const q = result?.indicators?.quote?.[0];

  const points: PriceHistoryPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const pt = parseOhlcPoint(
      timestamps[i],
      q?.open?.[i],
      q?.high?.[i],
      q?.low?.[i],
      q?.close?.[i],
      interval
    );
    if (pt) points.push(pt);
  }

  if (points.length < 2) throw new Error("Yahoo 데이터 부족");
  return points;
}

export async function fetchYahooStockHistory(
  code: string,
  range: HistoryRange,
  interval: HistoryInterval
): Promise<{ points: PriceHistoryPoint[]; yahooSymbol: string }> {
  const effectiveRange = resolveRangeForInterval(range, interval);
  const symbols = yahooSymbolsForCode(code);
  let lastErr: Error | null = null;

  for (const sym of symbols) {
    try {
      const points = await fetchYahooSeries(sym, effectiveRange, interval);
      return { points, yahooSymbol: sym };
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastErr ?? new Error("Yahoo 종목 조회 실패");
}

export async function fetchYahooKospiHistory(
  range: HistoryRange,
  interval: HistoryInterval
): Promise<PriceHistoryPoint[]> {
  const effectiveRange = resolveRangeForInterval(range, interval);
  const symbols = ["%5EKS11", "%5EKQ11", "0001.KS"];
  let lastErr: Error | null = null;
  for (const sym of symbols) {
    try {
      return await fetchYahooSeries(sym, effectiveRange, interval);
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error("Yahoo KOSPI 조회 실패");
}

function periodChangePct(points: PriceHistoryPoint[]): number {
  if (points.length < 2) return 0;
  const first = points[0].close;
  const last = points[points.length - 1].close;
  if (first <= 0) return 0;
  return ((last - first) / first) * 100;
}

function snapshotToPoint(date: string, close: number): PriceHistoryPoint {
  return { date, open: close, high: close, low: close, close };
}

export function buildSnapshotHistory(
  stockId: string,
  snapshots: DailySnapshot[] | undefined,
  currentPrice: number,
  range: HistoryRange
): PriceHistoryPoint[] {
  const days =
    range === "1d"
      ? 1
      : range === "5d"
        ? 6
        : range === "1mo"
          ? 31
          : range === "3mo"
            ? 93
            : range === "6mo"
              ? 186
              : 366;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const fromSnaps = [...(snapshots ?? [])]
    .filter((s) => s.date >= cutoffStr && s.stockPrices[stockId] != null && s.stockPrices[stockId] > 0)
    .map((s) => snapshotToPoint(s.date, s.stockPrices[stockId]))
    .sort((a, b) => a.date.localeCompare(b.date));

  const today = new Date().toISOString().slice(0, 10);
  const lastDate = fromSnaps[fromSnaps.length - 1]?.date;
  if (currentPrice > 0 && lastDate !== today) {
    fromSnaps.push(snapshotToPoint(today, currentPrice));
  }

  return fromSnaps;
}

export async function buildStockPriceHistory({
  code,
  stockId,
  range,
  interval = "1d",
  snapshots,
  currentPrice = 0,
}: {
  code?: string;
  stockId: string;
  range: HistoryRange;
  interval?: HistoryInterval;
  snapshots?: DailySnapshot[];
  currentPrice?: number;
}): Promise<StockPriceHistory> {
  const effectiveRange = resolveRangeForInterval(range, interval);
  let points: PriceHistoryPoint[] = [];
  let source: StockPriceHistory["source"] = "yahoo";
  let yahooSymbol: string | undefined;

  if (code?.replace(/\D/g, "").length === 6) {
    try {
      const yahoo = await fetchYahooStockHistory(code, range, interval);
      points = yahoo.points;
      yahooSymbol = yahoo.yahooSymbol;

      if (currentPrice > 0 && points.length > 0 && interval !== "5m") {
        const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
        const last = points[points.length - 1];
        const lastDay = last.date.slice(0, 10);
        if (lastDay === today) {
          points[points.length - 1] = {
            ...last,
            close: currentPrice,
            high: Math.max(last.high, currentPrice),
            low: Math.min(last.low, currentPrice),
          };
        } else if (lastDay < today) {
          points.push(snapshotToPoint(today, currentPrice));
        }
      } else if (currentPrice > 0 && points.length > 0 && interval === "5m") {
        const last = points[points.length - 1];
        points[points.length - 1] = {
          ...last,
          close: currentPrice,
          high: Math.max(last.high, currentPrice),
          low: Math.min(last.low, currentPrice),
        };
      }
    } catch {
      if (interval === "5m") {
        points = [];
      } else {
        points = buildSnapshotHistory(stockId, snapshots, currentPrice, effectiveRange);
        source = "snapshot";
      }
    }
  } else {
    points = buildSnapshotHistory(stockId, snapshots, currentPrice, effectiveRange);
    source = "snapshot";
  }

  if (points.length < 2) {
    return {
      points,
      source,
      range: effectiveRange,
      interval,
      periodChangePct: 0,
      kospiChangePct: null,
      alpha: null,
      yahooSymbol,
    };
  }

  let kospiChangePct: number | null = null;
  if (source === "yahoo") {
    try {
      const kospiPts = await fetchYahooKospiHistory(range, interval);
      kospiChangePct = periodChangePct(kospiPts);
    } catch {
      kospiChangePct = null;
    }
  }

  const stockPct = periodChangePct(points);
  const alpha = kospiChangePct != null ? stockPct - kospiChangePct : null;

  return {
    points,
    source,
    range: effectiveRange,
    interval,
    periodChangePct: stockPct,
    kospiChangePct,
    alpha,
    yahooSymbol,
  };
}

export function normalizeBenchmarkSeries(
  stockPoints: PriceHistoryPoint[],
  kospiPoints: PriceHistoryPoint[]
): { date: string; index: number }[] {
  if (stockPoints.length === 0 || kospiPoints.length === 0) return [];

  const kospiMap = new Map(kospiPoints.map((p) => [p.date, p.close]));
  const baseDate = stockPoints[0].date;
  let baseKospi = kospiMap.get(baseDate);
  if (baseKospi == null) {
    for (const p of stockPoints) {
      const v = kospiMap.get(p.date);
      if (v != null) {
        baseKospi = v;
        break;
      }
    }
  }
  if (!baseKospi || baseKospi <= 0) return [];

  return stockPoints
    .map((p) => {
      const k = kospiMap.get(p.date);
      if (k == null || k <= 0) return null;
      return { date: p.date, index: (k / baseKospi) * 100 };
    })
    .filter((p): p is { date: string; index: number } => p != null);
}

export function normalizeStockIndex(points: PriceHistoryPoint[]): { date: string; index: number }[] {
  if (points.length === 0) return [];
  const base = points[0].close;
  if (base <= 0) return [];
  return points.map((p) => ({ date: p.date, index: (p.close / base) * 100 }));
}

export async function fetchKospiIndexSeries(
  stockPoints: PriceHistoryPoint[],
  range: HistoryRange,
  interval: HistoryInterval
): Promise<{ date: string; index: number }[]> {
  try {
    const kospiPts = await fetchYahooKospiHistory(range, interval);
    return normalizeBenchmarkSeries(stockPoints, kospiPts);
  } catch {
    return [];
  }
}
