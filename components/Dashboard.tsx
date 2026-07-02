"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { fmtPct, today } from "@/lib/calc";
import { UnitNotice } from "@/components/StatCard";
import { AppHeaderBlock, HEADER_DESC } from "@/components/AppHeader";
import { AppFlowBanner } from "@/components/AppFlowBanner";
import { applyDailySnapshot, applyPeakPrices } from "@/lib/dailyReport";
import { StockEditModal } from "@/components/StockEditModal";
import { applyQuoteUpdates, useKisPrices } from "@/hooks/useKisPrices";
import type { ParsedTradeRow } from "@/lib/import/tradeCsv";
import { collectPortfolioAlerts, notifyAlertsIfEnabled } from "@/lib/alerts";
import { buildFullTradeAdvice } from "@/lib/briefing/tradeRecommendation";
import { buildAllTradingVerdicts } from "@/lib/briefing/tradingVerdict";
import { buildTimingSourceReport } from "@/lib/briefing/timingSources";
import { resolveReportSettings, type ReportSettings } from "@/lib/reportSettings";
import { useBriefingData } from "@/hooks/useBriefingData";
import { AppTabNav, type AppTab } from "@/components/AppTabNav";
import { TradingVerdictView } from "@/components/TradingVerdictView";
import { ReportTab } from "@/components/tabs/ReportTab";
import { SettingsTab } from "@/components/tabs/SettingsTab";
import { RecordsTab } from "@/components/tabs/RecordsTab";
import { TimingSourcesTab } from "@/components/tabs/TimingSourcesTab";
import { mergeCsvTrades } from "@/components/CsvImportPanel";

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
  const [activeTab, setActiveTab] = useState<AppTab>("verdict");
  const [activeId, setActiveId] = useState(data.stocks[0]?.id ?? "");
  const [addingStock, setAddingStock] = useState(false);
  const [newStockName, setNewStockName] = useState("");
  const [newStockCode, setNewStockCode] = useState("");
  const [newStockCodeManual, setNewStockCodeManual] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [tradeFormOpen, setTradeFormOpen] = useState(false);

  function beginAddStock() {
    setAddingStock(true);
    setNewStockName("");
    setNewStockCode("");
    setNewStockCodeManual(false);
    setActiveTab("records");
  }

  function cancelAddStock() {
    setAddingStock(false);
    setNewStockName("");
    setNewStockCode("");
    setNewStockCodeManual(false);
  }

  function onNewStockNameChange(name: string) {
    setNewStockName(name);
    if (!newStockCodeManual) setNewStockCode(suggestStockCode(name) ?? "");
  }

  function onNewStockCodeChange(code: string) {
    setNewStockCode(code);
    setNewStockCodeManual(code.trim().length > 0);
    if (!code.trim()) setNewStockCodeManual(false);
  }

  const dataRef = useRef(data);
  dataRef.current = data;

  const kis = useKisPrices(data.stocks, (payload) => {
    persist(applyQuoteUpdates(dataRef.current, payload));
  });

  const briefing = useBriefingData(data.stocks);

  useEffect(() => {
    if (!data.stocks.some((s) => s.id === activeId)) {
      setActiveId(data.stocks[0]?.id ?? "");
    }
  }, [data.stocks, activeId]);

  const reportSettings = resolveReportSettings(data.reportSettings);

  const stockSummaries = useMemo(() => {
    const map: Record<string, ReturnType<typeof summarizeStock>> = {};
    for (const s of data.stocks) {
      map[s.id] = summarizeStock(s.id, s.name, data.trades, data.currentPrices[s.id] ?? 0, data.reportSettings);
    }
    return map;
  }, [data]);

  const stockBuySignals = useMemo(() => {
    const map: Record<string, ReturnType<typeof getBuyTimingSignal>> = {};
    for (const s of data.stocks) {
      const sum = stockSummaries[s.id];
      if (sum) map[s.id] = getBuyTimingSignal(sum, data.reportSettings);
    }
    return map;
  }, [data.stocks, data.reportSettings, stockSummaries]);

  const stockSellSignals = useMemo(() => {
    const map: Record<string, ReturnType<typeof getSellTimingSignal>> = {};
    for (const s of data.stocks) {
      const sum = stockSummaries[s.id];
      if (sum) map[s.id] = getSellTimingSignal(sum, data.reportSettings);
    }
    return map;
  }, [data.stocks, data.reportSettings, stockSummaries]);

  const portfolio = summarizePortfolio(data);
  const capital = summarizeInitialCapital(data);
  const capitalIds = new Set(data.initialCapitalTradeIds);

  useEffect(() => {
    let next = applyPeakPrices(data);
    next = applyDailySnapshot(next, portfolio, stockSummaries);
    const changed =
      next.peakPrices !== data.peakPrices ||
      (next.dailySnapshots?.length ?? 0) !== (data.dailySnapshots?.length ?? 0);
    if (changed) persist(next);
  }, [data, portfolio, stockSummaries, persist]);

  useEffect(() => {
    const alerts = collectPortfolioAlerts(data, stockSummaries, stockBuySignals, stockSellSignals);
    void notifyAlertsIfEnabled(data, alerts);
  }, [data, stockSummaries, stockBuySignals, stockSellSignals]);

  function patchReportSettings(patch: Partial<ReportSettings> | ReportSettings) {
    persist({ ...data, reportSettings: { ...reportSettings, ...patch } });
  }

  const activeStock = data.stocks.find((s) => s.id === activeId) ?? data.stocks[0];
  const stockSummary = activeStock ? stockSummaries[activeStock.id] : null;
  const buySignal = stockSummary ? getBuyTimingSignal(stockSummary, data.reportSettings) : null;
  const sellSignal = stockSummary ? getSellTimingSignal(stockSummary, data.reportSettings) : null;
  const stockTrades = data.trades.filter((t) => t.stockId === activeId);

  const peakByStock = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of data.stocks) {
      const p = data.peakPrices?.[s.id]?.price;
      if (p && p > 0) m[s.id] = p;
    }
    return m;
  }, [data.stocks, data.peakPrices]);

  const verdictBuildCtx = useMemo(() => {
    const sorted = [...(data.dailySnapshots ?? [])].sort((a, b) => b.date.localeCompare(a.date));
    const reportDate = today();
    const prev = sorted.find((s) => s.date < reportDate);
    return {
      dailySnapshots: data.dailySnapshots,
      stockEvents: data.stockEvents,
      portfolioReturnChange: prev ? portfolio.totalReturnRate - prev.portfolioTotalReturnRate : null,
    };
  }, [data.dailySnapshots, data.stockEvents, portfolio.totalReturnRate]);

  const tradingVerdicts = useMemo(
    () =>
      buildAllTradingVerdicts(
        stockSummaries,
        data.stockQuotes,
        data.reportSettings,
        briefing.context,
        data.kospiBenchmark,
        peakByStock,
        verdictBuildCtx
      ),
    [stockSummaries, data.stockQuotes, data.reportSettings, briefing.context, data.kospiBenchmark, peakByStock, verdictBuildCtx]
  );

  const activeVerdict = tradingVerdicts.find((v) => v.stockId === activeId) ?? null;

  const timingSourceReport = useMemo(() => {
    if (!activeStock || !stockSummary) return null;
    const stockCtx = briefing.context?.stocks.find((s) => s.stockId === activeId);
    return buildTimingSourceReport({
      stock: activeStock,
      summary: stockSummary,
      quote: data.stockQuotes?.[activeId],
      settings: data.reportSettings,
      buySignal: stockBuySignals[activeId] ?? { status: "watch", label: "—", hint: "" },
      sellSignal: stockSellSignals[activeId] ?? { status: "watch", label: "—", hint: "" },
      peak: data.peakPrices?.[activeId],
      targetPrice: reportSettings.targetPrices?.[activeId],
      stockContext: stockCtx,
      marketContext: briefing.context,
      kospi: data.kospiBenchmark,
      kosdaq: data.kosdaqBenchmark,
      buildCtx: verdictBuildCtx,
      verdict: activeVerdict,
    });
  }, [
    activeStock,
    stockSummary,
    activeId,
    data.stockQuotes,
    data.reportSettings,
    data.peakPrices,
    data.kospiBenchmark,
    data.kosdaqBenchmark,
    stockBuySignals,
    stockSellSignals,
    reportSettings.targetPrices,
    briefing.context,
    verdictBuildCtx,
    activeVerdict,
  ]);

  const verdictRefreshing = kis.loading || briefing.loading;

  const verdictLastUpdated = useMemo(() => {
    const times = [kis.lastUpdated, briefing.lastFetched].filter((d): d is Date => d != null);
    if (times.length === 0) return null;
    return new Date(Math.max(...times.map((d) => d.getTime())));
  }, [kis.lastUpdated, briefing.lastFetched]);

  const refreshVerdict = useCallback(async () => {
    await Promise.all([kis.refresh(), briefing.refresh()]);
  }, [kis.refresh, briefing.refresh]);

  function selectStock(id: string) {
    setActiveId(id);
    setEditingTrade(null);
    setTradeFormOpen(false);
  }

  const tradeSuggestion = useMemo(() => {
    if (!stockSummary || !buySignal || !sellSignal) return null;
    const stockCtx = briefing.context?.stocks.find((s) => s.stockId === activeId);
    return buildFullTradeAdvice(
      stockSummary,
      buySignal,
      sellSignal,
      data.stockQuotes?.[activeId],
      data.reportSettings,
      stockCtx,
      briefing.context ?? undefined,
      data.kospiBenchmark,
      peakByStock[activeId],
      {
        verdict: activeVerdict,
        userTargetPrice: reportSettings.targetPrices?.[activeId],
        buildCtx: verdictBuildCtx,
      }
    ).suggestion;
  }, [
    stockSummary,
    buySignal,
    sellSignal,
    data,
    activeId,
    peakByStock,
    briefing.context,
    activeVerdict,
    reportSettings.targetPrices,
    verdictBuildCtx,
  ]);

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
    setActiveTab("verdict");
  }

  function editStock(stock: Stock) {
    setEditingStock(stock);
  }

  function saveEditedStock(name: string, code?: string) {
    if (!editingStock) return;
    persist({
      ...data,
      stocks: data.stocks.map((s) => (s.id === editingStock.id ? { ...s, name, code } : s)),
    });
    setEditingStock(null);
  }

  function deleteStock(stockId: string) {
    const stock = data.stocks.find((s) => s.id === stockId);
    if (!stock) return;
    if (!confirm(`「${stock.name}」 종목과 매매 내역을 모두 삭제할까요?`)) return;
    const removedTradeIds = new Set(data.trades.filter((t) => t.stockId === stockId).map((t) => t.id));
    const nextStocks = data.stocks.filter((s) => s.id !== stockId);
    const { [stockId]: _p, ...restPrices } = data.currentPrices;
    const { [stockId]: _q, ...restQuotes } = data.stockQuotes ?? {};
    const { [stockId]: _peak, ...restPeaks } = data.peakPrices ?? {};
    persist({
      ...data,
      stocks: nextStocks,
      trades: data.trades.filter((t) => t.stockId !== stockId),
      currentPrices: restPrices,
      stockQuotes: restQuotes,
      peakPrices: restPeaks,
      initialCapitalTradeIds: data.initialCapitalTradeIds.filter((id) => !removedTradeIds.has(id)),
    });
    if (activeId === stockId) setActiveId(nextStocks[0]?.id ?? "");
    setEditingTrade(null);
  }

  function setTargetPrice(stockId: string, price: number) {
    const next = { ...reportSettings.targetPrices };
    if (price > 0) next[stockId] = price;
    else delete next[stockId];
    patchReportSettings({ targetPrices: next });
  }

  function setCurrentPrice(price: number) {
    if (!activeStock) return;
    persist({ ...data, currentPrices: { ...data.currentPrices, [activeStock.id]: price } });
  }

  function importCsvRows(rows: ParsedTradeRow[]) {
    if (rows.length === 0) return;
    if (!confirm(`${rows.length}건의 매매 내역을 추가할까요?`)) return;
    persist(mergeCsvTrades(data, rows));
    setActiveTab("verdict");
  }

  function resetDemo() {
    if (confirm("샘플 데이터(SK하이닉스·삼성전자)로 초기화할까요?")) {
      persist(SEED);
      setActiveId("sk");
      setEditingTrade(null);
      setActiveTab("verdict");
    }
  }

  const kospiLabel = data.kospiBenchmark ? `KOSPI ${fmtPct(data.kospiBenchmark.changeRate)}` : undefined;

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-slate-100 pb-[calc(3.25rem+env(safe-area-inset-bottom))]">
      <header className="border-b border-slate-200/90 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-3 py-3 sm:px-6">
          <AppHeaderBlock
            tab={activeTab}
            meta={
              cloudEnabled && user ? (
                <span className="rounded-full border border-gain/20 bg-gain-soft px-2.5 py-0.5 text-[11px] font-semibold text-gain">
                  {syncing ? "저장 중…" : "동기화"}
                </span>
              ) : undefined
            }
            desc={
              <>
                {HEADER_DESC[activeTab]}
                {" · "}
                <UnitNotice />
              </>
            }
          />
          {syncError && <p className="mt-1.5 text-sm text-loss">동기화 오류: {syncError}</p>}
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-5xl px-3 py-4 sm:px-6">
        <AppFlowBanner tab={activeTab} />
        {activeTab === "verdict" && (
          <TradingVerdictView
            stocks={data.stocks}
            activeId={activeId}
            activeStockName={activeStock?.name}
            activeStockCode={activeStock?.code}
            onSelectStock={selectStock}
            verdict={activeVerdict}
            summary={stockSummary}
            summaries={stockSummaries}
            stockQuotes={data.stockQuotes}
            quote={activeStock ? data.stockQuotes?.[activeStock.id] : undefined}
            buySignal={buySignal}
            sellSignal={sellSignal}
            portfolioPnl={portfolio.totalPnl}
            kospiLabel={kospiLabel}
            kisLoading={kis.loading}
            briefingLoading={briefing.loading}
            kisError={kis.error}
            briefingError={briefing.error}
            kisConfigured={kis.configured}
            kisLastUpdated={kis.lastUpdated}
            kisAutoRefresh={kis.autoRefresh}
            onKisAutoRefreshChange={kis.setAutoRefresh}
            onKisRefresh={kis.refresh}
            onBriefingRefresh={briefing.refresh}
            onVerdictRefresh={() => void refreshVerdict()}
            verdictRefreshing={verdictRefreshing}
            verdictLastUpdated={verdictLastUpdated}
            onAddStock={beginAddStock}
            allVerdicts={tradingVerdicts}
            marketContext={briefing.context}
            onOpenRecords={() => {
              setActiveTab("records");
            }}
            onPriceChange={setCurrentPrice}
            reportSettings={data.reportSettings}
            targetPrice={reportSettings.targetPrices?.[activeStock?.id ?? ""]}
            onTargetPriceChange={(p) => activeStock && setTargetPrice(activeStock.id, p)}
          />
        )}

        {activeTab === "sources" && (
          <TimingSourcesTab
            report={timingSourceReport}
            onRefresh={() => void refreshVerdict()}
            refreshing={verdictRefreshing}
            stocks={data.stocks}
            activeId={activeId}
            onSelectStock={selectStock}
          />
        )}

        {activeTab === "records" && (
          <RecordsTab
            stocks={data.stocks}
            activeId={activeId}
            onSelectStock={selectStock}
            onEditStock={editStock}
            onDeleteStock={deleteStock}
            addingStock={addingStock}
            newStockName={newStockName}
            newStockCode={newStockCode}
            onNewStockNameChange={onNewStockNameChange}
            onNewStockCodeChange={onNewStockCodeChange}
            onAddStock={addStock}
            onCancelAddStock={cancelAddStock}
            stockSummary={stockSummary}
            activeStock={activeStock}
            stockTrades={stockTrades}
            capitalIds={capitalIds}
            editingTrade={editingTrade}
            onSubmitTrade={addOrUpdateTrade}
            onToggleCapital={toggleCapital}
            onEditTrade={setEditingTrade}
            onDeleteTrade={deleteTrade}
            onCancelEditTrade={() => setEditingTrade(null)}
            tradeSuggestion={tradeSuggestion}
            tradeFormOpen={tradeFormOpen}
            onTradeFormOpenChange={setTradeFormOpen}
            buySignal={buySignal}
            sellSignal={sellSignal}
            reportSettings={data.reportSettings}
          />
        )}

        {activeTab === "report" && (
          <ReportTab
            data={data}
            portfolio={portfolio}
            capital={capital}
            stocks={data.stocks}
            summaries={stockSummaries}
            activeId={activeId}
            onSelectStock={selectStock}
            onEditStock={editStock}
            onDeleteStock={deleteStock}
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            data={data}
            portfolio={portfolio}
            summaries={stockSummaries}
            buySignals={stockBuySignals}
            sellSignals={stockSellSignals}
            marketContext={briefing.context}
            briefingLoading={briefing.loading}
            briefingError={briefing.error}
            onBriefingRefresh={briefing.refresh}
            onSettingsChange={patchReportSettings}
            onImportCsv={importCsvRows}
            user={user}
            signOut={signOut}
            onResetDemo={resetDemo}
            cloudEnabled={cloudEnabled}
            syncing={syncing}
          />
        )}
      </main>

      <AppTabNav active={activeTab} onChange={setActiveTab} />

      {editingStock && (
        <StockEditModal stock={editingStock} onSave={saveEditedStock} onClose={() => setEditingStock(null)} />
      )}
    </div>
  );
}
