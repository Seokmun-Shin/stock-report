"use client";

import { useState, type ReactNode } from "react";
import type { BuyTimingSignal, SellTimingSignal, Stock, StockSummary } from "@/lib/types";
import { BackToSummaryIcon, StockMiniCards } from "./StockMiniCards";
import { StockSummaryList } from "./StockSummaryView";

export function StockPanel({
  stocks,
  activeId,
  summaries,
  buySignals,
  sellSignals,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  summaryAddon,
  children,
}: {
  stocks: Stock[];
  activeId: string;
  summaries: Record<string, StockSummary>;
  buySignals: Record<string, BuyTimingSignal>;
  sellSignals: Record<string, SellTimingSignal>;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (stock: Stock) => void;
  onDelete: (id: string) => void;
  summaryAddon?: ReactNode;
  children?: ReactNode;
}) {
  const [view, setView] = useState<"summary" | "detail">("summary");
  const active = stocks.find((s) => s.id === activeId);

  function openDetail(id: string) {
    onSelect(id);
    setView("detail");
  }

  function handleDelete(id: string) {
    onDelete(id);
    setView("summary");
  }

  if (view === "detail" && active) {
    return (
      <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-line px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <BackToSummaryIcon onClick={() => setView("summary")} />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-ink sm:text-xl">
                {active.name}
                {active.code && (
                  <span className="ml-1.5 text-sm font-semibold tabular-nums text-ink-muted sm:ml-2 sm:text-lg">
                    {active.code}
                  </span>
                )}
              </h2>
            </div>
          </div>
          <div className="flex shrink-0 gap-1 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => onEdit(active)}
              className="rounded-lg border border-line px-2.5 py-1 text-sm text-ink-muted hover:bg-surface-dim"
            >
              이름 수정
            </button>
            <button
              type="button"
              onClick={() => handleDelete(active.id)}
              className="rounded-lg border border-line px-2.5 py-1 text-sm text-loss hover:bg-loss-soft"
            >
              삭제
            </button>
          </div>
        </div>

        <div className="px-3 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
          <div className="min-w-0 overflow-hidden rounded-xl border border-blue-400 bg-white">
            <div className="overflow-x-auto bg-surface-dim px-2 pb-0 pt-3 sm:px-3">
              <StockMiniCards
                stocks={stocks}
                summaries={summaries}
                activeId={activeId}
                onSelect={onSelect}
                connected
              />
            </div>
            {children && (
              <div className="relative space-y-4 border-t border-blue-400 bg-white p-3 pt-3 sm:space-y-5 sm:p-5 sm:pt-4">{children}</div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <h2 className="border-b border-line px-3 py-3 text-base font-semibold text-ink sm:px-5 sm:py-3.5 sm:text-lg">종목 Summary</h2>

      <div className="min-w-0 p-3 pt-3 sm:p-5 sm:pt-4">
        <StockSummaryList
          stocks={stocks}
          summaries={summaries}
          buySignals={buySignals}
          sellSignals={sellSignals}
          onOpen={openDetail}
        />
        <button
          type="button"
          onClick={onAdd}
          className="mt-2 w-full rounded-xl border-2 border-dashed border-line py-2.5 text-sm font-semibold text-ink-muted hover:border-gain hover:text-gain"
        >
          + 종목
        </button>
        {summaryAddon}
      </div>
    </section>
  );
}
