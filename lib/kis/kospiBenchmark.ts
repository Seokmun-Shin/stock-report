/** KOSPI·KOSDAQ 벤치마크 — KIS 우선, 실패 시 Yahoo 폴백 */

import type { KospiBenchmark } from "@/lib/types";
import { normalizeMarketChange } from "./normalizeQuote";
import { kisGetJson, parseNum, sleep } from "./clientCore";

const INDEX_DEFS = [
  { key: "kospi" as const, kisCode: "0001", yahoo: "%5EKS11", label: "KOSPI" },
  { key: "kosdaq" as const, kisCode: "2001", yahoo: "%5EKQ11", label: "KOSDAQ" },
];

async function fetchIndexFromKis(iscd: string, attempt = 0): Promise<KospiBenchmark> {
  try {
    const data = await kisGetJson<{
      output?: {
        bstp_nmix_prpr?: string;
        bstp_nmix_prdy_clpr?: string;
        bstp_nmix_prdy_vrss?: string;
        prdy_ctrt?: string;
        bstp_nmix_prdy_ctrt?: string;
      };
    }>("/uapi/domestic-stock/v1/quotations/inquire-index-price", "FHPUP02100000", {
      FID_COND_MRKT_DIV_CODE: "U",
      FID_INPUT_ISCD: iscd,
    });

    const o = data.output ?? {};
    const price = parseNum(o.bstp_nmix_prpr);
    if (price <= 0) throw new Error("유효하지 않은 지수 응답");

    const changeRate = parseNum(o.prdy_ctrt) || parseNum(o.bstp_nmix_prdy_ctrt);
    const normalized = normalizeMarketChange(
      price,
      parseNum(o.bstp_nmix_prdy_clpr),
      parseNum(o.bstp_nmix_prdy_vrss),
      changeRate,
      2
    );

    return { ...normalized, updatedAt: new Date().toISOString(), source: "kis" };
  } catch (err) {
    if (attempt < 1) {
      await sleep(400);
      return fetchIndexFromKis(iscd, attempt + 1);
    }
    throw err;
  }
}

async function fetchIndexFromYahoo(yahooSymbol: string): Promise<KospiBenchmark> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=5d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Yahoo 지수 (${res.status})`);

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
  if (price <= 0) throw new Error("Yahoo 지수 데이터 없음");

  const changeRate = prev > 0 ? ((price - prev) / prev) * 100 : 0;
  const normalized = normalizeMarketChange(price, prev, price - prev, changeRate, 2);

  return { ...normalized, updatedAt: new Date().toISOString(), source: "yahoo" };
}

async function fetchOneIndex(def: (typeof INDEX_DEFS)[number]): Promise<{
  benchmark: KospiBenchmark | null;
  warning?: string;
  error?: string;
}> {
  try {
    const benchmark = await fetchIndexFromKis(def.kisCode);
    return { benchmark };
  } catch (kisErr) {
    const kisMsg = kisErr instanceof Error ? kisErr.message : "KIS 조회 실패";
    try {
      const benchmark = await fetchIndexFromYahoo(def.yahoo);
      return { benchmark, warning: `${def.label} KIS 오류 → Yahoo 대체` };
    } catch {
      return { benchmark: null, error: `${def.label}: ${kisMsg}` };
    }
  }
}

export async function fetchDomesticIndicesWithFallback(): Promise<{
  kospi: KospiBenchmark | null;
  kosdaq: KospiBenchmark | null;
  warnings: string[];
  errors: string[];
}> {
  const warnings: string[] = [];
  const errors: string[] = [];
  let kospi: KospiBenchmark | null = null;
  let kosdaq: KospiBenchmark | null = null;

  for (const def of INDEX_DEFS) {
    const r = await fetchOneIndex(def);
    if (def.key === "kospi") kospi = r.benchmark;
    else kosdaq = r.benchmark;
    if (r.warning) warnings.push(r.warning);
    if (r.error) errors.push(r.error);
    await sleep(150);
  }

  return { kospi, kosdaq, warnings, errors };
}

/** @deprecated fetchDomesticIndicesWithFallback 사용 */
export async function fetchKospiBenchmarkWithFallback(): Promise<{
  kospi: KospiBenchmark | null;
  kospiError?: string;
  kospiWarning?: string;
}> {
  const { kospi, kosdaq: _k, warnings, errors } = await fetchDomesticIndicesWithFallback();
  return {
    kospi,
    kospiError: errors.find((e) => e.startsWith("KOSPI:"))?.replace(/^KOSPI:\s*/, ""),
    kospiWarning: warnings.find((w) => w.startsWith("KOSPI")),
  };
}

export async function fetchSectorIndexPrice(sectorCode: string): Promise<{
  price: number;
  changeRate: number;
} | null> {
  if (!sectorCode.trim()) return null;
  try {
    const b = await fetchIndexFromKis(sectorCode.padStart(4, "0").slice(-4));
    return { price: b.price, changeRate: b.changeRate };
  } catch {
    return null;
  }
}
