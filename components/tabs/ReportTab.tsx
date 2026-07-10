"use client";

import type { AppData, InitialCapitalSummary, PortfolioSummary, Stock, StockSummary } from "@/lib/types";
import { tabLabel } from "@/lib/appTabs";
import { TabIntroBanner, boxList } from "@/components/ui/PanelCard";
import { InitialCapitalPanel } from "@/components/InitialCapitalPanel";
import { PeriodReportPanel } from "@/components/PeriodReportPanel";
import { PerformanceOverview } from "@/components/PerformanceOverview";
import { PortfolioBenchmarkChart } from "@/components/PortfolioBenchmarkChart";
import { PortfolioSummaryPanel } from "@/components/PortfolioSummaryPanel";
import { StockDetailPanel } from "@/components/StockDetailPanel";
import { TimingBacktestPanel } from "@/components/TimingBacktestPanel";
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
    <>
      <TabIntroBanner
        title={tabLabel("report")}
        description="실현·평가 손익과 보유 상태를 확인합니다. 「기록해!」 체결 · 「살까?팔까?」 타이밍과 함께 봅니다."
      />

      <div className={boxList}>
        <PerformanceOverview portfolio={portfolio} />

        <PortfolioBenchmarkChart dailySnapshots={data.dailySnapshots} />

        <PortfolioSummaryPanel portfolio={portfolio} />

        <PeriodReportPanel data={data} />

        {stocks.length > 0 && (
          <StockDetailPanel
            stocks={stocks}
            activeId={activeId}
            onSelect={onSelectStock}
            onEdit={onEditStock}
            onDelete={onDeleteStock}
          >
            {activeStock && stockSummary && (
              <StockSettlement stockName={activeStock.name} summary={stockSummary} />
            )}
          </StockDetailPanel>
        )}

        <TimingBacktestPanel data={data} />

        <InitialCapitalPanel summary={capital} />
      </div>
    </>
  );
}
