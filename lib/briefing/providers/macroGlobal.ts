/** 주요국 지수·금리·환율·원자재 (Yahoo Finance + Frankfurter) */

import type { FxSnapshot, GlobalIndexSnapshot, MacroInstrumentSnapshot, MacroRegion } from "../types";

type EquityIndexQuote = {
  symbol: string;
  label: string;
  region: MacroRegion;
  category: NonNullable<GlobalIndexSnapshot["category"]>;
  unit?: string;
};

type MacroInstrumentQuote = {
  symbol: string;
  label: string;
  region: MacroRegion;
  category: MacroInstrumentSnapshot["category"];
  unit?: string;
};

/** 주요국·지역 주가지수 · 선물 · 섹터 */
const EQUITY_INDICES: EquityIndexQuote[] = [
  { symbol: "SP500", label: "S&P 500", region: "US", category: "index" },
  { symbol: "NASDAQ", label: "NASDAQ", region: "US", category: "index" },
  { symbol: "DJI", label: "다우존스", region: "US", category: "index" },
  { symbol: "RUT", label: "러셀2000", region: "US", category: "index" },
  { symbol: "ES", label: "S&P500 선물", region: "US", category: "futures" },
  { symbol: "NQ", label: "NASDAQ100 선물", region: "US", category: "futures" },
  { symbol: "NIKKEI", label: "니케이225", region: "JP", category: "index" },
  { symbol: "TOPIX", label: "TOPIX", region: "JP", category: "index" },
  { symbol: "HSI", label: "항셍", region: "CN", category: "index" },
  { symbol: "CSI300", label: "CSI300", region: "CN", category: "index" },
  { symbol: "SHCOMP", label: "상하이종합", region: "CN", category: "index" },
  { symbol: "TAIEX", label: "대만 가권", region: "TW", category: "index" },
  { symbol: "KOSPI200", label: "KOSPI200", region: "KR", category: "index" },
  { symbol: "SOX", label: "필라델피아 반도체", region: "US", category: "sector" },
  { symbol: "FTSE", label: "FTSE100", region: "UK", category: "index" },
  { symbol: "DAX", label: "DAX", region: "EU", category: "index" },
  { symbol: "STOXX50", label: "유로스톡스50", region: "EU", category: "index" },
  { symbol: "VIX", label: "VIX(공포)", region: "GLOBAL", category: "volatility" },
  { symbol: "VIX3M", label: "VIX 3M", region: "GLOBAL", category: "volatility" },
  { symbol: "BTC", label: "비트코인", region: "GLOBAL", category: "crypto" },
];

const YAHOO_SYMBOL: Record<string, string> = {
  SP500: "^GSPC",
  NASDAQ: "^IXIC",
  DJI: "^DJI",
  RUT: "^RUT",
  ES: "ES=F",
  NQ: "NQ=F",
  NIKKEI: "^N225",
  TOPIX: "^TOPX",
  HSI: "^HSI",
  CSI300: "000300.SS",
  SHCOMP: "000001.SS",
  TAIEX: "^TWII",
  KOSPI200: "^KS200",
  SOX: "^SOX",
  FTSE: "^FTSE",
  DAX: "^GDAXI",
  STOXX50: "^STOXX50E",
  VIX: "^VIX",
  VIX3M: "^VIX3M",
  BTC: "BTC-USD",
  US10Y: "^TNX",
  US5Y: "^FVX",
  US3M: "^IRX",
  DXY: "DX-Y.NYB",
  GOLD: "GC=F",
  OIL: "CL=F",
  COPPER: "HG=F",
};

const MACRO_INSTRUMENTS: MacroInstrumentQuote[] = [
  { symbol: "US10Y", label: "미국 10년 국채", region: "US", category: "rate", unit: "%" },
  { symbol: "US5Y", label: "미국 5년 국채", region: "US", category: "rate", unit: "%" },
  { symbol: "US3M", label: "미국 3개월 T-Bill", region: "US", category: "rate", unit: "%" },
  { symbol: "DXY", label: "달러인덱스(DXY)", region: "US", category: "fx_index" },
  { symbol: "GOLD", label: "금(선물)", region: "GLOBAL", category: "commodity", unit: "USD/oz" },
  { symbol: "OIL", label: "WTI 원유", region: "GLOBAL", category: "commodity", unit: "USD/bbl" },
  { symbol: "COPPER", label: "구리(선물)", region: "GLOBAL", category: "commodity", unit: "USD/lb" },
];

const FX_PAIRS: { from: string; to: string; label: string; region: FxSnapshot["region"] }[] = [
  { from: "USD", to: "KRW", label: "USD/KRW", region: "US" },
  { from: "EUR", to: "KRW", label: "EUR/KRW", region: "EU" },
  { from: "JPY", to: "KRW", label: "JPY/KRW", region: "JP" },
  { from: "GBP", to: "KRW", label: "GBP/KRW", region: "UK" },
  { from: "CNY", to: "KRW", label: "CNY/KRW", region: "CN" },
];

function prevFrankfurterDate(d = new Date()): string {
  const cursor = new Date(d);
  cursor.setDate(cursor.getDate() - 1);
  while (cursor.getDay() === 0 || cursor.getDay() === 6) {
    cursor.setDate(cursor.getDate() - 1);
  }
  return cursor.toISOString().slice(0, 10);
}

async function fetchYahooQuote(
  internalSymbol: string,
  _meta: { label: string; region: MacroRegion; unit?: string }
): Promise<{ price: number; changeRate: number } | null> {
  const yahoo = YAHOO_SYMBOL[internalSymbol];
  if (!yahoo) return null;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?interval=1d&range=5d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    chart?: {
      result?: {
        meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number };
      }[];
    };
  };

  const m = data.chart?.result?.[0]?.meta;
  const price = m?.regularMarketPrice ?? 0;
  const prev = m?.chartPreviousClose ?? m?.previousClose ?? price;
  if (price <= 0) return null;

  return {
    price,
    changeRate: prev > 0 ? ((price - prev) / prev) * 100 : 0,
  };
}

export async function fetchExtendedGlobalIndices(): Promise<GlobalIndexSnapshot[]> {
  const results = await Promise.allSettled(
    EQUITY_INDICES.map(async (i) => {
      const q = await fetchYahooQuote(i.symbol, i);
      if (!q) return null;
      return {
        symbol: i.symbol,
        label: i.label,
        price: q.price,
        changeRate: q.changeRate,
        updatedAt: new Date().toISOString(),
        region: i.region,
        category: i.category,
        unit: i.unit,
      } satisfies GlobalIndexSnapshot;
    })
  );

  return results
    .flatMap((r) => (r.status === "fulfilled" && r.value != null ? [r.value] : []));
}

export async function fetchMacroInstruments(): Promise<MacroInstrumentSnapshot[]> {
  const results = await Promise.allSettled(
    MACRO_INSTRUMENTS.map(async (i) => {
      const q = await fetchYahooQuote(i.symbol, i);
      if (!q) return null;
      return {
        symbol: i.symbol,
        label: i.label,
        category: i.category,
        region: i.region,
        price: q.price,
        changeRate: q.changeRate,
        unit: i.unit,
        updatedAt: new Date().toISOString(),
      } satisfies MacroInstrumentSnapshot;
    })
  );

  return results
    .flatMap((r) => (r.status === "fulfilled" && r.value != null ? [r.value] : []));
}

export async function fetchMajorFxRates(): Promise<FxSnapshot[]> {
  const prevDate = prevFrankfurterDate();
  const results = await Promise.allSettled(
    FX_PAIRS.map(async (p) => {
      const [latestRes, prevRes] = await Promise.all([
        fetch(`https://api.frankfurter.app/latest?from=${p.from}&to=${p.to}`, { cache: "no-store" }),
        fetch(`https://api.frankfurter.app/${prevDate}?from=${p.from}&to=${p.to}`, { cache: "no-store" }),
      ]);
      if (!latestRes.ok) return null;

      const latest = (await latestRes.json()) as { rates?: Record<string, number> };
      const rate = latest.rates?.[p.to] ?? 0;
      if (rate <= 0) return null;

      let changeRate = 0;
      if (prevRes.ok) {
        const prevData = (await prevRes.json()) as { rates?: Record<string, number> };
        const prevRate = prevData.rates?.[p.to] ?? 0;
        if (prevRate > 0) changeRate = ((rate - prevRate) / prevRate) * 100;
      }

      return {
        pair: p.label,
        rate,
        changeRate,
        region: p.region,
        updatedAt: new Date().toISOString(),
      } satisfies FxSnapshot;
    })
  );

  return results
    .flatMap((r) => (r.status === "fulfilled" && r.value != null ? [r.value] : []));
}

/** USD/KRW — 기존 호환 */
export async function fetchUsdKrwWithChange(): Promise<FxSnapshot | null> {
  const rates = await fetchMajorFxRates();
  return rates.find((r) => r.pair === "USD/KRW") ?? null;
}
