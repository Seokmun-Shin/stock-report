import { NextResponse } from "next/server";
import { aggregateBriefingContext, type BriefingStockInput } from "@/lib/briefing/providers/aggregate";
import { isDartConfigured } from "@/lib/briefing/providers/dart";
import { isFredConfigured } from "@/lib/briefing/providers/fred";
import { isBokConfigured } from "@/lib/briefing/providers/bokEcos";
import { isKisConfigured } from "@/lib/kis/clientCore";
import { guardApiRequest, readJsonBody } from "@/lib/server/apiSecurity";
import { runWithRequestSecrets } from "@/lib/server/requestSecrets";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;
  return runWithRequestSecrets(req, () =>
    NextResponse.json({
      configured: {
        dart: isDartConfigured(),
        fred: isFredConfigured(),
        bok: isBokConfigured(),
        rss: true,
        global: true,
        kis: isKisConfigured(),
      },
    })
  );
}

export async function POST(req: Request) {
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;

  try {
    const body = await readJsonBody<{ stocks?: BriefingStockInput[] }>(req);
    if (body instanceof NextResponse) return body;

    return runWithRequestSecrets(req, async () => {
    const stocks = body.stocks ?? [];

    if (!Array.isArray(stocks) || stocks.length === 0) {
      return NextResponse.json({ error: "stocks 배열이 필요합니다." }, { status: 400 });
    }

    if (stocks.length > 30) {
      return NextResponse.json({ error: "최대 30종목까지 조회 가능합니다." }, { status: 400 });
    }

    const context = await aggregateBriefingContext(stocks);
    return NextResponse.json(context);
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "브리핑 수집 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
