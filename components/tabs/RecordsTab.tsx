"use client";

import type { AppData, BuyTimingSignal, SellTimingSignal, Stock, StockSummary, Trade } from "@/lib/types";
import type { TradeSuggestion } from "@/lib/briefing/tradeSuggestions";
import type { ReportSettings } from "@/lib/reportSettings";
import { TabIntroBanner, PanelCard, AreaCardHeader, UI, BtnCreate, BtnCancel } from "@/components/ui/PanelCard";
import { CsvImportPanel } from "@/components/CsvImportPanel";
import type { ParsedTradeRow } from "@/lib/import/tradeCsv";
import { StockDetailPanel } from "@/components/StockDetailPanel";
import { TradeHistorySection } from "@/components/TradeSection";
import { StockEventsPanel } from "@/components/StockEventsPanel";
import { EmptyPortfolioGuide } from "@/components/EmptyPortfolioGuide";

export function RecordsTab({
  data,
  onPersist,
  stocks,
  activeId,
  onSelectStock,
  onEditStock,
  onDeleteStock,
  addingStock,
  newStockName,
  newStockCode,
  onNewStockNameChange,
  onNewStockCodeChange,
  onAddStock,
  onCancelAddStock,
  stockSummary,
  activeStock,
  stockTrades,
  capitalIds,
  editingTrade,
  onSubmitTrade,
  onToggleCapital,
  onEditTrade,
  onDeleteTrade,
  onCancelEditTrade,
  tradeSuggestion,
  tradeFormOpen,
  onTradeFormOpenChange,
  buySignal,
  sellSignal,
  reportSettings,
  onImportCsv,
  standalone = false,
  onBeginAddStock,
}: {
  data: AppData;
  onPersist: (next: AppData) => void;
  stocks: Stock[];
  activeId: string;
  onSelectStock: (id: string) => void;
  onEditStock: (stock: Stock) => void;
  onDeleteStock: (id: string) => void;
  addingStock: boolean;
  newStockName: string;
  newStockCode: string;
  onNewStockNameChange: (name: string) => void;
  onNewStockCodeChange: (code: string) => void;
  onAddStock: () => void;
  onCancelAddStock: () => void;
  stockSummary: StockSummary | null;
  activeStock: Stock | undefined;
  stockTrades: Trade[];
  capitalIds: Set<string>;
  editingTrade: Trade | null;
  onSubmitTrade: (t: Omit<Trade, "id" | "stockId" | "createdAt">) => void;
  onToggleCapital: (tradeId: string) => void;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
  onCancelEditTrade: () => void;
  tradeSuggestion: TradeSuggestion | null;
  tradeFormOpen: boolean;
  onTradeFormOpenChange: (open: boolean) => void;
  buySignal: BuyTimingSignal | null;
  sellSignal: SellTimingSignal | null;
  reportSettings?: Partial<ReportSettings>;
  onImportCsv?: (rows: ParsedTradeRow[]) => void;
  standalone?: boolean;
  onBeginAddStock?: () => void;
}) {
  return (
    <>
      <TabIntroBanner
        title="매매 기록·관리"
        description="체결·종목을 맞춰 두면 타이밍·손익 판단의 기초가 됩니다. 하단 탭에서 「살까?팔까?」「왜?추천?」을 확인하세요."
      />

      {stocks.length === 0 && onBeginAddStock && (
        <EmptyPortfolioGuide onAddStock={onBeginAddStock} standalone={standalone} />
      )}

      {addingStock && (
        <PanelCard>
          <AreaCardHeader as="h3" title="종목 추가" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              className={`${UI.input} min-w-[120px] flex-1`}
              placeholder="종목명 (필수)"
              value={newStockName}
              onChange={(e) => onNewStockNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onAddStock()}
              autoFocus
            />
            <input
              className={`${UI.input} w-36`}
              placeholder="코드 (6자리, 시세용)"
              value={newStockCode}
              onChange={(e) => onNewStockCodeChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onAddStock()}
            />
            <BtnCreate onClick={onAddStock}>추가</BtnCreate>
            <BtnCancel onClick={onCancelAddStock} />
          </div>
        </PanelCard>
      )}

      <StockDetailPanel
        stocks={stocks}
        activeId={activeId}
        onSelect={onSelectStock}
        onEdit={onEditStock}
        onDelete={onDeleteStock}
      >
        {activeStock && stockSummary && buySignal && sellSignal && (
          <TradeHistorySection
            stockName={activeStock.name}
            trades={stockTrades}
            initialCapitalIds={capitalIds}
            editing={editingTrade}
            onSubmit={onSubmitTrade}
            onToggleCapital={onToggleCapital}
            onEdit={onEditTrade}
            onDelete={onDeleteTrade}
            onCancelEdit={onCancelEditTrade}
            suggestion={tradeSuggestion}
            formOpen={tradeFormOpen}
            onFormOpenChange={onTradeFormOpenChange}
            reportSettings={reportSettings}
          />
        )}
        {activeStock && (
          <StockEventsPanel data={data} activeStock={activeStock} onPersist={onPersist} />
        )}
      </StockDetailPanel>

      {onImportCsv && (
        <PanelCard>
          <AreaCardHeader
            title="체결 일괄 가져오기"
            subtitle="미래에셋 HTS 체결 CSV (한투·키움 선택 가능) · 설정 탭과 동일"
          />
          <CsvImportPanel stocks={stocks} trades={data.trades} onImport={onImportCsv} />
        </PanelCard>
      )}
    </>
  );
}
