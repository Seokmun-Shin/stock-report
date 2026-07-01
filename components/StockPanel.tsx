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
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <BackToSummaryIcon onClick={() => setView("summary")} />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-ink sm:text-xl">
                {active.name}
                {active.code && (
                  <span className="ml-2 text-base font-semibold tabular-nums text-ink-muted sm:text-lg">
                    {active.code}
                  </span>
                )}
              </h2>
            </div>
          </div>
          <div className="flex gap-1">
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

        <div className="px-5 pb-5 pt-4">
          <div className="overflow-hidden rounded-xl border border-blue-400 bg-white">
            <div className="bg-surface-dim px-3 pb-0 pt-3">
              <StockMiniCards
                stocks={stocks}
                summaries={summaries}
                activeId={activeId}
                onSelect={onSelect}
                connected
              />
            </div>
            {children && (
              <div className="relative space-y-5 border-t border-blue-400 bg-white p-5 pt-4">{children}</div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <h2 className="border-b border-line px-5 py-3.5 text-base font-semibold text-ink sm:text-lg">종목 Summary</h2>

      <div className="p-5 pt-4">
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
