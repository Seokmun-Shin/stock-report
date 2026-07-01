import type {
  AppData,
  BuyTimingSignal,
  DailySnapshot,
  PortfolioSummary,
  SellTimingSignal,
  Stock,
  StockPeak,
  StockSummary,
} from "./types";
import { fmt, fmtPct, fmtQty, fmtSigned, today } from "./calc";
import { DEFAULT_REPORT_SETTINGS, resolveReportSettings, type ReportSettings } from "./reportSettings";

export type AlertKind = "buy" | "sell" | "watch";

export interface StockDailyAlert {
  stockId: string;
  kind: AlertKind;
  title: string;
  detail: string;
}

export interface StockDailyRow {
  stock: Stock;
  summary: StockSummary;
  buySignal: BuyTimingSignal;
  sellSignal: SellTimingSignal;
  priceChangeFromPrev: number | null;
  priceChangePctFromPrev: number | null;
  dropFromPeakPct: number | null;
  gainFromAvgPct: number | null;
  alerts: StockDailyAlert[];
}

export interface DailyReport {
  reportDate: string;
  previousSnapshotDate: string | null;
  settings: ReportSettings;
  portfolio: PortfolioSummary;
  portfolioPnlChange: number | null;
  portfolioReturnChange: number | null;
  rows: StockDailyRow[];
  headlineAlerts: StockDailyAlert[];
}

function yesterdaySnapshot(snapshots: DailySnapshot[] | undefined, reportDate: string): DailySnapshot | null {
  const list = [...(snapshots ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  return list.find((s) => s.date < reportDate) ?? null;
}

export function buildDailyReport(
  data: AppData,
  portfolio: PortfolioSummary,
  summaries: Record<string, StockSummary>,
  buySignals: Record<string, BuyTimingSignal>,
  sellSignals: Record<string, SellTimingSignal>
): DailyReport {
  const reportDate = today();
  const settings = resolveReportSettings(data.reportSettings);
  const prev = yesterdaySnapshot(data.dailySnapshots, reportDate);

  const rows: StockDailyRow[] = data.stocks.map((stock) => {
    const summary = summaries[stock.id];
    const buySignal = buySignals[stock.id] ?? { status: "watch" as const, label: "—", hint: "" };
    const sellSignal = sellSignals[stock.id] ?? { status: "watch" as const, label: "—", hint: "" };
    if (!summary) {
      return {
        stock,
        summary: emptySummary(stock),
        buySignal,
        sellSignal,
        priceChangeFromPrev: null,
        priceChangePctFromPrev: null,
        dropFromPeakPct: null,
        gainFromAvgPct: null,
        alerts: [],
      };
    }

    const prevPrice = prev?.stockPrices[stock.id];
    const priceChangeFromPrev =
      prevPrice != null && prevPrice > 0 ? summary.currentPrice - prevPrice : null;
    const priceChangePctFromPrev =
      priceChangeFromPrev != null && prevPrice! > 0 ? (priceChangeFromPrev / prevPrice!) * 100 : null;

    const peak = data.peakPrices?.[stock.id]?.price;
    const dropFromPeakPct =
      peak != null && peak > 0 && summary.currentPrice > 0
        ? ((peak - summary.currentPrice) / peak) * 100
        : null;

    const gainFromAvgPct =
      summary.holdingQty > 0 && summary.holdingAvgPriceWithCost > 0
        ? ((summary.currentPrice - summary.holdingAvgPriceWithCost) / summary.holdingAvgPriceWithCost) * 100
        : null;

    const alerts = buildStockAlerts(
      stock,
      summary,
      settings,
      dropFromPeakPct,
      gainFromAvgPct,
      buySignal,
      sellSignal
    );

    return {
      stock,
      summary,
      buySignal,
      sellSignal,
      priceChangeFromPrev,
      priceChangePctFromPrev,
      dropFromPeakPct,
      gainFromAvgPct,
      alerts,
    };
  });

  const headlineAlerts = rows.flatMap((r) => r.alerts).filter((a) => a.kind !== "watch");

  return {
    reportDate,
    previousSnapshotDate: prev?.date ?? null,
    settings,
    portfolio,
    portfolioPnlChange: prev ? portfolio.totalPnl - prev.portfolioTotalPnl : null,
    portfolioReturnChange: prev ? portfolio.totalReturnRate - prev.portfolioTotalReturnRate : null,
    rows,
    headlineAlerts,
  };
}

function buildStockAlerts(
  stock: Stock,
  summary: StockSummary,
  settings: ReportSettings,
  dropFromPeakPct: number | null,
  gainFromAvgPct: number | null,
  buySignal: BuyTimingSignal,
  sellSignal: SellTimingSignal
): StockDailyAlert[] {
  const alerts: StockDailyAlert[] = [];

  if (
    dropFromPeakPct != null &&
    dropFromPeakPct >= settings.buyDropFromPeakPct &&
    summary.currentPrice > 0
  ) {
    alerts.push({
      stockId: stock.id,
      kind: "buy",
      title: "매수·재매수 관심",
      detail: `고점 대비 −${dropFromPeakPct.toFixed(1)}% (기준 −${settings.buyDropFromPeakPct}%)`,
    });
  }

  if (
    gainFromAvgPct != null &&
    gainFromAvgPct >= settings.sellGainFromAvgPct &&
    summary.holdingQty > 0
  ) {
    alerts.push({
      stockId: stock.id,
      kind: "sell",
      title: "익절·매도 관심",
      detail: `평단(비용) 대비 +${gainFromAvgPct.toFixed(1)}% (기준 +${settings.sellGainFromAvgPct}%)`,
    });
  }

  if (buySignal.status === "zone10" || buySignal.status === "zone20") {
    alerts.push({
      stockId: stock.id,
      kind: "buy",
      title: buySignal.label,
      detail: buySignal.hint,
    });
  }

  if (sellSignal.status === "zone10" || sellSignal.status === "zone20") {
    alerts.push({
      stockId: stock.id,
      kind: "sell",
      title: sellSignal.label,
      detail: sellSignal.hint,
    });
  }

  if (alerts.length === 0 && summary.holdingQty > 0) {
    alerts.push({
      stockId: stock.id,
      kind: "watch",
      title: "관망",
      detail: "설정 시그널·타이밍선 구간 밖",
    });
  }

  return alerts;
}

/** 추적 고점 갱신 (현재가가 기록 고점보다 높을 때만) */
export function applyPeakPrices(data: AppData): AppData {
  const peaks: Record<string, StockPeak> = { ...(data.peakPrices ?? {}) };
  const asOf = today();
  let changed = false;

  for (const s of data.stocks) {
    const price = data.currentPrices[s.id] ?? 0;
    if (price <= 0) continue;
    const prev = peaks[s.id];
    if (!prev || price > prev.price) {
      peaks[s.id] = { price, asOf };
      changed = true;
    }
  }

  if (!changed && data.peakPrices) return data;
  return { ...data, peakPrices: peaks };
}

/** 하루 1회 스냅샷 저장 (최근 90일) */
export function applyDailySnapshot(
  data: AppData,
  portfolio: PortfolioSummary,
  summaries: Record<string, StockSummary>
): AppData {
  const reportDate = today();
  const existing = data.dailySnapshots ?? [];
  if (existing.some((s) => s.date === reportDate)) return data;

  const stockPrices: Record<string, number> = {};
  const stockUnrealizedPnl: Record<string, number> = {};
  for (const s of data.stocks) {
    const sum = summaries[s.id];
    stockPrices[s.id] = sum?.currentPrice ?? data.currentPrices[s.id] ?? 0;
    stockUnrealizedPnl[s.id] = sum?.unrealizedPnlWithCost ?? 0;
  }

  const snap: DailySnapshot = {
    date: reportDate,
    portfolioTotalPnl: portfolio.totalPnl,
    portfolioTotalReturnRate: portfolio.totalReturnRate,
    stockPrices,
    stockUnrealizedPnl,
  };

  const next = [...existing, snap].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 90);
  return { ...data, dailySnapshots: next };
}

export function formatDailyReportText(report: DailyReport): string {
  const lines: string[] = [
    `📊 일일 브리핑 · ${report.reportDate}`,
    report.previousSnapshotDate
      ? `전일(${report.previousSnapshotDate}) 대비`
      : "전일 스냅샷 없음 — 내일부터 전일 대비 표시",
    `누적 손익 ${fmtSigned(report.portfolio.totalPnl)} · 수익률 ${fmtPct(report.portfolio.totalReturnRate)}`,
  ];

  if (report.portfolioPnlChange != null) {
    lines.push(`전일 대비 손익 ${fmtSigned(report.portfolioPnlChange)}`);
  }

  if (report.headlineAlerts.length > 0) {
    lines.push("", "🔔 시그널");
    for (const a of report.headlineAlerts) {
      const row = report.rows.find((r) => r.stock.id === a.stockId);
      const name = row?.stock.name ?? a.stockId;
      lines.push(`· [${a.kind === "buy" ? "매수" : "매도"}] ${name}: ${a.title} — ${a.detail}`);
    }
  }

  lines.push("", "종목");
  for (const row of report.rows) {
    const { stock, summary, priceChangePctFromPrev, dropFromPeakPct, gainFromAvgPct } = row;
    const ch =
      priceChangePctFromPrev != null ? ` 전일比 ${priceChangePctFromPrev >= 0 ? "+" : ""}${priceChangePctFromPrev.toFixed(2)}%` : "";
    const hold =
      summary.holdingQty > 0
        ? ` · ${fmtQty(summary.holdingQty)}주 · ${fmtSigned(summary.unrealizedPnlWithCost)} (${fmtPct(summary.unrealizedPnlPct)})`
        : "";
    const peak =
      dropFromPeakPct != null ? ` · 고점比 −${dropFromPeakPct.toFixed(1)}%` : "";
    const avg =
      gainFromAvgPct != null ? ` · 평단比 ${gainFromAvgPct >= 0 ? "+" : ""}${gainFromAvgPct.toFixed(1)}%` : "";
    lines.push(`· ${stock.name} ${fmt(summary.currentPrice)}${ch}${hold}${peak}${avg}`);
  }

  return lines.join("\n");
}

function emptySummary(stock: Stock): StockSummary {
  return {
    stockId: stock.id,
    stockName: stock.name,
    buyAmount: 0,
    sellAmount: 0,
    tradeCost: 0,
    tradeProfit: 0,
    netProfit: 0,
    returnRate: 0,
    lastSellPrice: null,
    timing10: null,
    timing20: null,
    sellTiming10: null,
    sellTiming20: null,
    holdingQty: 0,
    holdingAvgPrice: 0,
    holdingAvgPriceWithCost: 0,
    unrealizedPnl: 0,
    unrealizedPnlWithCost: 0,
    unrealizedPnlPct: 0,
    currentPrice: 0,
  };
}

export { DEFAULT_REPORT_SETTINGS };
