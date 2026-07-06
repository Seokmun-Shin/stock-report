"use client";

import type { PortfolioSummary } from "@/lib/types";
import { fmtPct, fmtSigned } from "@/lib/calc";
import { PORTFOLIO_HINTS } from "@/lib/metricHints";
import { HintTooltip } from "./StatCard";
import { PageSectionTitle, PanelCard, UI, AreaSectionSubtitle, AreaSectionTitle } from "./ui/PanelCard";

type MetricTone = "gain" | "loss" | "neutral";

function metricTone(n: number): MetricTone {
  if (n > 0) return "gain";
  if (n < 0) return "loss";
  return "neutral";
}

function toneText(tone: MetricTone) {
  if (tone === "gain") return "text-gain";
  if (tone === "loss") return "text-loss";
  return "text-ink-muted";
}

function toneSurface(tone: MetricTone) {
  if (tone === "gain") return "border-gain/30 bg-gain-soft/50";
  if (tone === "loss") return "border-loss/30 bg-loss-soft/50";
  return "border-line bg-surface-dim/40";
}

function MetricLabelRow({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex h-5 items-center">
      <span className={`inline-flex items-center gap-0.5 ${UI.metricLabel}`}>
        {label}
        {hint && <HintTooltip text={hint} align="right" />}
      </span>
    </div>
  );
}

function MetricBlock({
  title,
  subtitle,
  pnl,
  pnlLabel,
  rate,
  rateLabel,
  rateHint,
}: {
  title: string;
  subtitle: string;
  pnl: number;
  pnlLabel: string;
  rate: number;
  rateLabel: string;
  rateHint: string;
}) {
  const blockTone = metricTone(pnl);
  const pnlTone = metricTone(pnl);
  const rateTone = metricTone(rate);

  return (
    <div className={`rounded-lg border p-2.5 sm:p-3 ${toneSurface(blockTone)}`}>
      <AreaSectionTitle as="p" size="sub">
        {title}
      </AreaSectionTitle>
      <AreaSectionSubtitle>{subtitle}</AreaSectionSubtitle>
      <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1">
        <MetricLabelRow label={pnlLabel} />
        <MetricLabelRow label={rateLabel} hint={rateHint} />
        <p className={`${UI.metricCompact} ${toneText(pnlTone)}`}>{fmtSigned(pnl)}</p>
        <p className={`${UI.metricCompact} ${toneText(rateTone)}`}>{fmtPct(rate)}</p>
      </div>
    </div>
  );
}

export function PerformanceOverview({ portfolio }: { portfolio: PortfolioSummary }) {
  const totalTone = metricTone(portfolio.totalPnl);
  const totalSurface = toneSurface(totalTone);

  return (
    <PanelCard>
      <PageSectionTitle unit>성과 구분</PageSectionTitle>
      <AreaSectionSubtitle>매도로 확정된 금액과, 아직 보유 중인 평가 손익을 나눠 표시합니다.</AreaSectionSubtitle>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MetricBlock
          title="실현 성과"
          subtitle="이미 매도해 확정된 손익"
          pnl={portfolio.netProfitRealized}
          pnlLabel="실현 순수익"
          rate={portfolio.returnRateRealized}
          rateLabel="실현 수익률"
          rateHint={PORTFOLIO_HINTS.returnRateRealized}
        />
        <MetricBlock
          title="평가 성과 (미실현)"
          subtitle="현재 보유 주식 — 시세 변동 반영"
          pnl={portfolio.unrealizedPnlWithCost}
          pnlLabel="평가 손익"
          rate={portfolio.unrealizedReturnRate}
          rateLabel="평가 수익률"
          rateHint={PORTFOLIO_HINTS.unrealizedReturnRate}
        />
      </div>

      <div className={`mt-3 rounded-lg border px-3 py-2.5 ${totalSurface}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <AreaSectionTitle as="p" size="sub">
              합계 (실현 + 평가)
            </AreaSectionTitle>
            <AreaSectionSubtitle>{PORTFOLIO_HINTS.totalPnl}</AreaSectionSubtitle>
          </div>
          <div className="text-right">
            <p className={`${UI.metricValue} ${toneText(totalTone)}`}>{fmtSigned(portfolio.totalPnl)}</p>
            <p className={`mt-0.5 text-sm font-bold tabular-nums ${toneText(metricTone(portfolio.totalReturnRate))}`}>
              {fmtPct(portfolio.totalReturnRate)}
            </p>
          </div>
        </div>
      </div>
    </PanelCard>
  );
}
