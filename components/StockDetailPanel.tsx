"use client";

import { type ReactNode } from "react";
import type { Stock } from "@/lib/types";
import {
  BtnEdit,
  BtnDelete,
  PanelHeaderActions,
  panelShell,
} from "@/components/ui/PanelCard";
import { StockPanelTitleRow, StockTitleTabs } from "@/components/ui/StockTitleTabBar";

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
      <StockPanelTitleRow
        trailing={
          <PanelHeaderActions className="mb-3 sm:mb-3.5">
            <BtnEdit onClick={() => onEdit(active)} />
            <BtnDelete onClick={() => onDelete(active.id)} />
          </PanelHeaderActions>
        }
      >
        <StockTitleTabs
          stocks={stocks}
          activeId={activeId}
          onSelect={onSelect}
          titleId={`records-stock-title-${activeId}`}
        />
      </StockPanelTitleRow>
      <div className="space-y-3 p-3 sm:p-5">{children}</div>
    </section>
  );
}
