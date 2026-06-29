"use client";

import type { BuyTimingSignal, SellTimingSignal, Stock, StockSummary } from "@/lib/types";
import { fmt, fmtQty, fmtSigned } from "@/lib/calc";

export function StockSummaryView({
  stocks,
  summaries,
  buySignals,
  sellSignals,
  activeId,
  onSelect,
}: {
  stocks: Stock[];
  summaries: Record<string, StockSummary>;
  buySignals: Record<string, BuyTimingSignal>;
  sellSignals: Record<string, SellTimingSignal>;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {stocks.map((s) => {
        const sum = summaries[s.id];
        if (!sum) return null;
        const buy = buySignals[s.id];
        const sell = sellSignals[s.id];
        const isActive = s.id === activeId;
        const pnlTone = sum.unrealizedPnl >= 0 ? "text-gain" : sum.unrealizedPnl < 0 ? "text-loss" : "text-ink";

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              isActive
                ? "border-ink bg-surface shadow-md ring-2 ring-ink/10"
                : "border-line bg-surface-dim hover:border-slate-400"
            }`}
          >
            <p className="mb-3 text-sm font-semibold text-ink-muted">{s.name}</p>
            <div className="space-y-2 tabular-nums">
              <p className="text-2xl font-bold text-ink">{fmt(sum.currentPrice)}</p>
              <p className="text-xl font-semibold text-ink">
                {sum.holdingQty > 0 ? fmtQty(sum.holdingQty) : "0"}
              </p>
              <p className={`text-xl font-bold ${pnlTone}`}>
                {sum.holdingQty > 0 ? fmtSigned(sum.unrealizedPnl) : "0"}
              </p>
              <p className="text-base font-semibold text-ink">{buy?.label ?? "—"}</p>
              <p className="text-base font-semibold text-slate-600">{sell?.label ?? "—"}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
