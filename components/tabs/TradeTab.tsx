"use client";

import type { AppData, BuyTimingSignal, SellTimingSignal, Stock, StockSummary, Trade } from "@/lib/types";
import type { TradeRecommendation } from "@/lib/briefing/types";
import type { TradeSuggestion } from "@/lib/briefing/tradeSuggestions";
import type { ReportSettings } from "@/lib/reportSettings";
import type { MarketBriefingContext } from "@/lib/briefing/types";
import { StockDetailPanel } from "@/components/StockDetailPanel";
import { StockEssentialBar } from "@/components/StockEssentialBar";
import { TradeHistorySection } from "@/components/TradeSection";
import { StockSettlement, TimingRadar } from "@/components/TimingRadar";
import { StockContextSnippet } from "@/components/MarketContextPanel";
import { StockEventsPanel } from "@/components/StockEventsPanel";
import { TimingZonesPanel } from "@/components/TimingZonesPanel";
import type { StockTradingPlan } from "@/lib/briefing/tradingZones";

export type TradeSubView = "trade" | "detail";

export function TradeTab({
  data,
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
  activeRecommendation,
  tradeFormOpen,
  onTradeFormOpenChange,
  stockTrades,
  capitalIds,
  editingTrade,
  onSubmitTrade,
  onToggleCapital,
  onEditTrade,
  onDeleteTrade,
  onCancelEditTrade,
  tradeSuggestion,
  buySignal,
  sellSignal,
  onPriceChange,
  kisConfigured,
  kisLoading,
  kisError,
  kisLastUpdated,
  kisAutoRefresh,
  onKisAutoRefreshChange,
  onKisRefresh,
  reportSettings,
  targetPrice,
  onTargetPriceChange,
  activeTradingPlan,
  marketContext,
  onPersist,
  subView,
  onSubViewChange,
}: {
  data: AppData;
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
  activeRecommendation: TradeRecommendation | null;
  tradeFormOpen: boolean;
  onTradeFormOpenChange: (open: boolean) => void;
  stockTrades: Trade[];
  capitalIds: Set<string>;
  editingTrade: Trade | null;
  onSubmitTrade: (t: Omit<Trade, "id" | "stockId" | "createdAt">) => void;
  onToggleCapital: (tradeId: string) => void;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
  onCancelEditTrade: () => void;
  tradeSuggestion: TradeSuggestion | null;
  buySignal: BuyTimingSignal | null;
  sellSignal: SellTimingSignal | null;
  onPriceChange: (price: number) => void;
  kisConfigured: boolean | null;
  kisLoading: boolean;
  kisError: string | null;
  kisLastUpdated: Date | null;
  kisAutoRefresh: boolean;
  onKisAutoRefreshChange: (v: boolean) => void;
  onKisRefresh: () => void;
  reportSettings: ReportSettings;
  targetPrice?: number;
  onTargetPriceChange: (p: number) => void;
  activeTradingPlan: StockTradingPlan | null;
  marketContext: MarketBriefingContext | null;
  onPersist: (next: AppData) => void;
  subView: TradeSubView;
  onSubViewChange: (v: TradeSubView) => void;
}) {
  return (
    <div className="space-y-3">
      {addingStock && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-3 shadow-sm">
          <span className="w-full text-sm font-medium text-ink-muted">종목 추가</span>
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
            placeholder="코드 (선택)"
            value={newStockCode}
            onChange={(e) => onNewStockCodeChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddStock()}
          />
          <button type="button" onClick={onAddStock} className="rounded-lg bg-gain px-4 py-1.5 text-sm font-medium text-white">
            추가
          </button>
          <button type="button" onClick={onCancelAddStock} className="rounded-lg border border-line px-4 py-1.5 text-sm text-ink-muted">
            취소
          </button>
        </div>
      )}

      <div className="flex rounded-xl border border-line bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onSubViewChange("trade")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
            subView === "trade" ? "bg-gain text-white" : "text-ink-muted hover:bg-surface-dim"
          }`}
        >
          매매 입력
        </button>
        <button
          type="button"
          onClick={() => onSubViewChange("detail")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
            subView === "detail" ? "bg-gain text-white" : "text-ink-muted hover:bg-surface-dim"
          }`}
        >
          종목 상세
        </button>
      </div>

      <StockDetailPanel
        stocks={stocks}
        activeId={activeId}
        onSelect={onSelectStock}
        onEdit={onEditStock}
        onDelete={onDeleteStock}
      >
        {stockSummary && activeStock && (
          <StockEssentialBar
            summary={stockSummary}
            quote={data.stockQuotes?.[activeStock.id]}
            recommendation={activeRecommendation}
            kisLoading={kisLoading}
            onRefreshPrice={onKisRefresh}
            onAddTrade={() => {
              onSubViewChange("trade");
              onTradeFormOpenChange(true);
            }}
          />
        )}

        {subView === "trade" && activeStock && stockSummary && buySignal && sellSignal && (
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
            hideHeaderAction
          />
        )}

        {subView === "detail" && activeStock && stockSummary && buySignal && sellSignal && (
          <div className="space-y-4">
            <StockSettlement stockName={activeStock.name} summary={stockSummary} />
            <TimingRadar
              summary={stockSummary}
              buySignal={buySignal}
              sellSignal={sellSignal}
              onPriceChange={onPriceChange}
              kisConfigured={kisConfigured}
              kisLoading={kisLoading}
              kisError={kisError}
              kisLastUpdated={kisLastUpdated}
              kisAutoRefresh={kisAutoRefresh}
              onKisAutoRefreshChange={onKisAutoRefreshChange}
              onKisRefresh={onKisRefresh}
              kisStockCode={activeStock.code}
              stockQuote={data.stockQuotes?.[activeStock.id]}
              reportSettings={data.reportSettings}
              targetPrice={targetPrice}
              onTargetPriceChange={onTargetPriceChange}
            />
            {activeTradingPlan && reportSettings.useTimingPctLines && (
              <div className="rounded-xl border border-line bg-surface-dim/20 p-4">
                <p className="mb-2 text-sm font-semibold text-ink">매매 구간 (% 타이밍선)</p>
                <TimingZonesPanel plan={activeTradingPlan} />
              </div>
            )}
            <StockContextSnippet stockId={activeStock.id} context={marketContext} />
            <StockEventsPanel data={data} activeStock={activeStock} onPersist={onPersist} />
          </div>
        )}
      </StockDetailPanel>
    </div>
  );
}
