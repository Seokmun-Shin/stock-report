import type { AppData, StockSummary } from "./types";
import { fmt } from "./calc";
import { getBuyTimingSignal, getSellTimingSignal } from "./calc";
import { resolveReportSettings } from "./reportSettings";

export interface AlertItem {
  stockId: string;
  stockName: string;
  kind: "buy" | "sell" | "target";
  message: string;
}

export function collectPortfolioAlerts(
  data: AppData,
  summaries: Record<string, StockSummary>,
  buySignals: Record<string, ReturnType<typeof getBuyTimingSignal>>,
  sellSignals: Record<string, ReturnType<typeof getSellTimingSignal>>
): AlertItem[] {
  const settings = resolveReportSettings(data.reportSettings);
  const alerts: AlertItem[] = [];
  const peaks = data.peakPrices ?? {};
  const targets = settings.targetPrices ?? {};

  for (const stock of data.stocks) {
    const sum = summaries[stock.id];
    if (!sum) continue;

    const peak = peaks[stock.id]?.price;
    if (peak && peak > 0 && sum.currentPrice > 0) {
      const drop = ((peak - sum.currentPrice) / peak) * 100;
      if (drop >= settings.buyDropFromPeakPct) {
        alerts.push({
          stockId: stock.id,
          stockName: stock.name,
          kind: "buy",
          message: `${stock.name} 고점 대비 −${drop.toFixed(1)}%`,
        });
      }
    }

    if (sum.holdingQty > 0 && sum.holdingAvgPriceWithCost > 0) {
      const gain =
        ((sum.currentPrice - sum.holdingAvgPriceWithCost) / sum.holdingAvgPriceWithCost) * 100;
      if (gain >= settings.sellGainFromAvgPct) {
        alerts.push({
          stockId: stock.id,
          stockName: stock.name,
          kind: "sell",
          message: `${stock.name} 평단(비용) 대비 +${gain.toFixed(1)}%`,
        });
      }
    }

    const buy = buySignals[stock.id];
    if (buy?.status === "zone10" || buy?.status === "zone20") {
      alerts.push({
        stockId: stock.id,
        stockName: stock.name,
        kind: "buy",
        message: `${stock.name} ${buy.label}`,
      });
    }

    const sell = sellSignals[stock.id];
    if (sell?.status === "zone10" || sell?.status === "zone20") {
      alerts.push({
        stockId: stock.id,
        stockName: stock.name,
        kind: "sell",
        message: `${stock.name} ${sell.label}`,
      });
    }

    const target = targets[stock.id];
    if (target && target > 0 && sum.currentPrice >= target) {
      alerts.push({
        stockId: stock.id,
        stockName: stock.name,
        kind: "target",
        message: `${stock.name} 목표가 ${fmt(target)} 도달`,
      });
    }
  }

  return alerts;
}

const notifiedKeys = new Set<string>();

export async function notifyAlertsIfEnabled(data: AppData, alerts: AlertItem[]): Promise<void> {
  if (!resolveReportSettings(data.reportSettings).alertsEnabled) return;
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission !== "granted") return;

  for (const a of alerts) {
    const key = `${a.stockId}:${a.kind}:${new Date().toISOString().slice(0, 10)}`;
    if (notifiedKeys.has(key)) continue;
    notifiedKeys.add(key);
    try {
      new Notification("주식 매매 리포트", { body: a.message, tag: key });
    } catch {
      /* ignore */
    }
  }
}
