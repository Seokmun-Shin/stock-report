import type { AppData } from "./types";
import { computeRealizedPnlByTrade } from "./calc";

export type PeriodKind = "month" | "year";

export interface PeriodBucket {
  key: string;
  label: string;
  realizedPnl: number;
  sellCount: number;
  buyCount: number;
  sellAmount: number;
  buyAmount: number;
}

function periodKey(date: string, kind: PeriodKind): string {
  return kind === "month" ? date.slice(0, 7) : date.slice(0, 4);
}

function periodLabel(key: string, kind: PeriodKind): string {
  if (kind === "year") return `${key}년`;
  const [y, m] = key.split("-");
  return `${y}년 ${parseInt(m, 10)}월`;
}

export function buildPeriodReport(data: AppData, kind: PeriodKind = "month"): PeriodBucket[] {
  const realized = computeRealizedPnlByTrade(data.trades);
  const map = new Map<string, PeriodBucket>();

  for (const t of data.trades) {
    const key = periodKey(t.date, kind);
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: periodLabel(key, kind),
        realizedPnl: 0,
        sellCount: 0,
        buyCount: 0,
        sellAmount: 0,
        buyAmount: 0,
      });
    }
    const b = map.get(key)!;
    const amount = t.quantity * t.price;
    if (t.type === "buy") {
      b.buyCount += 1;
      b.buyAmount += amount;
    } else {
      b.sellCount += 1;
      b.sellAmount += amount;
      b.realizedPnl += realized[t.id] ?? 0;
    }
  }

  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export function summarizePeriodTotals(buckets: PeriodBucket[]) {
  return {
    totalRealized: buckets.reduce((s, b) => s + b.realizedPnl, 0),
    totalSells: buckets.reduce((s, b) => s + b.sellCount, 0),
    periodCount: buckets.length,
  };
}
