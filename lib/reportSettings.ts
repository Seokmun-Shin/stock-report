/** 일일 브리핑·타이밍·알림 사용자 설정 */

export interface ReportSettings {
  /** 최근 매도가·평단 기준 1·2차 % 타이밍선 (끄면 추천·브리핑·알림에서 제외) */
  useTimingPctLines?: boolean;
  buyDropFromPeakPct: number;
  sellGainFromAvgPct: number;
  buyTimingPct1: number;
  buyTimingPct2: number;
  sellTimingPct1: number;
  sellTimingPct2: number;
  targetPrices?: Record<string, number>;
  alertsEnabled?: boolean;
  /** 매수 총 비용 (%) — 위탁+유관기관, 세금 없음. 0.01362 = 0.01362% */
  buyTotalFeePct?: number;
  /** 매도 수수료 (%) — 위탁+유관기관. 0.01264 = 0.01264% */
  sellTotalFeePct?: number;
  /** 매도 증권거래세 (%). 0.20 = 0.20% */
  sellTransactionTaxPct?: number;
  /** @deprecated buyTotalFeePct 사용 */
  onlineCommissionPct?: number;
}

export const DEFAULT_REPORT_SETTINGS: ReportSettings = {
  useTimingPctLines: true,
  buyDropFromPeakPct: 7,
  sellGainFromAvgPct: 10,
  buyTimingPct1: 10,
  buyTimingPct2: 20,
  sellTimingPct1: 10,
  sellTimingPct2: 20,
  targetPrices: {},
  alertsEnabled: true,
  buyTotalFeePct: 0.01362,
  sellTotalFeePct: 0.01264,
  sellTransactionTaxPct: 0.2,
};

export function resolveReportSettings(raw?: Partial<ReportSettings>): ReportSettings {
  return {
    useTimingPctLines: raw?.useTimingPctLines ?? DEFAULT_REPORT_SETTINGS.useTimingPctLines ?? true,
    buyDropFromPeakPct: clampPct(raw?.buyDropFromPeakPct, DEFAULT_REPORT_SETTINGS.buyDropFromPeakPct),
    sellGainFromAvgPct: clampPct(raw?.sellGainFromAvgPct, DEFAULT_REPORT_SETTINGS.sellGainFromAvgPct),
    buyTimingPct1: clampPct(raw?.buyTimingPct1, DEFAULT_REPORT_SETTINGS.buyTimingPct1),
    buyTimingPct2: clampPct(raw?.buyTimingPct2, DEFAULT_REPORT_SETTINGS.buyTimingPct2),
    sellTimingPct1: clampPct(raw?.sellTimingPct1, DEFAULT_REPORT_SETTINGS.sellTimingPct1),
    sellTimingPct2: clampPct(raw?.sellTimingPct2, DEFAULT_REPORT_SETTINGS.sellTimingPct2),
    targetPrices: raw?.targetPrices ?? {},
    alertsEnabled: raw?.alertsEnabled ?? DEFAULT_REPORT_SETTINGS.alertsEnabled ?? true,
    buyTotalFeePct: clampFeePct(raw?.buyTotalFeePct, DEFAULT_REPORT_SETTINGS.buyTotalFeePct ?? 0.01362),
    sellTotalFeePct: clampFeePct(raw?.sellTotalFeePct, DEFAULT_REPORT_SETTINGS.sellTotalFeePct ?? 0.01264),
    sellTransactionTaxPct: clampFeePct(raw?.sellTransactionTaxPct, DEFAULT_REPORT_SETTINGS.sellTransactionTaxPct ?? 0.2),
  };
}

function clampFeePct(v: number | undefined, fallback: number): number {
  if (v == null || !Number.isFinite(v) || v < 0 || v > 2) return fallback;
  return v;
}

function clampPct(v: number | undefined, fallback: number): number {
  if (v == null || !Number.isFinite(v) || v <= 0 || v > 99) return fallback;
  return v;
}

/** UI 표시용 — 0.01362 → "0.01362%", 0.2 → "0.2%" */
export function formatFeePct(pct: number): string {
  if (pct >= 0.1) return `${pct}%`;
  const trimmed = pct.toFixed(5).replace(/0+$/, "").replace(/\.$/, "");
  return `${trimmed}%`;
}

/** @deprecated formatFeePct 사용 */
export function formatOnlineCommissionPct(pct: number): string {
  return formatFeePct(pct);
}

export function buyFeeRateFromSettings(settings?: Partial<ReportSettings>): number {
  return resolveReportSettings(settings).buyTotalFeePct! / 100;
}

export function sellFeeRateFromSettings(settings?: Partial<ReportSettings>): number {
  return resolveReportSettings(settings).sellTotalFeePct! / 100;
}

export function sellTaxRateFromSettings(settings?: Partial<ReportSettings>): number {
  return resolveReportSettings(settings).sellTransactionTaxPct! / 100;
}

/** @deprecated buyFeeRateFromSettings 사용 */
export function commissionRateFromSettings(settings?: Partial<ReportSettings>): number {
  return buyFeeRateFromSettings(settings);
}

export function timingLineFromSell(lastSell: number, dropPct: number): number {
  return Math.round(lastSell * (1 - dropPct / 100));
}

export function timingLineFromAvg(avg: number, gainPct: number): number {
  return Math.round(avg * (1 + gainPct / 100));
}
