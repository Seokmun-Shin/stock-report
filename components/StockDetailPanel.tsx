"use client";

import { type ReactNode } from "react";
import type { Stock } from "@/lib/types";
import { panelHeaderBar, panelShell } from "@/components/ui/PanelCard";
import { StockPills } from "@/components/ui/StockPills";

export function StockDetailPanel({
  stocks,
  activeId,
  onSelect,
  onEdit,
  onDelete,
  children,
}: {
  stocks: Stock[];
  activeId: string;
  onSelect: (id: string) => void;
  onEdit: (stock: Stock) => void;
  onDelete: (id: string) => void;
  children?: ReactNode;
}) {
  const active = stocks.find((s) => s.id === activeId);
  if (!active) return null;

  return (
    <section className={panelShell}>
      <div className={`flex flex-wrap items-center justify-between gap-2 ${panelHeaderBar}`}>
        <h2 className="truncate text-sm font-bold text-ink">{active.name}</h2>
        <div className="flex gap-1 text-xs">
          <button type="button" onClick={() => onEdit(active)} className="text-ink-muted hover:text-ink">
            수정
          </button>
          <span className="text-line">|</span>
          <button type="button" onClick={() => onDelete(active.id)} className="text-loss hover:underline">
            삭제
          </button>
        </div>
      </div>
      <div className="space-y-3 p-3 sm:p-5">
        <StockPills stocks={stocks} activeId={activeId} onSelect={onSelect} />
        {children}
      </div>
    </section>
  );
}
