"use client";

import type { AppData, InitialCapitalSummary, PortfolioSummary, Stock, StockSummary } from "@/lib/types";
import { TabIntroBanner } from "@/components/ui/PanelCard";
import { InitialCapitalPanel } from "@/components/InitialCapitalPanel";
import { PeriodReportPanel } from "@/components/PeriodReportPanel";
import { PerformanceOverview } from "@/components/PerformanceOverview";
import { PortfolioSummaryPanel } from "@/components/PortfolioSummaryPanel";
import { StockDetailPanel } from "@/components/StockDetailPanel";
import { StockSettlement } from "@/components/TimingRadar";

export function ReportTab({
  data,
  portfolio,
  capital,
  stocks,
  summaries,
  activeId,
  onSelectStock,
  onEditStock,
  onDeleteStock,
}: {
  data: AppData;
  portfolio: PortfolioSummary;
  capital: InitialCapitalSummary;
  stocks: Stock[];
  summaries: Record<string, StockSummary>;
  activeId: string;
  onSelectStock: (id: string) => void;
  onEditStock: (stock: Stock) => void;
  onDeleteStock: (id: string) => void;
}) {
  const activeStock = stocks.find((s) => s.id === activeId);
  const stockSummary = summaries[activeId];

  return (
    <div className="space-y-3">
      <TabIntroBanner
        title="④ 성과"
        description="실현(매도 확정)과 평가(보유·미실현)를 구분해 봅니다. ③ 기록 → FIFO 집계 · ① 판단 보조 신호로도 씁니다."
      />

      <PerformanceOverview portfolio={portfolio} />

      <PortfolioSummaryPanel portfolio={portfolio} />

      {stocks.length > 0 && (
        <StockDetailPanel
          stocks={stocks}
          activeId={activeId}
          onSelect={onSelectStock}
          onEdit={onEditStock}
          onDelete={onDeleteStock}
        >
          {activeStock && stockSummary && <StockSettlement stockName={activeStock.name} summary={stockSummary} />}
        </StockDetailPanel>
      )}

      <PeriodReportPanel data={data} />
      <InitialCapitalPanel summary={capital} />
    </div>
  );
}
