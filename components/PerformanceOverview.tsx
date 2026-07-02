"use client";

import type { PortfolioSummary } from "@/lib/types";
import { fmtPct, fmtSigned } from "@/lib/calc";
import { PORTFOLIO_HINTS } from "@/lib/metricHints";
import { HintTooltip } from "./StatCard";
import { InsetCard, PageSectionTitle, PanelCard, UI } from "./ui/PanelCard";

function MetricBlock({
  title,
  subtitle,
  accentClass,
  borderClass,
  pnl,
  pnlLabel,
  rate,
  rateLabel,
  rateHint,
}: {
  title: string;
  subtitle: string;
  accentClass: string;
  borderClass: string;
  pnl: number;
  pnlLabel: string;
  rate: number;
  rateLabel: string;
  rateHint: string;
}) {
  const tone = pnl >= 0 ? "text-gain" : "text-loss";

  return (
    <div className={`rounded-lg border p-3 ${borderClass}`}>
      <p className={`text-xs font-bold ${accentClass}`}>{title}</p>
      <p className={`mt-0.5 ${UI.micro}`}>{subtitle}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <p className={UI.metricLabel}>{pnlLabel}</p>
          <p className={`mt-1 ${UI.metricHero} ${tone}`}>{fmtSigned(pnl)}</p>
        </div>
        <div>
          <p className={`${UI.metricLabel} inline-flex items-center`}>
            {rateLabel}
            <HintTooltip text={rateHint} align="right" />
          </p>
          <p className={`mt-1 ${UI.metricHero} ${tone}`}>{fmtPct(rate)}</p>
        </div>
      </div>
    </div>
  );
}

export function PerformanceOverview({ portfolio }: { portfolio: PortfolioSummary }) {
  const totalTone = portfolio.totalPnl >= 0 ? "text-gain" : "text-loss";

  return (
    <PanelCard>
      <PageSectionTitle unit>성과 구분</PageSectionTitle>
      <p className={`mt-1 ${UI.body}`}>매도로 확정된 금액과, 아직 보유 중인 평가 손익을 나눠 표시합니다.</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MetricBlock
          title="실현 성과"
          subtitle="이미 매도해 확정된 손익"
          accentClass="text-gain"
          borderClass="border-gain/25 bg-gain-soft/25"
          pnl={portfolio.netProfitRealized}
          pnlLabel="실현 순수익"
          rate={portfolio.returnRateRealized}
          rateLabel="실현 수익률"
          rateHint={PORTFOLIO_HINTS.returnRateRealized}
        />
        <MetricBlock
          title="평가 성과 (미실현)"
          subtitle="현재 보유 주식 — 시세 변동 반영"
          accentClass="text-amber-800"
          borderClass="border-amber-200/90 bg-amber-50/50"
          pnl={portfolio.unrealizedPnlWithCost}
          pnlLabel="평가 손익"
          rate={portfolio.unrealizedReturnRate}
          rateLabel="평가 수익률"
          rateHint={PORTFOLIO_HINTS.unrealizedReturnRate}
        />
      </div>

      <InsetCard className="mt-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-ink">합계 (실현 + 평가)</p>
            <p className={`mt-0.5 ${UI.micro}`}>{PORTFOLIO_HINTS.totalPnl}</p>
          </div>
          <div className="text-right">
            <p className={`${UI.metricHero} ${totalTone}`}>{fmtSigned(portfolio.totalPnl)}</p>
            <p className={`text-sm font-bold tabular-nums ${totalTone}`}>{fmtPct(portfolio.totalReturnRate)}</p>
          </div>
        </div>
      </InsetCard>
    </PanelCard>
  );
}
