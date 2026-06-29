"use client";

import { useState, type ReactNode } from "react";
import type { BuyTimingSignal, SellTimingSignal, Stock, StockSummary } from "@/lib/types";
import { StockBar } from "./StockBar";
import { StockSummaryView } from "./StockSummaryView";

export type StockPanelView = "summary" | "detail";

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
  children?: ReactNode;
}) {
  const [view, setView] = useState<StockPanelView>("summary");
  const active = stocks.find((s) => s.id === activeId);

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <StockBar
        embedded
        stocks={stocks}
        activeId={activeId}
        summaries={summaries}
        onSelect={onSelect}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        view={view}
        onViewChange={setView}
      />

      {active && view === "summary" && (
        <div className="mt-5 border-t border-line pt-5">
          <StockSummaryView
            stocks={stocks}
            summaries={summaries}
            buySignals={buySignals}
            sellSignals={sellSignals}
            activeId={activeId}
            onSelect={onSelect}
          />
        </div>
      )}

      {active && view === "detail" && children && (
        <div className="mt-5 space-y-5 border-t border-line pt-5">{children}</div>
      )}
    </section>
  );
}
