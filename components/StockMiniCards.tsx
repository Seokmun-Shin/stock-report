"use client";

import type { Stock, StockQuote, StockSummary } from "@/lib/types";
import type { TradeRecommendation } from "@/lib/briefing/types";
import { fmt, fmtPct } from "@/lib/calc";
import { ActionBadge } from "./TimingBadges";

export function BackToSummaryIcon({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="매매 타이밍으로"
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-muted hover:bg-surface-dim hover:text-ink"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function StockMiniCards({
  stocks,
  summaries,
  stockQuotes,
  recommendations,
  activeId,
  onSelect,
  connected = false,
}: {
  stocks: Stock[];
  summaries: Record<string, StockSummary>;
  stockQuotes?: Record<string, StockQuote>;
  recommendations?: TradeRecommendation[];
  activeId: string;
  onSelect: (id: string) => void;
  connected?: boolean;
}) {
  const recMap = new Map(recommendations?.map((r) => [r.stockId, r]) ?? []);

  return (
    <div className={`flex min-w-0 flex-wrap gap-2 ${connected ? "items-end" : ""}`}>
      {stocks.map((s) => {
        const sum = summaries[s.id];
        const q = stockQuotes?.[s.id];
        const rec = recMap.get(s.id);
        const isActive = s.id === activeId;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={
              connected
                ? `shrink-0 min-w-0 max-w-full flex-1 basis-[calc(50%-0.25rem)] px-3 py-2.5 text-left transition sm:basis-[calc(33%-0.35rem)] sm:px-4 sm:py-3 ${
                    isActive
                      ? "relative z-10 -mb-px rounded-t-lg border-2 border-gain border-b-white bg-white"
                      : "mb-px rounded-lg border border-transparent bg-white/70 text-ink-muted hover:border-slate-300 hover:bg-white hover:text-ink"
                  }`
                : `min-w-[8.5rem] rounded-xl px-4 py-3 text-left transition ${
                    isActive
                      ? "bg-ink text-white shadow-md"
                      : "border border-line bg-white text-ink hover:border-slate-400 hover:bg-surface-dim/50"
                  }`
            }
          >
            <div className="flex items-center justify-between gap-1">
              <span
                className={`block truncate text-base font-bold leading-snug ${
                  connected ? (isActive ? "text-ink" : "text-ink-muted") : isActive ? "text-white" : "text-ink"
                }`}
              >
                {s.name}
              </span>
              {rec && (
                <span className="scale-90 origin-right">
                  <ActionBadge action={rec.action} />
                </span>
              )}
            </div>
            {sum && (
              <span
                className={`mt-1 block text-sm font-semibold tabular-nums ${
                  connected ? "text-ink" : isActive ? "text-slate-200" : "text-ink"
                }`}
              >
                {fmt(sum.currentPrice)}
                {q && (
                  <span
                    className={`ml-1 text-xs ${q.changeRate >= 0 ? "text-gain" : "text-loss"} ${connected || !isActive ? "" : "opacity-90"}`}
                  >
                    {fmtPct(q.changeRate)}
                  </span>
                )}
              </span>
            )}
            <span
              className={`mt-0.5 block text-xs tabular-nums ${
                connected || !isActive ? "text-ink-muted" : "text-slate-400"
              }`}
            >
              {rec ? `${rec.action === "buy" ? "매수" : rec.action === "sell" ? "매도" : "관망"} · ${fmt(rec.suggestedPrice)}` : s.code ?? "코드 없음"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
