"use client";

import { useMemo } from "react";
import type { AppData, BuyTimingSignal, PortfolioSummary, SellTimingSignal, StockSummary } from "@/lib/types";
import { fmt, fmtPct, fmtSigned } from "@/lib/calc";
import { buildDailyReport } from "@/lib/dailyReport";
import type { MarketBriefingContext, TradeRecommendation } from "@/lib/briefing/types";
import { compareToKospi, computePortfolioDayChange } from "@/lib/benchmark";
import { ActionBadge, actionSoftClass, actionTextClass, urgencyLabel } from "./TimingBadges";
import { RefreshButtonGroup, panelShell, warnBanner } from "./ui/PanelCard";

function TimingRow({
  rec,
  summary,
  changePct,
  onClick,
}: {
  rec: TradeRecommendation;
  summary: StockSummary | undefined;
  changePct: number | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/5 sm:px-4 ${actionSoftClass(rec.action)}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-white">{rec.stockName}</span>
          <ActionBadge action={rec.action} />
        </div>
        {summary && (
          <p className="mt-0.5 text-sm tabular-nums text-zinc-300">
            {fmt(summary.currentPrice)}
            {changePct != null && (
              <span className={`ml-2 font-semibold ${changePct >= 0 ? "text-gain" : "text-loss"}`}>
                {fmtPct(changePct)}
              </span>
            )}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right text-xs sm:text-sm">
        <p className={`font-bold tabular-nums ${actionTextClass(rec.action)}`}>{fmt(rec.suggestedPrice)}</p>
        <p className="text-zinc-300">{urgencyLabel(rec.urgency)}</p>
      </div>
    </button>
  );
}

export function TradingTimingHub({
  data,
  portfolio,
  summaries,
  buySignals,
  sellSignals,
  recommendations,
  briefingLoading,
  briefingError,
  onBriefingRefresh,
  kisConfigured,
  kisLoading,
  kisError,
  onKisRefresh,
  onSelectStock,
  onAddStock,
}: {
  data: AppData;
  portfolio: PortfolioSummary;
  summaries: Record<string, StockSummary>;
  buySignals: Record<string, BuyTimingSignal>;
  sellSignals: Record<string, SellTimingSignal>;
  recommendations: TradeRecommendation[];
  marketContext?: MarketBriefingContext | null;
  briefingLoading: boolean;
  briefingError: string | null;
  lastBriefingFetched?: Date | null;
  onBriefingRefresh: () => void;
  kisConfigured: boolean | null;
  kisLoading: boolean;
  kisError: string | null;
  kisLastUpdated?: Date | null;
  onKisRefresh: () => void;
  onSelectStock: (id: string) => void;
  onAddStock: () => void;
}) {
  const report = useMemo(
    () => buildDailyReport(data, portfolio, summaries, buySignals, sellSignals),
    [data, portfolio, summaries, buySignals, sellSignals]
  );

  const portfolioDay = computePortfolioDayChange(data.stocks, summaries, data.stockQuotes);
  const cmp = compareToKospi(portfolioDay, data.kospiBenchmark);
  const kospi = data.kospiBenchmark;

  const sortedRecs = useMemo(() => {
    const order = { buy: 0, sell: 1, hold: 2 };
    return [...recommendations].sort(
      (a, b) => order[a.action] - order[b.action] || b.confidence - a.confidence
    );
  }, [recommendations]);

  const changeByStock = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of report.rows) {
      if (row.priceChangePctFromPrev != null) map.set(row.stock.id, row.priceChangePctFromPrev);
    }
    return map;
  }, [report.rows]);

  const pnlTone = portfolio.totalPnl >= 0 ? "text-gain" : "text-loss";

  return (
    <section className={`min-w-0 overflow-hidden ${panelShell}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <p className={`text-lg font-bold tabular-nums ${pnlTone}`}>누적 {fmtSigned(portfolio.totalPnl)}</p>
          {kospi && (
            <p className="text-xs text-zinc-300">
              KOSPI {fmtPct(kospi.changeRate)}
              {cmp.portfolio != null && ` · 보유 ${fmtPct(cmp.portfolio)}`}
            </p>
          )}
        </div>
        <RefreshButtonGroup
          onKisRefresh={onKisRefresh}
          onBriefingRefresh={onBriefingRefresh}
          kisLoading={kisLoading}
          briefingLoading={briefingLoading}
          kisDisabled={kisConfigured === false}
        />
      </div>

      {(kisError || briefingError) && (
        <div className={`${warnBanner} !rounded-none border-x-0 border-t-0 border-b border-b-[var(--ui-header-border)]`}>
          {[kisError, briefingError].filter(Boolean).join(" · ")}
        </div>
      )}

      <div className="space-y-2 p-3 sm:p-4">
        {sortedRecs.length > 0 ? (
          sortedRecs.map((rec) => (
            <TimingRow
              key={rec.stockId}
              rec={rec}
              summary={summaries[rec.stockId]}
              changePct={changeByStock.get(rec.stockId) ?? null}
              onClick={() => onSelectStock(rec.stockId)}
            />
          ))
        ) : (
          <p className="py-8 text-center text-sm text-zinc-300">종목을 추가한 뒤 시세를 새로고침하세요.</p>
        )}
      </div>

      <p className="border-t border-white/10 px-3 py-2 text-center text-xs text-zinc-300">
        종목을 누르면 매매 메뉴로 이동합니다
      </p>
    </section>
  );
}
