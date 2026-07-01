/** 일일 브리핑·타이밍·알림 사용자 설정 */

export interface ReportSettings {
  buyDropFromPeakPct: number;
  sellGainFromAvgPct: number;
  buyTimingPct1: number;
  buyTimingPct2: number;
  sellTimingPct1: number;
  sellTimingPct2: number;
  targetPrices?: Record<string, number>;
  alertsEnabled?: boolean;
}

export const DEFAULT_REPORT_SETTINGS: ReportSettings = {
  buyDropFromPeakPct: 7,
  sellGainFromAvgPct: 10,
  buyTimingPct1: 10,
  buyTimingPct2: 20,
  sellTimingPct1: 10,
  sellTimingPct2: 20,
  targetPrices: {},
  alertsEnabled: false,
};

export function resolveReportSettings(raw?: Partial<ReportSettings>): ReportSettings {
  return {
    buyDropFromPeakPct: clampPct(raw?.buyDropFromPeakPct, DEFAULT_REPORT_SETTINGS.buyDropFromPeakPct),
    sellGainFromAvgPct: clampPct(raw?.sellGainFromAvgPct, DEFAULT_REPORT_SETTINGS.sellGainFromAvgPct),
    buyTimingPct1: clampPct(raw?.buyTimingPct1, DEFAULT_REPORT_SETTINGS.buyTimingPct1),
    buyTimingPct2: clampPct(raw?.buyTimingPct2, DEFAULT_REPORT_SETTINGS.buyTimingPct2),
    sellTimingPct1: clampPct(raw?.sellTimingPct1, DEFAULT_REPORT_SETTINGS.sellTimingPct1),
    sellTimingPct2: clampPct(raw?.sellTimingPct2, DEFAULT_REPORT_SETTINGS.sellTimingPct2),
    targetPrices: raw?.targetPrices ?? {},
    alertsEnabled: raw?.alertsEnabled ?? false,
  };
}

function clampPct(v: number | undefined, fallback: number): number {
  if (v == null || !Number.isFinite(v) || v <= 0 || v > 99) return fallback;
  return v;
}

export function timingLineFromSell(lastSell: number, dropPct: number): number {
  return Math.round(lastSell * (1 - dropPct / 100));
}

export function timingLineFromAvg(avg: number, gainPct: number): number {
  return Math.round(avg * (1 + gainPct / 100));
}
