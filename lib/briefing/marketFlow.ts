/** KIS 시장 전체 수급 → 판단 점수 요약 */

import type { MarketInvestorFlow } from "./types";

export function summarizeMarketInvestorFlow(
  flows: MarketInvestorFlow[] | undefined
): { score: number; note: string } {
  if (!flows?.length) return { score: 0, note: "" };

  let score = 0;
  const notes: string[] = [];

  const kospi = flows.find((f) => f.market === "KSP");
  if (kospi) {
    const foreign =
      kospi.intraday?.foreignNetQty ??
      kospi.daily?.[0]?.foreignNetQty;
    if (foreign != null && foreign !== 0) {
      const sign = foreign > 0 ? "+" : "";
      notes.push(`코스피 외국인 ${sign}${foreign.toLocaleString()}주`);
      if (foreign >= 100_000_000) score += 0.35;
      else if (foreign >= 10_000_000) score += 0.2;
      else if (foreign <= -100_000_000) score -= 0.35;
      else if (foreign <= -10_000_000) score -= 0.2;
    }

    const recent = kospi.daily?.slice(0, 5) ?? [];
    if (recent.length >= 3) {
      const sum = recent.reduce((s, d) => s + (d.foreignNetQty ?? 0), 0);
      if (sum >= 300_000_000) {
        score += 0.15;
        notes.push(`코스피 외국인 5일 +${(sum / 1_000_000).toFixed(0)}M주`);
      } else if (sum <= -300_000_000) {
        score -= 0.15;
        notes.push(`코스피 외국인 5일 ${(sum / 1_000_000).toFixed(0)}M주`);
      }
    }
  }

  return { score, note: notes.join(" · ") };
}
