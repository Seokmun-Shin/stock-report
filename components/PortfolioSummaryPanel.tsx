"use client";

import type { PortfolioSummary } from "@/lib/types";
import { fmt, fmtPct, fmtSigned } from "@/lib/calc";
import { PORTFOLIO_HINTS } from "@/lib/metricHints";
import { CollapsibleSection, SummaryChip } from "./CollapsibleSection";
import { StatCard, ZoneDivider } from "./StatCard";

export function PortfolioSummaryPanel({ portfolio }: { portfolio: PortfolioSummary }) {
  const realizedTone = portfolio.netProfitRealized >= 0 ? "gain" : "loss";
  const unrealizedTone = portfolio.unrealizedPnlWithCost >= 0 ? "gain" : "loss";

  return (
    <CollapsibleSection
      title="상세 내역"
      unit
      summary={
        <>
          <SummaryChip label="실현" value={fmtSigned(portfolio.netProfitRealized)} tone={realizedTone} />
          <SummaryChip label="평가" value={fmtSigned(portfolio.unrealizedPnlWithCost)} tone={unrealizedTone} />
        </>
      }
    >
      <ZoneDivider label="실현 (매도 확정)" />
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatCard label="매수 총액" hint={PORTFOLIO_HINTS.buyAmount} value={fmt(portfolio.buyAmount)} />
        <StatCard label="매도 총액" hint={PORTFOLIO_HINTS.sellAmount} value={fmt(portfolio.sellAmount)} />
        <StatCard label="매매 비용" hint={PORTFOLIO_HINTS.tradeCost} value={fmt(portfolio.tradeCost)} />
        <StatCard
          label="실현 순수익"
          hint={PORTFOLIO_HINTS.netProfitRealized}
          value={fmt(portfolio.netProfitRealized)}
          tone={realizedTone}
        />
        <StatCard
          label="실현 수익률"
          hint={PORTFOLIO_HINTS.returnRateRealized}
          value={fmtPct(portfolio.returnRateRealized)}
          tone={realizedTone}
        />
      </div>

      <div className="mt-4">
        <ZoneDivider label="평가 (보유 중 · 미실현)" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatCard
          label="보유 매입원가"
          hint="보유 주식 매입단가×수량 (수수료 포함)"
          value={fmt(portfolio.holdingCostBasis)}
        />
        <StatCard
          label="평가 손익"
          hint={PORTFOLIO_HINTS.unrealizedPnlWithCost}
          value={fmtSigned(portfolio.unrealizedPnlWithCost)}
          tone={unrealizedTone}
        />
        <StatCard
          label="평가 수익률"
          hint={PORTFOLIO_HINTS.unrealizedReturnRate}
          value={fmtPct(portfolio.unrealizedReturnRate)}
          tone={unrealizedTone}
        />
      </div>
    </CollapsibleSection>
  );
}
