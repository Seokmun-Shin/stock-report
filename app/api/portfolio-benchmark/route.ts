import { NextResponse } from "next/server";
import type { DailySnapshot } from "@/lib/types";
import { buildPortfolioBenchmarkSeries, resolveSnapshotHistoryRange } from "@/lib/portfolioBenchmark";
import { fetchYahooKospiHistory } from "@/lib/stockPriceHistory";
import { cached, withRetry } from "@/lib/server/fetchUtil";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { dailySnapshots?: DailySnapshot[] };
    const snapshots = body.dailySnapshots ?? [];

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
      const kospiPoints = await withRetry(() => fetchYahooKospiHistory(range, "1d"));
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
