import { NextResponse } from "next/server";
import { buildStockDiscoveryReport } from "@/lib/briefing/stockDiscovery";
import { aggregateMarketContextLite } from "@/lib/briefing/providers/marketContextLite";
import { fetchAllMarketRankings } from "@/lib/kis/ranking";
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
        kis: isKisConfigured(),
        discovery: isKisConfigured(),
      },
    })
  );
}

export async function POST(req: Request) {
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;

  try {
    const body = await readJsonBody<{
      portfolioCodes?: string[];
      marketContext?: Parameters<typeof buildStockDiscoveryReport>[0]["marketContext"];
    }>(req);
    if (body instanceof NextResponse) return body;

    return runWithRequestSecrets(req, async () => {
    const errors: string[] = [];
    let marketContext = body.marketContext ?? null;

    if (!marketContext) {
      try {
        marketContext = await aggregateMarketContextLite();
      } catch (err) {
        errors.push(`시장 데이터: ${String(err)}`);
      }
    }

    let rankings: Awaited<ReturnType<typeof fetchAllMarketRankings>> | null = null;
    if (isKisConfigured()) {
      try {
        rankings = await fetchAllMarketRankings();
      } catch (err) {
        errors.push(`KIS 순위: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      errors.push("KIS_APP_KEY 미설정 — 순위 조회 불가");
    }

    const report = buildStockDiscoveryReport({
      marketContext,
      rankings,
      portfolioCodes: body.portfolioCodes ?? [],
      errors,
    });

    return NextResponse.json(report);
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "종목 발굴 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
