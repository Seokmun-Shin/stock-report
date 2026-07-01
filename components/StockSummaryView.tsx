"use client";

import type { BuyTimingSignal, SellTimingSignal, Stock, StockQuote, StockSummary } from "@/lib/types";
import { fmt, fmtPct, fmtQty, fmtSigned } from "@/lib/calc";

function QuoteChange({ quote }: { quote?: StockQuote }) {
  if (!quote) return <span className="text-ink-muted">—</span>;
  const tone = quote.changeRate > 0 ? "text-gain" : quote.changeRate < 0 ? "text-loss" : "text-ink-muted";
  return (
    <span className={`tabular-nums font-semibold ${tone}`}>
      {fmtPct(quote.changeRate)}
    </span>
  );
}

export function StockSummaryCards({
  stocks,
  summaries,
  stockQuotes,
  buySignals,
  sellSignals,
  onOpen,
}: {
  stocks: Stock[];
  summaries: Record<string, StockSummary>;
  stockQuotes?: Record<string, StockQuote>;
  buySignals: Record<string, BuyTimingSignal>;
  sellSignals: Record<string, SellTimingSignal>;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 md:hidden">
      {stocks.map((s) => {
        const sum = summaries[s.id];
        if (!sum) return null;
        const q = stockQuotes?.[s.id];
        const buy = buySignals[s.id];
        const sell = sellSignals[s.id];
        const pnlTone = sum.unrealizedPnlWithCost >= 0 ? "text-gain" : "text-loss";

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onOpen(s.id)}
            className="rounded-xl border border-line bg-white p-3 text-left shadow-sm transition hover:border-blue-300 hover:bg-surface-dim/30"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-bold text-ink">{s.name}</p>
                <p className="text-xs tabular-nums text-ink-muted">{s.code ?? "코드 없음"}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums text-ink">{fmt(sum.currentPrice)}</p>
                <QuoteChange quote={q} />
              </div>
            </div>

            {q && (
              <p className="mt-2 text-xs tabular-nums text-ink-muted">
                전일 {fmt(q.prevClose)} · 고 {fmt(q.high)} · 저 {fmt(q.low)}
              </p>
            )}

            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-ink-muted">보유 </span>
                <span className="font-semibold tabular-nums">{sum.holdingQty > 0 ? `${fmtQty(sum.holdingQty)}주` : "0"}</span>
              </div>
              <div className="text-right">
                <span className="text-ink-muted">평가 </span>
                <span className={`font-bold tabular-nums ${sum.holdingQty > 0 ? pnlTone : "text-ink"}`}>
                  {sum.holdingQty > 0 ? fmtSigned(sum.unrealizedPnlWithCost) : "0"}
                </span>
              </div>
              <div>
                <span className="text-gain">{buy?.label ?? "—"}</span>
              </div>
              <div className="text-right text-slate-600">{sell?.label ?? "—"}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function StockSummaryList({
  stocks,
  summaries,
  stockQuotes,
  buySignals,
  sellSignals,
  onOpen,
}: {
  stocks: Stock[];
  summaries: Record<string, StockSummary>;
  stockQuotes?: Record<string, StockQuote>;
  buySignals: Record<string, BuyTimingSignal>;
  sellSignals: Record<string, SellTimingSignal>;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <StockSummaryCards
        stocks={stocks}
        summaries={summaries}
        stockQuotes={stockQuotes}
        buySignals={buySignals}
        sellSignals={sellSignals}
        onOpen={onOpen}
      />

      <div className="hidden min-w-0 overflow-x-auto rounded-xl border border-line md:block">
        <table className="w-full min-w-[880px] text-sm lg:text-base">
          <thead className="border-b border-line bg-surface-dim text-xs font-semibold text-ink-muted lg:text-sm">
            <tr>
              <th className="px-3 py-2.5 text-left">종목</th>
              <th className="px-3 py-2.5 text-right">현재가</th>
              <th className="px-3 py-2.5 text-right">전일比</th>
              <th className="px-3 py-2.5 text-right">고가</th>
              <th className="px-3 py-2.5 text-right">저가</th>
              <th className="px-3 py-2.5 text-right">보유</th>
              <th className="px-3 py-2.5 text-right">평가손익</th>
              <th className="px-3 py-2.5 text-right">매수</th>
              <th className="px-3 py-2.5 text-right">매도</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) => {
              const sum = summaries[s.id];
              if (!sum) return null;
              const q = stockQuotes?.[s.id];
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
                  <td className="px-3 py-3">
                    <span className="font-semibold text-ink">{s.name}</span>
                    <span className="ml-1.5 text-xs tabular-nums text-ink-muted">{s.code ?? ""}</span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold">{fmt(sum.currentPrice)}</td>
                  <td className="px-3 py-3 text-right">
                    <QuoteChange quote={q} />
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-ink-muted">{q ? fmt(q.high) : "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-ink-muted">{q ? fmt(q.low) : "—"}</td>
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
    </>
  );
}
