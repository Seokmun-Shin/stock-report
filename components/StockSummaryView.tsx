"use client";

import type { ReactNode } from "react";
import type { BuyTimingSignal, SellTimingSignal, Stock, StockQuote, StockSummary } from "@/lib/types";
import { fmt, fmtPct, fmtQty, fmtSigned } from "@/lib/calc";
import { BtnDelete } from "@/components/ui/PanelCard";

function QuoteChange({ quote }: { quote?: StockQuote }) {
  if (!quote) return <span className="ui-fg-muted">—</span>;
  const tone = quote.changeRate > 0 ? "text-gain" : quote.changeRate < 0 ? "text-loss" : "ui-fg-muted";
  return (
    <span className={`tabular-nums font-semibold ${tone}`}>
      {fmtPct(quote.changeRate)}
    </span>
  );
}

function StopRowClick({ children }: { children: ReactNode }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="shrink-0"
    >
      {children}
    </div>
  );
}

export function StockSummaryCards({
  stocks,
  summaries,
  stockQuotes,
  buySignals,
  sellSignals,
  onOpen,
  onDelete,
}: {
  stocks: Stock[];
  summaries: Record<string, StockSummary>;
  stockQuotes?: Record<string, StockQuote>;
  buySignals: Record<string, BuyTimingSignal>;
  sellSignals: Record<string, SellTimingSignal>;
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
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
          <div
            key={s.id}
            className="ui-inner-block flex items-stretch gap-2 p-3 shadow-sm transition hover:border-gain/40"
          >
            <button type="button" onClick={() => onOpen(s.id)} className="min-w-0 flex-1 text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="ui-fg-primary truncate font-bold">{s.name}</p>
                  <p className="ui-fg-muted text-xs tabular-nums">{s.code ?? "코드 없음"}</p>
                </div>
                <div className="text-right">
                  <p className="ui-fg-primary text-lg font-bold tabular-nums">{fmt(sum.currentPrice)}</p>
                  <QuoteChange quote={q} />
                </div>
              </div>

              {q && (
                <p className="ui-fg-muted mt-2 text-xs tabular-nums">
                  전일 {fmt(q.prevClose)} · 고 {fmt(q.high)} · 저 {fmt(q.low)}
                </p>
              )}

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="ui-fg-muted">보유 </span>
                  <span className="font-semibold tabular-nums">
                    {sum.holdingQty > 0 ? `${fmtQty(sum.holdingQty)}주` : "0"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="ui-fg-muted">평가 </span>
                  <span className={`font-bold tabular-nums ${sum.holdingQty > 0 ? pnlTone : "ui-fg-primary"}`}>
                    {sum.holdingQty > 0 ? fmtSigned(sum.unrealizedPnlWithCost) : "0"}
                  </span>
                </div>
                <div>
                  <span className="text-gain">{buy?.label ?? "—"}</span>
                </div>
                <div className="ui-fg-secondary text-right">{sell?.label ?? "—"}</div>
              </div>
            </button>
            {onDelete && (
              <StopRowClick>
                <BtnDelete
                  onClick={() => onDelete(s.id)}
                  className="h-full min-h-[2.75rem] px-2.5"
                  title={`${s.name} 삭제`}
                >
                  삭제
                </BtnDelete>
              </StopRowClick>
            )}
          </div>
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
  onDelete,
}: {
  stocks: Stock[];
  summaries: Record<string, StockSummary>;
  stockQuotes?: Record<string, StockQuote>;
  buySignals: Record<string, BuyTimingSignal>;
  sellSignals: Record<string, SellTimingSignal>;
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
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
        onDelete={onDelete}
      />

      <div className="hidden min-w-0 overflow-x-auto rounded-xl border border-white/10 md:block">
        <table className="w-full min-w-[940px] text-sm lg:text-base">
          <thead className="border-b border-white/10 bg-white/10 text-xs font-semibold text-zinc-300 lg:text-sm">
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
              {onDelete && <th className="px-3 py-2.5 text-right">관리</th>}
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
                    : "text-white";

              return (
                <tr
                  key={s.id}
                  onClick={() => onOpen(s.id)}
                  className="cursor-pointer border-t border-white/10 transition hover:bg-white/10"
                >
                  <td className="px-3 py-3">
                    <span className="font-semibold text-white">{s.name}</span>
                    <span className="ml-1.5 text-xs tabular-nums text-zinc-300">{s.code ?? ""}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{fmt(sum.currentPrice)}</td>
                  <td className="px-3 py-3 text-right">
                    <QuoteChange quote={q} />
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-300">{q ? fmt(q.high) : "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-300">{q ? fmt(q.low) : "—"}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">
                    {sum.holdingQty > 0 ? `${fmtQty(sum.holdingQty)}주` : "0"}
                  </td>
                  <td className={`px-3 py-3 text-right font-bold tabular-nums ${pnlTone}`}>
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
                  {onDelete && (
                    <td className="px-3 py-3 text-right">
                      <StopRowClick>
                        <BtnDelete onClick={() => onDelete(s.id)} className="px-2.5 py-1" title={`${s.name} 삭제`}>
                          삭제
                        </BtnDelete>
                      </StopRowClick>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
