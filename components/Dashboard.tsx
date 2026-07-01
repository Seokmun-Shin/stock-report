"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { AppData, Stock, Trade } from "@/lib/types";
import { SEED } from "@/lib/seed";
import { suggestStockCode } from "@/lib/stockCodes";
import {
  getBuyTimingSignal,
  getSellTimingSignal,
  summarizeInitialCapital,
  summarizePortfolio,
  summarizeStock,
  uid,
} from "@/lib/calc";
import { UnitNotice } from "@/components/StatCard";
import { InitialCapitalPanel } from "@/components/InitialCapitalPanel";
import { PortfolioSummaryPanel } from "@/components/PortfolioSummaryPanel";
import { StockEditModal } from "@/components/StockEditModal";
import { StockSettlement, TimingRadar } from "@/components/TimingRadar";
import { TradeHistorySection } from "@/components/TradeSection";
import { applyPriceUpdates, useKisPrices } from "@/hooks/useKisPrices";

export function Dashboard({
  data,
  persist,
  user,
  signOut,
  syncing,
  syncError,
  cloudEnabled,
}: {
  data: AppData;
  persist: (next: AppData) => void;
  user: User | null;
  signOut: () => void;
  syncing: boolean;
  syncError: string | null;
  cloudEnabled: boolean;
}) {
  const [activeId, setActiveId] = useState(data.stocks[0]?.id ?? "");
  const [addingStock, setAddingStock] = useState(false);
  const [newStockName, setNewStockName] = useState("");
  const [newStockCode, setNewStockCode] = useState("");
  const [newStockCodeManual, setNewStockCodeManual] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);

  function beginAddStock() {
    setAddingStock(true);
    setNewStockName("");
    setNewStockCode("");
    setNewStockCodeManual(false);
  }

  function cancelAddStock() {
    setAddingStock(false);
    setNewStockName("");
    setNewStockCode("");
    setNewStockCodeManual(false);
  }

  function onNewStockNameChange(name: string) {
    setNewStockName(name);
    if (!newStockCodeManual) {
      setNewStockCode(suggestStockCode(name) ?? "");
    }
  }

  function onNewStockCodeChange(code: string) {
    setNewStockCode(code);
    setNewStockCodeManual(code.trim().length > 0);
    if (!code.trim()) setNewStockCodeManual(false);
  }

  const dataRef = useRef(data);
  dataRef.current = data;

  const kis = useKisPrices(data.stocks, (updates) => {
    persist(applyPriceUpdates(dataRef.current, updates));
  });

  useEffect(() => {
    if (!data.stocks.some((s) => s.id === activeId)) {
      setActiveId(data.stocks[0]?.id ?? "");
    }
  }, [data.stocks, activeId]);

  const stockSummaries = useMemo(() => {
    const map: Record<string, ReturnType<typeof summarizeStock>> = {};
    for (const s of data.stocks) {
      map[s.id] = summarizeStock(s.id, s.name, data.trades, data.currentPrices[s.id] ?? 0);
    }
    return map;
  }, [data]);

  const stockBuySignals = useMemo(() => {
    const map: Record<string, ReturnType<typeof getBuyTimingSignal>> = {};
    for (const s of data.stocks) {
      const sum = stockSummaries[s.id];
      if (sum) map[s.id] = getBuyTimingSignal(sum);
    }
    return map;
  }, [data.stocks, stockSummaries]);

  const stockSellSignals = useMemo(() => {
    const map: Record<string, ReturnType<typeof getSellTimingSignal>> = {};
    for (const s of data.stocks) {
      const sum = stockSummaries[s.id];
      if (sum) map[s.id] = getSellTimingSignal(sum);
    }
    return map;
  }, [data.stocks, stockSummaries]);

  const portfolio = summarizePortfolio(data);
  const capital = summarizeInitialCapital(data);
  const capitalIds = new Set(data.initialCapitalTradeIds);
  const activeStock = data.stocks.find((s) => s.id === activeId) ?? data.stocks[0];
  const stockSummary = activeStock ? stockSummaries[activeStock.id] : null;
  const buySignal = stockSummary ? getBuyTimingSignal(stockSummary) : null;
  const sellSignal = stockSummary ? getSellTimingSignal(stockSummary) : null;
  const stockTrades = data.trades.filter((t) => t.stockId === activeId);

  function addOrUpdateTrade(partial: Omit<Trade, "id" | "stockId" | "createdAt">) {
    if (!activeStock) return;
    if (editingTrade) {
      persist({
        ...data,
        trades: data.trades.map((t) =>
          t.id === editingTrade.id ? { ...t, ...partial, stockId: activeStock.id } : t
        ),
      });
      setEditingTrade(null);
      return;
    }
    persist({
      ...data,
      trades: [...data.trades, { ...partial, id: uid(), stockId: activeStock.id, createdAt: new Date().toISOString() }],
    });
  }

  function deleteTrade(tradeId: string) {
    if (!confirm("이 매매 내역을 삭제할까요?")) return;
    persist({
      ...data,
      trades: data.trades.filter((t) => t.id !== tradeId),
      initialCapitalTradeIds: data.initialCapitalTradeIds.filter((id) => id !== tradeId),
    });
    if (editingTrade?.id === tradeId) setEditingTrade(null);
  }

  function toggleCapital(tradeId: string) {
    const has = capitalIds.has(tradeId);
    persist({
      ...data,
      initialCapitalTradeIds: has
        ? data.initialCapitalTradeIds.filter((id) => id !== tradeId)
        : [...data.initialCapitalTradeIds, tradeId],
    });
  }

  function addStock() {
    const name = newStockName.trim();
    if (!name) return;
    const id = uid();
    const codeRaw = newStockCode.trim().replace(/\D/g, "");
    const suggested = !codeRaw ? suggestStockCode(name) : undefined;
    const code = (codeRaw || suggested)?.padStart(6, "0");
    persist({
      ...data,
      stocks: [...data.stocks, { id, name, code }],
      currentPrices: { ...data.currentPrices, [id]: 0 },
    });
    setActiveId(id);
    setNewStockName("");
    setNewStockCode("");
    setNewStockCodeManual(false);
    setAddingStock(false);
  }

  function editStock(stock: Stock) {
    setEditingStock(stock);
  }

  function saveEditedStock(name: string, code?: string) {
    if (!editingStock) return;
    persist({
      ...data,
      stocks: data.stocks.map((s) =>
        s.id === editingStock.id ? { ...s, name, code } : s
      ),
    });
    setEditingStock(null);
  }

  function deleteStock(stockId: string) {
    const stock = data.stocks.find((s) => s.id === stockId);
    if (!stock) return;
    if (!confirm(`「${stock.name}」 종목과 매매 내역을 모두 삭제할까요?`)) return;
    const removedTradeIds = new Set(data.trades.filter((t) => t.stockId === stockId).map((t) => t.id));
    const nextStocks = data.stocks.filter((s) => s.id !== stockId);
    const { [stockId]: _, ...restPrices } = data.currentPrices;
    persist({
      ...data,
      stocks: nextStocks,
      trades: data.trades.filter((t) => t.stockId !== stockId),
      currentPrices: restPrices,
      initialCapitalTradeIds: data.initialCapitalTradeIds.filter((id) => !removedTradeIds.has(id)),
    });
    if (activeId === stockId) setActiveId(nextStocks[0]?.id ?? "");
    setEditingTrade(null);
  }

  function setCurrentPrice(price: number) {
    if (!activeStock) return;
    persist({ ...data, currentPrices: { ...data.currentPrices, [activeStock.id]: price } });
  }

  function resetDemo() {
    if (confirm("샘플 데이터(SK하이닉스·삼성전자)로 초기화할까요?")) {
      persist(SEED);
      setActiveId("sk");
      setEditingTrade(null);
    }
  }

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-slate-100">
      <header className="border-b border-slate-200/90 bg-white px-3 py-3 shadow-sm sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">주식 매매 리포트</h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              수익 · 타이밍 · 한 화면 · <UnitNotice />
              {cloudEnabled && user && (
                <span className="ml-2 text-gain">
                  · 클라우드 {syncing ? "저장 중…" : "동기화"}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user && (
              <span className="max-w-[180px] truncate text-sm text-ink-muted" title={user.email ?? ""}>
                {user.email}
              </span>
            )}
            {user && (
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-muted hover:bg-surface-dim"
              >
                로그아웃
              </button>
            )}
            <button
              type="button"
              onClick={resetDemo}
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-muted hover:bg-surface-dim"
            >
              샘플 초기화
            </button>
          </div>
        </div>
        {syncError && (
          <p className="mx-auto mt-2 max-w-5xl text-sm text-loss">동기화 오류: {syncError}</p>
        )}
      </header>

      <main className="mx-auto min-w-0 max-w-5xl space-y-4 px-3 py-4 sm:px-6 sm:py-5">
        <PortfolioSummaryPanel portfolio={portfolio} />

        <InitialCapitalPanel summary={capital} />

        <StockPanel
          stocks={data.stocks}
          activeId={activeId}
          summaries={stockSummaries}
          buySignals={stockBuySignals}
          sellSignals={stockSellSignals}
          onSelect={(id) => {
            setActiveId(id);
            setEditingTrade(null);
          }}
          onAdd={beginAddStock}
          onEdit={editStock}
          onDelete={deleteStock}
          summaryAddon={
            addingStock ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-dim p-3">
                <span className="w-full text-sm font-medium text-ink-muted">종목 추가</span>
                <input
                  className="min-w-[120px] flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm"
                  placeholder="종목명 (필수)"
                  value={newStockName}
                  onChange={(e) => onNewStockNameChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addStock()}
                  autoFocus
                />
                <input
                  className="w-36 rounded-lg border border-line bg-white px-3 py-2 text-sm tabular-nums"
                  placeholder="코드 (선택·KIS용)"
                  value={newStockCode}
                  onChange={(e) => onNewStockCodeChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addStock()}
                />
                <p className="w-full text-xs text-ink-muted">
                  종목코드는 KIS 자동 시세에만 필요합니다. 등록된 종목명은 입력 시 코드가 따라 바뀝니다 (코드를 직접 수정하면 고정).
                </p>
                <button type="button" onClick={addStock} className="rounded-lg bg-gain px-4 py-1.5 text-sm font-medium text-white">
                  추가
                </button>
                <button
                  type="button"
                  onClick={cancelAddStock}
                  className="rounded-lg border border-line bg-white px-4 py-1.5 text-sm text-ink-muted"
                >
                  취소
                </button>
              </div>
            ) : null
          }
        >
          {activeStock && (
            <>
              {stockSummary && buySignal && sellSignal && (
                <div className="flex flex-col gap-5">
                  <StockSettlement stockName={activeStock.name} summary={stockSummary} />
                  <TimingRadar
                    summary={stockSummary}
                    buySignal={buySignal}
                    sellSignal={sellSignal}
                    onPriceChange={setCurrentPrice}
                    kisConfigured={kis.configured}
                    kisLoading={kis.loading}
                    kisError={kis.error}
                    kisLastUpdated={kis.lastUpdated}
                    kisAutoRefresh={kis.autoRefresh}
                    onKisAutoRefreshChange={kis.setAutoRefresh}
                    onKisRefresh={kis.refresh}
                    kisStockCode={activeStock.code}
                  />
                </div>
              )}

              <TradeHistorySection
                stockName={activeStock.name}
                trades={stockTrades}
                initialCapitalIds={capitalIds}
                editing={editingTrade}
                onSubmit={addOrUpdateTrade}
                onToggleCapital={toggleCapital}
                onEdit={setEditingTrade}
                onDelete={deleteTrade}
                onCancelEdit={() => setEditingTrade(null)}
              />
            </>
          )}
        </StockPanel>
      </main>

      {editingStock && (
        <StockEditModal
          stock={editingStock}
          onSave={saveEditedStock}
          onClose={() => setEditingStock(null)}
        />
      )}

      <footer className="border-t border-line py-5 text-center text-sm text-ink-muted">
        {cloudEnabled && user
          ? "데이터는 클라우드(Supabase)에 저장 · 사무실·집 동일 계정으로 접속"
          : "데이터는 이 브라우저에 저장됩니다 · .env 설정 시 클라우드 동기화"}
      </footer>
    </div>
  );
}
