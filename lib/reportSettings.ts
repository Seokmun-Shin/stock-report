/** 일일 브리핑·매매 시그널 사용자 설정 */

export interface ReportSettings {
  /** 고점 대비 하락 % — 매수(재매수) 관심 구간 (기본 7) */
  buyDropFromPeakPct: number;
  /** 평단(비용포함) 대비 상승 % — 매도(익절) 관심 구간 (기본 10) */
  sellGainFromAvgPct: number;
}

export const DEFAULT_REPORT_SETTINGS: ReportSettings = {
  buyDropFromPeakPct: 7,
  sellGainFromAvgPct: 10,
};

export function resolveReportSettings(raw?: Partial<ReportSettings>): ReportSettings {
  return {
    buyDropFromPeakPct: clampPct(raw?.buyDropFromPeakPct, DEFAULT_REPORT_SETTINGS.buyDropFromPeakPct),
    sellGainFromAvgPct: clampPct(raw?.sellGainFromAvgPct, DEFAULT_REPORT_SETTINGS.sellGainFromAvgPct),
  };
}

function clampPct(v: number | undefined, fallback: number): number {
  if (v == null || !Number.isFinite(v) || v <= 0 || v > 99) return fallback;
  return v;
}
