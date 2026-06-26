"use client";

import type { ReactNode } from "react";
import type { Stock, StockSummary } from "@/lib/types";
import { StockBar } from "./StockBar";

export function StockPanel({
  stocks,
  activeId,
  summaries,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  children,
}: {
  stocks: Stock[];
  activeId: string;
  summaries: Record<string, StockSummary>;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (stock: Stock) => void;
  onDelete: (id: string) => void;
  children?: ReactNode;
}) {
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
      />

      {active && children && (
        <div className="mt-5 space-y-5 border-t border-line pt-5">{children}</div>
      )}
    </section>
  );
}
