import { NextResponse } from "next/server";
import { aggregateBriefingContext, type BriefingStockInput } from "@/lib/briefing/providers/aggregate";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    configured: {
      dart: !!process.env.DART_API_KEY?.trim(),
      fred: !!process.env.FRED_API_KEY?.trim(),
      bok: !!process.env.BOK_API_KEY?.trim(),
      rss: true,
      global: true,
      kis: !!process.env.KIS_APP_KEY?.trim(),
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { stocks?: BriefingStockInput[] };
    const stocks = body.stocks ?? [];

    if (!Array.isArray(stocks) || stocks.length === 0) {
      return NextResponse.json({ error: "stocks 배열이 필요합니다." }, { status: 400 });
    }

    if (stocks.length > 30) {
      return NextResponse.json({ error: "최대 30종목까지 조회 가능합니다." }, { status: 400 });
    }

    const context = await aggregateBriefingContext(stocks);
    return NextResponse.json(context);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "브리핑 수집 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
