"use client";

import { Fragment, useMemo } from "react";
import type { BuyTimingSignal, SellTimingSignal, StockQuote, StockSummary } from "@/lib/types";
import type { StockTradingVerdict } from "@/lib/briefing/tradingVerdict";
import type { MarketBriefingContext } from "@/lib/briefing/types";
import type { ReportSettings } from "@/lib/reportSettings";
import { fmt, fmtPct, fmtSigned } from "@/lib/calc";
import { VerdictCard } from "./VerdictCard";
import { TimingRadar } from "./TimingRadar";

/** 종목 전환 — 페이지 타이틀 + 탭 (활성: 대형·밑줄 / 비활성: 플랫 텍스트 탭) */
function StockPageTitleBar({
  stocks,
  activeId,
  verdictById,
  onSelect,
  onAddStock,
}: {
  stocks: { id: string; name: string }[];
  activeId: string;
  verdictById: Map<string, StockTradingVerdict>;
  onSelect: (id: string) => void;
  onAddStock: () => void;
}) {
  return (
    <div className="border-b border-line px-3 pb-0 pt-4 sm:px-5 sm:pt-5">
      <div className="flex min-w-0 items-end justify-between gap-4">
        <div
          className="flex min-w-0 flex-wrap items-end gap-x-5 gap-y-3 sm:gap-x-6"
          role="tablist"
          aria-label="종목 탭"
        >
          {stocks.map((s, i) => {
            const active = s.id === activeId;
            const v = verdictById.get(s.id);
            const action =
              v?.buy.stance === "yes" ? "buy" : v?.sell.stance === "yes" ? "sell" : null;

            return (
              <Fragment key={s.id}>
                {i > 0 && (
                  <span
                    className="mb-3 shrink-0 text-[10px] font-extralight leading-none text-ink/25 sm:mb-3.5 sm:text-xs"
                    aria-hidden
                  >
                    |
                  </span>
                )}

                {active ? (
                  <div className="relative shrink-0 pb-3 sm:pb-3.5">
                    <h2
                      id="verdict-page-title"
                      role="tab"
                      aria-selected
                      tabIndex={0}
                      className="max-w-[min(100vw-2rem,20rem)] truncate text-xl font-bold tracking-tight text-ink sm:max-w-none sm:text-2xl"
                    >
                      {s.name}
                    </h2>
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gain" aria-hidden />
                  </div>
                ) : (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={false}
                    aria-controls="verdict-panel"
                    id={`stock-tab-${s.id}`}
                    onClick={() => onSelect(s.id)}
                    className="group relative inline-flex max-w-full shrink-0 items-center gap-1.5 pb-3 text-base font-medium text-ink-muted transition hover:text-ink sm:pb-3.5 sm:text-lg"
                  >
                    <span className="truncate">{s.name}</span>
                    {action === "buy" && (
                      <span className="shrink-0 rounded bg-gain px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        매수
                      </span>
                    )}
                    {action === "sell" && (
                      <span className="shrink-0 rounded bg-loss px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        매도
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-line opacity-0 transition group-hover:opacity-100" aria-hidden />
                  </button>
                )}
              </Fragment>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onAddStock}
          className="mb-3 shrink-0 text-sm font-semibold text-ink-muted transition hover:text-gain sm:mb-3.5 sm:text-base"
          title="종목 추가"
        >
          +<span className="hidden sm:inline"> 추가</span>
        </button>
      </div>
    </div>
  );
}

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
  portfolioPnl,
  kospiLabel,
  kisLoading,
  briefingLoading,
  kisError,
  briefingError,
  kisConfigured,
  kisLastUpdated,
  kisAutoRefresh,
  onKisAutoRefreshChange,
  onKisRefresh,
  onBriefingRefresh,
  onVerdictRefresh,
  verdictRefreshing,
  verdictLastUpdated,
  onAddStock,
  allVerdicts,
  marketContext,
  onOpenRecords,
  onPriceChange,
  reportSettings,
  targetPrice,
  onTargetPriceChange,
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
  portfolioPnl: number;
  kospiLabel?: string;
  kisLoading: boolean;
  briefingLoading: boolean;
  kisError: string | null;
  briefingError: string | null;
  kisConfigured: boolean | null;
  kisLastUpdated: Date | null;
  kisAutoRefresh: boolean;
  onKisAutoRefreshChange: (v: boolean) => void;
  onKisRefresh: () => void;
  onBriefingRefresh: () => void;
  onVerdictRefresh: () => void;
  verdictRefreshing: boolean;
  verdictLastUpdated: Date | null;
  onAddStock: () => void;
  allVerdicts: StockTradingVerdict[];
  marketContext: MarketBriefingContext | null;
  onOpenRecords: () => void;
  onPriceChange: (price: number) => void;
  reportSettings?: Partial<ReportSettings>;
  targetPrice?: number;
  onTargetPriceChange?: (price: number) => void;
}) {
  const pnlTone = portfolioPnl >= 0 ? "text-gain" : "text-loss";
  const displayName =
    summary?.stockName ?? stocks.find((s) => s.id === activeId)?.name ?? "";
  const verdictById = useMemo(() => new Map(allVerdicts.map((v) => [v.stockId, v])), [allVerdicts]);
  const showDetail = summary && buySignal && sellSignal && displayName;

  return (
    <div
      id="verdict-panel"
      role="tabpanel"
      aria-labelledby={displayName ? "verdict-page-title" : undefined}
      className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm"
    >
      <StockPageTitleBar
        stocks={stocks}
        activeId={activeId}
        verdictById={verdictById}
        onSelect={onSelectStock}
        onAddStock={onAddStock}
      />

      <div className="space-y-4 p-3 sm:p-5">
        <section className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div className="min-w-0">
            {summary ? (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className="text-2xl font-bold tabular-nums text-ink sm:text-3xl">{fmt(summary.currentPrice)}</span>
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
              <p className="text-sm text-ink-muted">시세를 새로고침하세요</p>
            )}
            <p className={`mt-1 text-[11px] tabular-nums ${pnlTone}`}>
              누적 {fmtSigned(portfolioPnl)}
              {kospiLabel && <span className="ml-1.5 text-ink-muted">{kospiLabel}</span>}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={onKisRefresh}
              disabled={kisLoading}
              className="rounded-lg bg-gain px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              title="KIS — 종목 시세·수급·KOSPI"
            >
              {kisLoading ? "…" : "KIS 시세"}
            </button>
            <button
              type="button"
              onClick={onBriefingRefresh}
              disabled={briefingLoading}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink hover:bg-surface-dim disabled:opacity-50"
              title="RSS·Yahoo·FRED·BOK·시장 수급 등"
            >
              {briefingLoading ? "…" : "데이터"}
            </button>
          </div>
        </section>
        {(kisError || briefingError) && (
          <p className="-mt-2 text-xs text-amber-800">{[kisError, briefingError].filter(Boolean).join(" · ")}</p>
        )}
        <p className="-mt-2 text-[11px] text-ink-muted">
          ② HTS·MTS 체결 후{" "}
          <button type="button" onClick={onOpenRecords} className="text-gain hover:underline">
            ③ 기록
          </button>
          에 입력하면 다음 ① 판단·④ 성과에 반영됩니다
        </p>

        {verdict && displayName ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-ink">매매 판단</h2>
                {verdictLastUpdated && (
                  <p className="text-[10px] tabular-nums text-ink-muted">
                    갱신 {verdictLastUpdated.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onVerdictRefresh}
                disabled={verdictRefreshing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-sm hover:bg-surface-dim disabled:opacity-50"
                title="KIS 시세 + 시장·뉴스·공시 데이터를 한 번에 갱신"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={verdictRefreshing ? "animate-spin" : ""}
                  aria-hidden
                >
                  <path
                    d="M21 12a9 9 0 11-2.64-6.36M21 3v6h-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {verdictRefreshing ? "갱신 중…" : "전체 새로고침"}
              </button>
            </div>
            <p className="text-[10px] text-ink-muted">
              전체 = KIS 시세 + 데이터(뉴스·글로벌·거시) · 상단 버튼으로 각각만 갱신 가능
            </p>
            <div className="grid items-stretch gap-3 sm:grid-cols-2">
              <VerdictCard
                kind="buy"
                verdict={verdict.buy}
                stockName={displayName}
                feeSettings={reportSettings}
              />
              <VerdictCard
                kind="sell"
                verdict={verdict.sell}
                stockName={displayName}
                feeSettings={reportSettings}
              />
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-ink-muted">시세·뉴스를 새로고침하세요</p>
        )}

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
            kisAutoRefresh={kisAutoRefresh}
            onKisAutoRefreshChange={onKisAutoRefreshChange}
            onKisRefresh={onKisRefresh}
            kisStockCode={activeStockCode}
            stockQuote={quote}
            reportSettings={reportSettings}
            targetPrice={targetPrice}
            onTargetPriceChange={onTargetPriceChange}
          />
        )}

        {marketContext && (
          <p className="border-t border-line pt-3 text-center text-[10px] text-ink-muted/70">
            데이터 {marketContext.sources.filter((s) => s.ok).length}/{marketContext.sources.length} 소스 ·{" "}
            {new Date(marketContext.fetchedAt).toLocaleString("ko-KR")}
          </p>
        )}
      </div>
    </div>
  );
}
