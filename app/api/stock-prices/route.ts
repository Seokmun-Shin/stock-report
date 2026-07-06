import { NextResponse } from "next/server";
import { fetchKisQuotes, fetchDomesticIndicesWithFallback, isKisConfigured, normalizeStockCode } from "@/lib/kis/client";
import { cached, withRetry } from "@/lib/server/fetchUtil";

export const dynamic = "force-dynamic";

/** KIS 연동 설정 여부 (키 노출 없음) */
export async function GET() {
  return NextResponse.json({ configured: isKisConfigured(), yahooFallback: true });
}

async function fetchViaYahoo(normalized: string[], includeKospi: boolean) {
  const { fetchYahooStockQuotes } = await import("@/lib/yahooStockQuote");
  const { fetchDomesticIndicesYahooOnly } = await import("@/lib/kis/kospiBenchmark");

  const cacheKey = `yahoo-quotes:${normalized.sort().join(",")}:${includeKospi}`;
  return cached(cacheKey, 30_000, async () => {
    const { quotes, prices, errors } = await fetchYahooStockQuotes(normalized);

    let kospi = null;
    let kosdaq = null;
    const indexWarnings: string[] = ["Yahoo Finance 시세 (KIS 미설정)"];
    const indexErrors: string[] = [];

    if (includeKospi) {
      const idx = await fetchDomesticIndicesYahooOnly();
      kospi = idx.kospi;
      kosdaq = idx.kosdaq;
      indexWarnings.push(...idx.warnings);
      indexErrors.push(...idx.errors);
    }

    return {
      quotes,
      prices,
      errors,
      kospi,
      kosdaq,
      kospiError: indexErrors.find((e) => e.startsWith("KOSPI")),
      indexWarnings,
      source: "yahoo" as const,
      updatedAt: new Date().toISOString(),
    };
  });
}

/** 종목코드 배열 → 시세 조회 + KOSPI (KIS 우선, 미설정 시 Yahoo) */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON body 필요" }, { status: 400 });
  }

  const codes = (body as { codes?: unknown }).codes;
  const includeKospi = (body as { includeKospi?: boolean }).includeKospi !== false;

  if (!Array.isArray(codes) || codes.length === 0) {
    return NextResponse.json({ error: "codes 배열이 필요합니다." }, { status: 400 });
  }

  if (codes.length > 20) {
    return NextResponse.json({ error: "한 번에 최대 20종목까지 조회 가능합니다." }, { status: 400 });
  }

  const normalized = [...new Set(codes.map((c) => normalizeStockCode(String(c))))];

  if (!isKisConfigured()) {
    const payload = await fetchViaYahoo(normalized, includeKospi);
    return NextResponse.json(payload);
  }

  const cacheKey = `kis-quotes:${normalized.sort().join(",")}:${includeKospi}`;

  const payload = await cached(cacheKey, 15_000, async () => {
    const { quotes, prices, errors } = await withRetry(() => fetchKisQuotes(normalized));

    let kospi = null;
    let kosdaq = null;
    let kospiError: string | undefined;
    let kospiWarning: string | undefined;
    const indexWarnings: string[] = [];
    if (includeKospi) {
      const result = await withRetry(() => fetchDomesticIndicesWithFallback());
      kospi = result.kospi;
      kosdaq = result.kosdaq;
      indexWarnings.push(...result.warnings);
      const kospiErr = result.errors.find((e) => e.startsWith("KOSPI:"));
      if (kospiErr) kospiError = kospiErr.replace(/^KOSPI:\s*/, "");
      if (!kospi && kospiErr) kospiError = kospiErr;
      if (result.warnings.some((w) => w.startsWith("KOSPI"))) {
        kospiWarning = result.warnings.find((w) => w.startsWith("KOSPI"));
      }
    }

    return {
      quotes,
      prices,
      errors,
      kospi,
      kosdaq,
      kospiError,
      kospiWarning,
      indexWarnings,
      updatedAt: new Date().toISOString(),
    };
  });

  return NextResponse.json(payload);
}
