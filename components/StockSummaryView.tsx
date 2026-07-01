"use client";

import type { BuyTimingSignal, SellTimingSignal, Stock, StockSummary } from "@/lib/types";
import { fmt, fmtPct, fmtQty, fmtSigned } from "@/lib/calc";

export function StockSummaryList({
  stocks,
  summaries,
  buySignals,
  sellSignals,
  onOpen,
}: {
  stocks: Stock[];
  summaries: Record<string, StockSummary>;
  buySignals: Record<string, BuyTimingSignal>;
  sellSignals: Record<string, SellTimingSignal>;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[640px] text-sm sm:min-w-[800px] sm:text-base">
        <thead className="border-b border-line bg-surface-dim text-xs font-semibold text-ink-muted sm:text-sm">
          <tr>
            <th className="px-3 py-2.5 text-left">종목</th>
            <th className="px-3 py-2.5 text-right">코드</th>
            <th className="px-3 py-2.5 text-right">현재가</th>
            <th className="px-3 py-2.5 text-right">보유</th>
            <th className="px-3 py-2.5 text-right">평가손익</th>
            <th className="px-3 py-2.5 text-right">매수 타이밍</th>
            <th className="px-3 py-2.5 text-right">매도 타이밍</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((s) => {
            const sum = summaries[s.id];
            if (!sum) return null;
            const buy = buySignals[s.id];
            const sell = sellSignals[s.id];
            const pnlTone =
              sum.holdingQty > 0 && sum.unrealizedPnlWithCost >= 0
                ? "text-gain"
                : sum.holdingQty > 0 && sum.unrealizedPnlWithCost < 0
                  ? "text-loss"
                  : "text-ink";

            return (
              <tr
                key={s.id}
                onClick={() => onOpen(s.id)}
                className="cursor-pointer border-t border-line transition hover:bg-surface-dim/80"
              >
                <td className="px-3 py-3 font-semibold text-ink">{s.name}</td>
                <td className="px-3 py-3 text-right tabular-nums text-sm text-ink-muted">{s.code ?? "—"}</td>
                <td className="px-3 py-3 text-right tabular-nums font-semibold">{fmt(sum.currentPrice)}</td>
                <td className="px-3 py-3 text-right tabular-nums font-semibold">
                  {sum.holdingQty > 0 ? `${fmtQty(sum.holdingQty)}주` : "0"}
                </td>
                <td className={`px-3 py-3 text-right tabular-nums font-bold ${pnlTone}`}>
                  {sum.holdingQty > 0 ? (
                    <>
                      {fmtSigned(sum.unrealizedPnlWithCost)}
                      <span className="ml-1 text-xs font-semibold">({fmtPct(sum.unrealizedPnlPct)})</span>
                    </>
                  ) : (
                    "0"
                  )}
                </td>
                <td className="px-3 py-3 text-right font-semibold">{buy?.label ?? "—"}</td>
                <td className="px-3 py-3 text-right font-semibold text-slate-600">{sell?.label ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
