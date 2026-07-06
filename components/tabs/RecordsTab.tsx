"use client";

import type { AppData, BuyTimingSignal, SellTimingSignal, Stock, StockSummary, Trade } from "@/lib/types";
import type { TradeSuggestion } from "@/lib/briefing/tradeSuggestions";
import type { ReportSettings } from "@/lib/reportSettings";
import { TabIntroBanner, PanelCard, PageSectionTitle, AreaSectionTitle } from "@/components/ui/PanelCard";
import { CsvImportPanel } from "@/components/CsvImportPanel";
import type { ParsedTradeRow } from "@/lib/import/tradeCsv";
import { StockDetailPanel } from "@/components/StockDetailPanel";
import { TradeHistorySection } from "@/components/TradeSection";
import { StockEventsPanel } from "@/components/StockEventsPanel";

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
}) {
  return (
    <div className="space-y-3">
      <TabIntroBanner
        title="③ 체결 기록"
        description="증권사 체결 입력 · 분할·배당은 DART 공시에서 자동 등록(데이터 새로고침 후)"
      />

      {onImportCsv && (
        <PanelCard>
          <PageSectionTitle>체결 일괄 가져오기</PageSectionTitle>
          <p className="mt-1 text-xs text-ink-muted">미래에셋 HTS 체결 CSV (한투·키움 선택 가능) · 설정 탭과 동일</p>
          <CsvImportPanel stocks={stocks} trades={data.trades} onImport={onImportCsv} />
        </PanelCard>
      )}

      {addingStock && (
        <PanelCard>
          <AreaSectionTitle as="span">종목 추가</AreaSectionTitle>
          <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            className="min-w-[120px] flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm"
            placeholder="종목명 (필수)"
            value={newStockName}
            onChange={(e) => onNewStockNameChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddStock()}
            autoFocus
          />
          <input
            className="w-36 rounded-lg border border-line bg-white px-3 py-2 text-sm tabular-nums"
            placeholder="코드 (KIS용)"
            value={newStockCode}
            onChange={(e) => onNewStockCodeChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddStock()}
          />
          <button type="button" onClick={onAddStock} className="rounded-lg bg-gain px-4 py-1.5 text-sm font-medium text-white">
            추가
          </button>
          <button type="button" onClick={onCancelAddStock} className="rounded-lg border border-line px-4 py-1.5 text-sm text-ink-muted hover:bg-surface-dim">
            취소
          </button>
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
    </div>
  );
}
