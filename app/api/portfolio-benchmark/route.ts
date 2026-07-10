import { NextResponse } from "next/server";
import type { DailySnapshot } from "@/lib/types";
import { buildPortfolioBenchmarkSeries, resolveSnapshotHistoryRange } from "@/lib/portfolioBenchmark";
import { fetchYahooKospiHistory } from "@/lib/stockPriceHistory";
import { cached, withRetry } from "@/lib/server/fetchUtil";
import { guardApiRequest, readJsonBody } from "@/lib/server/apiSecurity";

export const dynamic = "force-dynamic";

const MAX_SNAPSHOTS = 500;

export async function POST(req: Request) {
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;

  try {
    const body = await readJsonBody<{ dailySnapshots?: DailySnapshot[] }>(req);
    if (body instanceof NextResponse) return body;

    const snapshots = body.dailySnapshots ?? [];

    if (snapshots.length > MAX_SNAPSHOTS) {
      return NextResponse.json({ error: `dailySnapshots는 최대 ${MAX_SNAPSHOTS}건까지입니다.` }, { status: 400 });
    }

    if (snapshots.length < 2) {
      return NextResponse.json({
        portfolioIndex: [],
        kospiIndex: [],
        portfolioChangePct: 0,
        kospiChangePct: 0,
        alpha: null,
        fetchedAt: new Date().toISOString(),
        message: "일별 스냅샷이 2일 이상 필요합니다.",
      });
    }

    const range = resolveSnapshotHistoryRange(snapshots.length);
    const cacheKey = `portfolio-benchmark:${range}:${snapshots.map((s) => s.date).join(",")}`;

    const result = await cached(cacheKey, 60_000, async () => {
      let kospiPoints: Awaited<ReturnType<typeof fetchYahooKospiHistory>> = [];
      try {
        kospiPoints = await withRetry(() => fetchYahooKospiHistory(range, "1d"), 1, 300);
      } catch {
        /* Yahoo 실패 시 일별 스냅샷 kospiClose 로 대체 */
      }
      return buildPortfolioBenchmarkSeries(snapshots, kospiPoints);
    });

    return NextResponse.json({
      ...result,
      range,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "벤치마크 조회 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
