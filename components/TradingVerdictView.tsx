"use client";

import { useMemo, useState } from "react";
import type { BuyTimingSignal, DailySnapshot, SellTimingSignal, StockQuote, StockSummary, Trade } from "@/lib/types";
import type { StockTradingVerdict } from "@/lib/briefing/tradingVerdict";
import type { MarketBriefingContext } from "@/lib/briefing/types";
import type { ReportSettings } from "@/lib/reportSettings";
import type { PortfolioSummary } from "@/lib/types";
import { fmt, fmtPct, fmtSigned } from "@/lib/calc";
import type { AlertItem } from "@/lib/alerts";
import { VerdictCardPair } from "./VerdictCard";
import { VerdictDetailPanel } from "./VerdictDetailPanel";
import { VerdictDashboard } from "./VerdictDashboard";
import { TimingRadar } from "./TimingRadar";
import { DataReadinessBanner } from "./DataReadinessPanel";
import type { ReadinessItem } from "@/lib/dataReadiness";
import type { RefreshMode } from "@/lib/appPreferences";
import { tabLabel } from "@/lib/appTabs";
import { BtnCreate, RefreshButtonGroup, PanelBackButton, panelShell, AreaCardHeader, TabSectionHeader, pickCard } from "./ui/PanelCard";
import { StockPanelTitleRow, StockTitleTabs, type StockTabBadge } from "./ui/StockTitleTabBar";
import { StockTrendSection } from "./StockTrendSection";
import { StockFundamentalsPanel } from "./StockFundamentalsPanel";

export function TradingVerdictView({
  stocks,
  activeId,
  activeStockCode,
  onSelectStock,
  verdict,
  summary,
  quote,
  summaries,
  stockQuotes,
  buySignal,
  sellSignal,
  portfolio,
  portfolioPnl,
  kospiLabel,
  kisLoading,
  briefingLoading,
  kisError,
  briefingError,
  kisConfigured,
  kisLastUpdated,
  refreshMode,
  onKisRefresh,
  onBriefingRefresh,
  onVerdictRefresh,
  verdictRefreshing,
  verdictLastUpdated,
  onAddStock,
  allVerdicts,
  marketContext,
  onPriceChange,
  reportSettings,
  targetPrice,
  onTargetPriceChange,
  readinessItems = [],
  dailySnapshots,
  stockTrades = [],
  portfolioAlerts = [],
}: {
  stocks: { id: string; name: string }[];
  activeId: string;
  activeStockName?: string;
  activeStockCode?: string;
  onSelectStock: (id: string) => void;
  verdict: StockTradingVerdict | null;
  summary: StockSummary | null;
  quote?: StockQuote;
  summaries: Record<string, StockSummary>;
  stockQuotes?: Record<string, StockQuote>;
  buySignal: BuyTimingSignal | null;
  sellSignal: SellTimingSignal | null;
  portfolio: PortfolioSummary;
  portfolioPnl: number;
  kospiLabel?: string;
  kisLoading: boolean;
  briefingLoading: boolean;
  kisError: string | null;
  briefingError: string | null;
  kisConfigured: boolean | null;
  kisLastUpdated: Date | null;
  refreshMode: RefreshMode;
  onKisRefresh: () => void;
  onBriefingRefresh: () => void;
  onVerdictRefresh: () => void;
  verdictRefreshing: boolean;
  verdictLastUpdated: Date | null;
  onAddStock: () => void;
  allVerdicts: StockTradingVerdict[];
  marketContext: MarketBriefingContext | null;
  onPriceChange: (price: number) => void;
  reportSettings?: Partial<ReportSettings>;
  targetPrice?: number;
  onTargetPriceChange?: (price: number) => void;
  readinessItems?: ReadinessItem[];
  dailySnapshots?: DailySnapshot[];
  stockTrades?: Trade[];
  portfolioAlerts?: AlertItem[];
}) {
  const [detailMode, setDetailMode] = useState(false);
  const pnlTone = portfolioPnl >= 0 ? "text-gain" : "text-loss";
  const displayName =
    summary?.stockName ?? stocks.find((s) => s.id === activeId)?.name ?? "";
  const badgeById = useMemo(() => {
    const map = new Map<string, StockTabBadge>();
    for (const v of allVerdicts) {
      map.set(v.stockId, v.buy.stance === "yes" ? "buy" : v.sell.stance === "yes" ? "sell" : null);
    }
    return map;
  }, [allVerdicts]);
  const showDetail = summary && buySignal && sellSignal && displayName;

  function openDetail(stockId: string) {
    onSelectStock(stockId);
    setDetailMode(true);
  }

  function backToDashboard() {
    setDetailMode(false);
  }

  if (!detailMode) {
    return (
      <>
        <DataReadinessBanner items={readinessItems} />
        <VerdictDashboard
          portfolio={portfolio}
          allVerdicts={allVerdicts}
          summaries={summaries}
          stockQuotes={stockQuotes}
          portfolioAlerts={portfolioAlerts}
          kospiLabel={kospiLabel}
          onOpenDetail={openDetail}
          onKisRefresh={onKisRefresh}
          onBriefingRefresh={onBriefingRefresh}
          onAddStock={onAddStock}
          kisLoading={kisLoading}
          briefingLoading={briefingLoading}
        />
      </>
    );
  }

  return (
    <>
      <div
        id="verdict-panel"
        role="tabpanel"
        aria-labelledby={displayName ? "verdict-page-title" : undefined}
        className={`min-w-0 overflow-hidden ${panelShell}`}
      >
        <StockPanelTitleRow
        back={
          <PanelBackButton onClick={backToDashboard}>
            오늘 한눈에
          </PanelBackButton>
        }
        trailing={
          <BtnCreate onClick={onAddStock} className="mb-3 px-3 py-1.5 text-xs sm:mb-3.5" title="종목 추가">
            +<span className="hidden sm:inline"> 추가</span>
          </BtnCreate>
        }
      >
        <StockTitleTabs
          stocks={stocks}
          activeId={activeId}
          badgeById={badgeById}
          onSelect={onSelectStock}
          titleId="verdict-page-title"
          panelId="verdict-panel"
        />
      </StockPanelTitleRow>
      </div>

      <div className="min-w-0 space-y-4 sm:space-y-5">
        <TabSectionHeader
          eyebrow={tabLabel("verdict")}
          title={displayName ?? "종목 상세"}
          actions={
            <RefreshButtonGroup
              onKisRefresh={onKisRefresh}
              onBriefingRefresh={onBriefingRefresh}
              kisLoading={kisLoading}
              briefingLoading={briefingLoading}
            />
          }
        />

        <section className="border-b border-white/10 pb-3">
          <div className="min-w-0">
            {summary ? (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className="text-2xl font-bold tabular-nums text-white sm:text-3xl">{fmt(summary.currentPrice)}</span>
                {quote && (
                  <span
                    className={`text-sm font-semibold tabular-nums sm:text-base ${
                      quote.changeRate >= 0 ? "text-gain" : "text-loss"
                    }`}
                  >
                    전일比 {fmtPct(quote.changeRate)}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-300">「KIS 시세」를 갱신하세요</p>
            )}
            <p className={`mt-1 text-[11px] tabular-nums ${pnlTone}`}>
              누적 {fmtSigned(portfolioPnl)}
              {kospiLabel && <span className="ml-1.5 text-zinc-300">{kospiLabel}</span>}
            </p>
          </div>
        </section>
        {(kisError || briefingError) && (
          <p className="-mt-2 text-xs text-amber-200">{[kisError, briefingError].filter(Boolean).join(" · ")}</p>
        )}

        {verdict && displayName ? (
          <article className={pickCard}>
            <AreaCardHeader
              as="h2"
              title="매매 판단"
              subtitle={
                verdictLastUpdated
                  ? `마지막 갱신 ${verdictLastUpdated.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} · 상단 「KIS 시세」「뉴스·거시」`
                  : undefined
              }
            />
            <VerdictCardPair
              buy={verdict.buy}
              sell={verdict.sell}
              stockName={displayName}
              stockCode={activeStockCode}
              feeSettings={reportSettings}
            />
            <VerdictDetailPanel buy={verdict.buy} sell={verdict.sell} />
          </article>
        ) : (
          <p className="py-6 text-center text-sm text-zinc-300">「KIS 시세」「뉴스·거시」를 갱신하세요</p>
        )}

        {displayName && (
          <StockTrendSection
            stockId={activeId}
            stockName={displayName}
            code={activeStockCode}
            currentPrice={summary?.currentPrice ?? quote?.price ?? 0}
            dailySnapshots={dailySnapshots}
            avgCost={summary?.holdingAvgPriceWithCost}
            holdingQty={summary?.holdingQty}
            trades={stockTrades}
            summary={summary}
            reportSettings={reportSettings}
          />
        )}

        {displayName && <StockFundamentalsPanel quote={quote} stockName={displayName} />}

        {showDetail && (
          <TimingRadar
            summary={summary}
            buySignal={buySignal}
            sellSignal={sellSignal}
            onPriceChange={onPriceChange}
            kisConfigured={kisConfigured}
            kisLoading={kisLoading}
            kisError={kisError}
            kisLastUpdated={kisLastUpdated}
            refreshMode={refreshMode}
            onKisRefresh={onKisRefresh}
            kisStockCode={activeStockCode}
            stockQuote={quote}
            reportSettings={reportSettings}
            targetPrice={targetPrice}
            onTargetPriceChange={onTargetPriceChange}
          />
        )}
      </div>
    </>
  );
}
