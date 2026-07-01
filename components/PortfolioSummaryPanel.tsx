"use client";

import type { PortfolioSummary } from "@/lib/types";
import { fmt, fmtPct, fmtSigned } from "@/lib/calc";
import { PORTFOLIO_HINTS } from "@/lib/metricHints";
import { CollapsibleSection, SummaryChip } from "./CollapsibleSection";
import { StatCard } from "./StatCard";

export function PortfolioSummaryPanel({ portfolio }: { portfolio: PortfolioSummary }) {
  const tone = portfolio.totalPnl >= 0 ? "gain" : "loss";

  return (
    <CollapsibleSection
      title="전체 요약"
      unit
      summary={
        <>
          <SummaryChip label="누적 손익" value={fmtSigned(portfolio.totalPnl)} tone={tone} />
          <SummaryChip label="수익률" value={fmtPct(portfolio.totalReturnRate)} tone={tone} />
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatCard label="매수 총액" hint={PORTFOLIO_HINTS.buyAmount} value={fmt(portfolio.buyAmount)} />
        <StatCard label="매도 총액" hint={PORTFOLIO_HINTS.sellAmount} value={fmt(portfolio.sellAmount)} />
        <StatCard label="매매 비용" hint={PORTFOLIO_HINTS.tradeCost} value={fmt(portfolio.tradeCost)} />
        <StatCard
          label="실현 순수익"
          hint={PORTFOLIO_HINTS.netProfitRealized}
          value={fmt(portfolio.netProfitRealized)}
          tone={portfolio.netProfitRealized >= 0 ? "gain" : "loss"}
        />
        <StatCard
          label="미실현 손익"
          hint={PORTFOLIO_HINTS.unrealizedPnl}
          value={fmtSigned(portfolio.unrealizedPnl)}
          tone={portfolio.unrealizedPnl >= 0 ? "gain" : "loss"}
        />
        <StatCard
          label="수익률"
          hint={PORTFOLIO_HINTS.returnRate}
          value={fmtPct(portfolio.totalReturnRate)}
          tone={portfolio.totalReturnRate >= 0 ? "gain" : "loss"}
        />
      </div>
    </CollapsibleSection>
  );
}
