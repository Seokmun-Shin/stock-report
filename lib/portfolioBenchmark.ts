import type { DailySnapshot } from "@/lib/types";
import type { HistoryRange, PriceHistoryPoint } from "@/lib/stockPriceHistory";
import { normalizeBenchmarkSeries, normalizeStockIndex } from "@/lib/stockPriceHistory";

export function snapshotsToPoints(snapshots: DailySnapshot[] | undefined): PriceHistoryPoint[] {
  return [...(snapshots ?? [])]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => {
      const v = 100 + s.portfolioTotalReturnRate;
      return { date: s.date, open: v, high: v, low: v, close: v };
    });
}

export function resolveSnapshotHistoryRange(count: number): HistoryRange {
  if (count <= 6) return "5d";
  if (count <= 31) return "1mo";
  if (count <= 93) return "3mo";
  return "6mo";
}

/** 일별 스냅샷에 저장된 KOSPI 종가 */
export function snapshotsToKospiPoints(snapshots: DailySnapshot[] | undefined): PriceHistoryPoint[] {
  return [...(snapshots ?? [])]
    .filter((s) => s.kospiClose != null && s.kospiClose > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      date: s.date,
      open: s.kospiClose!,
      high: s.kospiClose!,
      low: s.kospiClose!,
      close: s.kospiClose!,
    }));
}

function mergeKospiPoints(yahoo: PriceHistoryPoint[], snap: PriceHistoryPoint[]): PriceHistoryPoint[] {
  const map = new Map<string, PriceHistoryPoint>();
  for (const p of yahoo) map.set(p.date.slice(0, 10), p);
  for (const p of snap) map.set(p.date.slice(0, 10), p);
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildPortfolioBenchmarkSeries(
  snapshots: DailySnapshot[] | undefined,
  kospiPointsInput: PriceHistoryPoint[]
) {
  const portfolioPoints = snapshotsToPoints(snapshots);
  if (portfolioPoints.length < 2) {
    return {
      portfolioIndex: [] as { date: string; index: number }[],
      kospiIndex: [] as { date: string; index: number }[],
      portfolioChangePct: 0,
      kospiChangePct: 0,
      alpha: null as number | null,
    };
  }

  const snapKospi = snapshotsToKospiPoints(snapshots);
  const kospiPoints =
    snapKospi.length >= 2 && kospiPointsInput.length === 0
      ? snapKospi
      : mergeKospiPoints(kospiPointsInput, snapKospi);

  const portfolioIndex = normalizeStockIndex(portfolioPoints);
  const kospiIndex = normalizeBenchmarkSeries(portfolioPoints, kospiPoints);

  const portfolioChangePct = portfolioPoints[portfolioPoints.length - 1].close - portfolioPoints[0].close;
  const kospiBase = kospiPoints.find((p) => p.date === portfolioPoints[0].date)?.close ?? kospiPoints[0]?.close;
  const kospiLast = kospiPoints.find((p) => p.date === portfolioPoints[portfolioPoints.length - 1].date)?.close
    ?? kospiPoints[kospiPoints.length - 1]?.close;
  const kospiChangePct =
    kospiBase != null && kospiLast != null && kospiBase > 0 ? ((kospiLast - kospiBase) / kospiBase) * 100 : 0;

  const alpha =
    kospiIndex.length >= 2 && portfolioIndex.length >= 2
      ? portfolioChangePct - kospiChangePct
      : null;

  return { portfolioIndex, kospiIndex, portfolioChangePct, kospiChangePct, alpha };
}
