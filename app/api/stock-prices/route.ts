import { NextResponse } from "next/server";
import { fetchKisQuotes, fetchDomesticIndicesWithFallback, isKisConfigured, normalizeStockCode } from "@/lib/kis/client";

export const dynamic = "force-dynamic";

/** KIS 연동 설정 여부 (키 노출 없음) */
export async function GET() {
  return NextResponse.json({ configured: isKisConfigured() });
}

/** 종목코드 배열 → 시세 조회 + KOSPI */
export async function POST(req: Request) {
  if (!isKisConfigured()) {
    return NextResponse.json(
      { error: "KIS API가 설정되지 않았습니다. KIS_APP_KEY, KIS_APP_SECRET을 등록하세요." },
      { status: 503 }
    );
  }

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
  const { quotes, prices, errors } = await fetchKisQuotes(normalized);

  let kospi = null;
  let kosdaq = null;
  let kospiError: string | undefined;
  let kospiWarning: string | undefined;
  const indexWarnings: string[] = [];
  if (includeKospi) {
    const result = await fetchDomesticIndicesWithFallback();
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

  return NextResponse.json({
    quotes,
    prices,
    errors,
    kospi,
    kosdaq,
    kospiError,
    kospiWarning,
    indexWarnings,
    updatedAt: new Date().toISOString(),
  });
}
