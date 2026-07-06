import type { Trade, TradeType } from "@/lib/types";
import type { HistoryInterval } from "@/lib/stockPriceHistory";

export interface ChartTradeMarker {
  tradeId: string;
  index: number;
  type: TradeType;
  price: number;
  label: string;
}

function tradeToMs(trade: Trade): number {
  const time = trade.executedTime ?? "12:00";
  return new Date(`${trade.date}T${time}:00`).getTime();
}

function pointToMs(date: string, interval: HistoryInterval): number {
  if (interval === "5m") {
    const iso = date.includes(" ") ? date.replace(" ", "T") : `${date.slice(0, 10)}T12:00:00`;
    const d = new Date(iso.length >= 16 ? iso.slice(0, 16) : iso);
    return d.getTime();
  }
  return new Date(`${date.slice(0, 10)}T12:00:00`).getTime();
}

function maxMatchMs(interval: HistoryInterval): number {
  if (interval === "5m") return 20 * 60 * 1000;
  if (interval === "1wk") return 10 * 24 * 60 * 60 * 1000;
  return 2 * 24 * 60 * 60 * 1000;
}

/** 차트 포인트 인덱스에 매매 체결 위치 매칭 */
export function matchTradesToChart(
  trades: Trade[],
  points: { date: string }[],
  interval: HistoryInterval
): ChartTradeMarker[] {
  if (points.length === 0 || trades.length === 0) return [];

  const maxDiff = maxMatchMs(interval);
  const out: ChartTradeMarker[] = [];

  for (const trade of trades) {
    const tMs = tradeToMs(trade);
    let bestIdx = -1;
    let bestDiff = Infinity;

    for (let i = 0; i < points.length; i++) {
      const diff = Math.abs(pointToMs(points[i].date, interval) - tMs);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }

    if (bestIdx < 0 || bestDiff > maxDiff) continue;

    out.push({
      tradeId: trade.id,
      index: bestIdx,
      type: trade.type,
      price: trade.price,
      label: trade.type === "buy" ? "매수" : "매도",
    });
  }

  return out;
}
