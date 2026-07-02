"use client";

import type { AppData, InitialCapitalSummary, PortfolioSummary } from "@/lib/types";
import { fmtPct, fmtSigned } from "@/lib/calc";
import { CollapsibleSection, SummaryChip } from "./CollapsibleSection";
import { InitialCapitalPanel } from "./InitialCapitalPanel";
import { PeriodReportPanel } from "./PeriodReportPanel";
import { PortfolioSummaryPanel } from "./PortfolioSummaryPanel";

export function ReportsSection({
  data,
  portfolio,
  capital,
}: {
  data: AppData;
  portfolio: PortfolioSummary;
  capital: InitialCapitalSummary;
}) {
  const pnlTone = portfolio.totalPnl >= 0 ? "gain" : "loss";

  return (
    <CollapsibleSection
      title="성과·리포트"
      unit
      subtitle="누적 손익 · 기간별 실현 · 초기 투자금"
      summary={
        <>
          <SummaryChip label="누적 손익" value={fmtSigned(portfolio.totalPnl)} tone={pnlTone} />
          <SummaryChip label="수익률" value={fmtPct(portfolio.totalReturnRate)} tone={pnlTone} />
        </>
      }
    >
      <div className="space-y-4">
        <PortfolioSummaryPanel portfolio={portfolio} />
        <PeriodReportPanel data={data} />
        <InitialCapitalPanel summary={capital} />
      </div>
    </CollapsibleSection>
  );
}
