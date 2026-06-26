"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { AppData, Trade } from "@/lib/types";
import { SEED } from "@/lib/seed";
import {
  fmt,
  fmtPct,
  fmtSigned,
  getTimingSignal,
  summarizeInitialCapital,
  summarizePortfolio,
  summarizeStock,
  uid,
} from "@/lib/calc";
import { PORTFOLIO_HINTS } from "@/lib/metricHints";
import { HeroMetric, SectionTitle, StatCard, UnitNotice } from "@/components/StatCard";
import { InitialCapitalPanel } from "@/components/InitialCapitalPanel";
import { StockPanel } from "@/components/StockPanel";
import { StockSettlement, TimingRadar } from "@/components/TimingRadar";
import { TradeHistorySection } from "@/components/TradeSection";

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
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

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

  const portfolio = summarizePortfolio(data);
  const capital = summarizeInitialCapital(data);
  const capitalIds = new Set(data.initialCapitalTradeIds);
  const activeStock = data.stocks.find((s) => s.id === activeId) ?? data.stocks[0];
  const stockSummary = activeStock ? stockSummaries[activeStock.id] : null;
  const signal = stockSummary ? getTimingSignal(stockSummary) : null;
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
    persist({
      ...data,
      stocks: [...data.stocks, { id, name }],
      currentPrices: { ...data.currentPrices, [id]: 0 },
    });
    setActiveId(id);
    setNewStockName("");
    setAddingStock(false);
  }

  function editStock(stock: { id: string; name: string }) {
    const name = prompt("종목명 수정", stock.name)?.trim();
    if (!name || name === stock.name) return;
    persist({
      ...data,
      stocks: data.stocks.map((s) => (s.id === stock.id ? { ...s, name } : s)),
    });
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
    <div className="min-h-screen bg-surface-dim">
      <header className="border-b border-line bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">주식 매매 리포트</h1>
            <p className="mt-0.5 text-xs text-ink-muted">
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
              <span className="max-w-[180px] truncate text-xs text-ink-muted" title={user.email ?? ""}>
                {user.email}
              </span>
            )}
            {user && (
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-muted hover:bg-surface-dim"
              >
                로그아웃
              </button>
            )}
            <button
              type="button"
              onClick={resetDemo}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-muted hover:bg-surface-dim"
            >
              샘플 초기화
            </button>
          </div>
        </div>
        {syncError && (
          <p className="mx-auto mt-2 max-w-5xl text-xs text-loss">동기화 오류: {syncError}</p>
        )}
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-6">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionTitle unit>전체 요약</SectionTitle>
            <HeroMetric
              label="누적 손익"
              hint={PORTFOLIO_HINTS.totalPnl}
              value={fmtSigned(portfolio.totalPnl)}
              sub={fmtPct(portfolio.totalReturnRate)}
              tone={portfolio.totalPnl >= 0 ? "gain" : "loss"}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatCard label="매수 총액" hint={PORTFOLIO_HINTS.buyAmount} value={fmt(portfolio.buyAmount)} />
            <StatCard label="매도 총액" hint={PORTFOLIO_HINTS.sellAmount} value={fmt(portfolio.sellAmount)} />
            <StatCard label="매매 비용" hint={PORTFOLIO_HINTS.tradeCost} value={fmt(portfolio.tradeCost)} />
            <StatCard label="실현 순수익" hint={PORTFOLIO_HINTS.netProfitRealized} value={fmt(portfolio.netProfitRealized)} tone={portfolio.netProfitRealized >= 0 ? "gain" : "loss"} />
            <StatCard label="미실현 손익" hint={PORTFOLIO_HINTS.unrealizedPnl} value={fmtSigned(portfolio.unrealizedPnl)} tone={portfolio.unrealizedPnl >= 0 ? "gain" : "loss"} />
            <StatCard label="수익률" hint={PORTFOLIO_HINTS.returnRate} value={fmtPct(portfolio.totalReturnRate)} tone={portfolio.totalReturnRate >= 0 ? "gain" : "loss"} />
          </div>
        </section>

        <InitialCapitalPanel summary={capital} />

        <StockPanel
          stocks={data.stocks}
          activeId={activeId}
          summaries={stockSummaries}
          onSelect={(id) => {
            setActiveId(id);
            setEditingTrade(null);
          }}
          onAdd={() => setAddingStock(true)}
          onEdit={editStock}
          onDelete={deleteStock}
        >
          {activeStock && (
            <>
              {addingStock && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-dim p-3">
                  <span className="text-xs font-medium text-ink-muted">종목 추가</span>
                  <input
                    className="min-w-[120px] flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm"
                    placeholder="종목명"
                    value={newStockName}
                    onChange={(e) => setNewStockName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addStock()}
                    autoFocus
                  />
                  <button type="button" onClick={addStock} className="rounded-lg bg-gain px-4 py-1.5 text-sm font-medium text-white">
                    추가
                  </button>
                  <button type="button" onClick={() => setAddingStock(false)} className="rounded-lg border border-line bg-white px-4 py-1.5 text-sm text-ink-muted">
                    취소
                  </button>
                </div>
              )}

              {stockSummary && signal && (
                <div className="grid items-stretch gap-5 lg:grid-cols-2">
                  <TimingRadar summary={stockSummary} signal={signal} onPriceChange={setCurrentPrice} />
                  <StockSettlement stockName={activeStock.name} summary={stockSummary} />
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

      <footer className="border-t border-line py-5 text-center text-xs text-ink-muted">
        {cloudEnabled && user
          ? "데이터는 클라우드(Supabase)에 저장 · 사무실·집 동일 계정으로 접속"
          : "데이터는 이 브라우저에 저장됩니다 · .env 설정 시 클라우드 동기화"}
      </footer>
    </div>
  );
}
