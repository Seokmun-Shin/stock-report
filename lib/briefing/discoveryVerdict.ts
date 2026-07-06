import type { DiscoveryPick, StockDiscoveryReport } from "./stockDiscovery";

export interface DiscoveryVerdictHint {
  label: "관심" | "주의" | "관망";
  headline: string;
  tone: "gain" | "loss" | "muted";
}

/** 발굴 종목용 경량 판단 힌트 (보유·체결 없음 — 스크리닝 참고) */
export function buildDiscoveryVerdictHint(
  pick: DiscoveryPick,
  report: StockDiscoveryReport | null
): DiscoveryVerdictHint {
  const gate = report?.gate;
  if (gate?.caution) {
    return {
      label: "관망",
      headline: "시장 주의 구간 — 신규 매수 보수적",
      tone: "muted",
    };
  }

  if (pick.signals.includes("foreign_buy") && pick.changeRate > 0 && pick.score >= 7) {
    return {
      label: "관심",
      headline: "수급·모멘텀 양호 — 관심종목 후보",
      tone: "gain",
    };
  }

  if (pick.changeRate >= 8) {
    return {
      label: "주의",
      headline: "급등 — 추격 매수 주의",
      tone: "loss",
    };
  }

  if (pick.score >= 6) {
    return {
      label: "관심",
      headline: "복합 순위 상위 — 추가 조사 권장",
      tone: "gain",
    };
  }

  return {
    label: "관망",
    headline: "발굴 참고 — 보유 종목 판단과 별도",
    tone: "muted",
  };
}
