"use client";

import type { Stock, StockQuote, StockSummary } from "@/lib/types";
import { fmt, fmtPct } from "@/lib/calc";

export function BackToSummaryIcon({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Summary 돌아가기"
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-muted hover:bg-surface-dim hover:text-ink"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function StockMiniCards({
  stocks,
  summaries,
  stockQuotes,
  activeId,
  onSelect,
  connected = false,
}: {
  stocks: Stock[];
  summaries: Record<string, StockSummary>;
  stockQuotes?: Record<string, StockQuote>;
  activeId: string;
  onSelect: (id: string) => void;
  connected?: boolean;
}) {
  return (
    <div className={`flex min-w-0 gap-2 ${connected ? "items-end" : "flex-wrap"}`}>
      {stocks.map((s) => {
        const sum = summaries[s.id];
        const q = stockQuotes?.[s.id];
        const isActive = s.id === activeId;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={
              connected
                ? `shrink-0 min-w-[7.5rem] px-3 py-2.5 text-left transition sm:min-w-[8.5rem] sm:px-4 sm:py-3 ${
                    isActive
                      ? "relative z-10 -mb-px rounded-t-lg border-2 border-blue-400 border-b-white bg-white"
                      : "mb-px rounded-lg border border-transparent bg-white/70 text-ink-muted hover:border-slate-300 hover:bg-white hover:text-ink"
                  }`
                : `min-w-[8.5rem] rounded-xl px-4 py-3 text-left transition ${
                    isActive
                      ? "bg-ink text-white shadow-md"
                      : "border border-line bg-white text-ink hover:border-slate-400 hover:bg-surface-dim/50"
                  }`
            }
          >
            <span
              className={`block truncate text-base font-bold leading-snug ${
                connected ? (isActive ? "text-ink" : "text-ink-muted") : isActive ? "text-white" : "text-ink"
              }`}
            >
              {s.name}
            </span>
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
              {s.code ?? "코드 없음"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
