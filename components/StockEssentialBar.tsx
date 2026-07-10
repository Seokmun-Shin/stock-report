"use client";

import type { StockQuote, StockSummary } from "@/lib/types";
import type { TradeRecommendation } from "@/lib/briefing/types";
import { fmt, fmtPct, fmtQty, fmtSigned } from "@/lib/calc";
import { ActionBadge, actionTextClass, urgencyLabel } from "./TimingBadges";

/** 종목 상단 — 필수 4가지: 현재가 · 추천 · 시점 · 매매 */
export function StockEssentialBar({
  summary,
  quote,
  recommendation,
  kisLoading,
  onRefreshPrice,
  onAddTrade,
}: {
  summary: StockSummary;
  quote?: StockQuote;
  recommendation?: TradeRecommendation | null;
  kisLoading?: boolean;
  onRefreshPrice?: () => void;
  onAddTrade: () => void;
}) {
  const pnlTone = summary.unrealizedPnlWithCost >= 0 ? "text-gain" : "text-loss";

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-red-500/10 to-transparent p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-bold tabular-nums text-white sm:text-3xl">{fmt(summary.currentPrice)}</p>
          {quote && (
            <p className={`mt-0.5 text-sm font-semibold tabular-nums ${quote.changeRate >= 0 ? "text-gain" : "text-loss"}`}>
              전일比 {fmtPct(quote.changeRate)}
            </p>
          )}
        </div>
        {recommendation && (
          <div className="text-right">
            <ActionBadge action={recommendation.action} size="lg" />
            <p className={`mt-1 text-sm font-bold tabular-nums ${actionTextClass(recommendation.action)}`}>
              {fmt(recommendation.suggestedPrice)}
            </p>
            <p className="text-xs text-zinc-300">{urgencyLabel(recommendation.urgency)}</p>
          </div>
        )}
      </div>

      {recommendation && (
        <p className="mt-2 text-xs leading-relaxed text-zinc-300">
          구간 {fmt(recommendation.priceRange.min)} ~ {fmt(recommendation.priceRange.max)}
          <span className="mx-1.5 text-line">|</span>
          {recommendation.timingNote}
        </p>
      )}

      {summary.holdingQty > 0 && (
        <p className="mt-2 text-xs tabular-nums text-zinc-300">
          보유 {fmtQty(summary.holdingQty)}주 · 평가{" "}
          <span className={`font-semibold ${pnlTone}`}>{fmtSigned(summary.unrealizedPnlWithCost)}</span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAddTrade}
          className="rounded-lg bg-gain px-4 py-2 text-sm font-semibold text-white hover:bg-gain/90"
        >
          + 매매 입력
        </button>
        {onRefreshPrice && (
          <button
            type="button"
            onClick={onRefreshPrice}
            disabled={kisLoading}
            className="ui-btn-secondary text-sm px-3 py-2 disabled:opacity-50"
          >
            {kisLoading ? "시세…" : "시세"}
          </button>
        )}
      </div>
    </div>
  );
}
