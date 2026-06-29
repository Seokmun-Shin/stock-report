import { NextResponse } from "next/server";
import { fetchKisPrices, isKisConfigured, normalizeStockCode } from "@/lib/kis/client";

export const dynamic = "force-dynamic";

/** KIS 연동 설정 여부 (키 노출 없음) */
export async function GET() {
  return NextResponse.json({ configured: isKisConfigured() });
}

/** 종목코드 배열 → 현재가 조회 */
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
  if (!Array.isArray(codes) || codes.length === 0) {
    return NextResponse.json({ error: "codes 배열이 필요합니다." }, { status: 400 });
  }

  if (codes.length > 20) {
    return NextResponse.json({ error: "한 번에 최대 20종목까지 조회 가능합니다." }, { status: 400 });
  }

  const normalized = [...new Set(codes.map((c) => normalizeStockCode(String(c))))];
  const { prices, errors } = await fetchKisPrices(normalized);

  return NextResponse.json({
    prices,
    errors,
    updatedAt: new Date().toISOString(),
  });
}
