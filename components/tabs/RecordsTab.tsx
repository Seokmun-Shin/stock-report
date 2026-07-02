"use client";

import type { BuyTimingSignal, SellTimingSignal, Stock, StockSummary, Trade } from "@/lib/types";
import type { TradeSuggestion } from "@/lib/briefing/tradeSuggestions";
import type { ReportSettings } from "@/lib/reportSettings";
import { TabIntroBanner, PanelCard, PageSectionTitle } from "@/components/ui/PanelCard";
import { StockDetailPanel } from "@/components/StockDetailPanel";
import { TradeHistorySection } from "@/components/TradeSection";

export function RecordsTab({
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
}: {
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
}) {
  return (
    <div className="space-y-3">
      <TabIntroBanner
        title="③ 체결 기록"
        description="증권사에서 주문한 뒤, 확인서 기준으로 입력합니다. 입력 즉시 ① 판단·④ 성과에 반영됩니다."
      />

      {addingStock && (
        <PanelCard>
          <span className="text-sm font-bold text-ink">종목 추가</span>
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
      </StockDetailPanel>
    </div>
  );
}
