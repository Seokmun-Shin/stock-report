import { NextResponse } from "next/server";
import {
  buildStockPriceHistory,
  fetchKospiIndexSeries,
  normalizeStockIndex,
  rangeOptionsForInterval,
  resolveRangeForInterval,
  type HistoryInterval,
  type HistoryRange,
} from "@/lib/stockPriceHistory";
import type { DailySnapshot } from "@/lib/types";
import { cached, withRetry } from "@/lib/server/fetchUtil";
import { guardApiRequest, readJsonBody } from "@/lib/server/apiSecurity";

export const dynamic = "force-dynamic";

const RANGES: HistoryRange[] = ["1d", "5d", "1mo", "3mo", "6mo", "1y"];
const INTERVALS: HistoryInterval[] = ["5m", "1d", "1wk"];
const MAX_SNAPSHOTS = 500;

export async function POST(req: Request) {
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;

  try {
    const body = await readJsonBody<{
      code?: string;
      stockId: string;
      range?: HistoryRange;
      interval?: HistoryInterval;
      currentPrice?: number;
      dailySnapshots?: DailySnapshot[];
    }>(req);
    if (body instanceof NextResponse) return body;

    if (!body.stockId) {
      return NextResponse.json({ error: "stockId가 필요합니다." }, { status: 400 });
    }

    if (body.dailySnapshots && body.dailySnapshots.length > MAX_SNAPSHOTS) {
      return NextResponse.json({ error: `dailySnapshots는 최대 ${MAX_SNAPSHOTS}건까지입니다.` }, { status: 400 });
    }

    const interval = body.interval && INTERVALS.includes(body.interval) ? body.interval : "5m";
    const rawRange = body.range && RANGES.includes(body.range) ? body.range : "1d";
    const range = resolveRangeForInterval(rawRange, interval);

    const cacheKey = `history:${body.stockId}:${range}:${interval}:${body.code ?? ""}:${body.dailySnapshots?.length ?? 0}`;

    const result = await cached(cacheKey, 60_000, async () => {
      const history = await withRetry(() =>
        buildStockPriceHistory({
          code: body.code,
          stockId: body.stockId,
          range,
          interval,
          snapshots: body.dailySnapshots,
          currentPrice: body.currentPrice ?? 0,
        })
      );

      const stockIndex = normalizeStockIndex(history.points);
      const kospiIndex =
        history.source === "yahoo"
          ? await withRetry(() => fetchKospiIndexSeries(history.points, range, interval))
          : [];

      return {
        ...history,
        stockIndex,
        kospiIndex,
        fetchedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "시세 추이 조회 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
