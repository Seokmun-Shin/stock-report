import type { ReportSettings } from "./reportSettings";
import { resolveReportSettings } from "./reportSettings";
import type { StockSummary } from "./types";

export type ChartTimingKind = "buy1" | "buy2" | "sell1" | "sell2";

export interface ChartTimingLine {
  price: number;
  label: string;
  kind: ChartTimingKind;
}

/** 차트 Y축 범위·수평선용 — 설정된 매수·매도 타이밍 % */
export function buildChartTimingLines(
  summary: StockSummary | null | undefined,
  settingsInput?: Partial<ReportSettings>
): ChartTimingLine[] {
  const settings = resolveReportSettings(settingsInput);
  if (!settings.useTimingPctLines || !summary) return [];

  const lines: ChartTimingLine[] = [];

  if (summary.timing10 != null && summary.timing10 > 0) {
    lines.push({
      price: summary.timing10,
      label: `매수1 −${settings.buyTimingPct1}%`,
      kind: "buy1",
    });
  }
  if (summary.timing20 != null && summary.timing20 > 0) {
    lines.push({
      price: summary.timing20,
      label: `매수2 −${settings.buyTimingPct2}%`,
      kind: "buy2",
    });
  }
  if (summary.holdingQty > 0 && summary.sellTiming10 != null && summary.sellTiming10 > 0) {
    lines.push({
      price: summary.sellTiming10,
      label: `매도1 +${settings.sellTimingPct1}%`,
      kind: "sell1",
    });
  }
  if (summary.holdingQty > 0 && summary.sellTiming20 != null && summary.sellTiming20 > 0) {
    lines.push({
      price: summary.sellTiming20,
      label: `매도2 +${settings.sellTimingPct2}%`,
      kind: "sell2",
    });
  }

  return lines;
}
