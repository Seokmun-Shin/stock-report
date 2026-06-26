"use client";

import type { Stock } from "@/lib/types";
import { fmtPct, fmtQty } from "@/lib/calc";
import type { StockSummary } from "@/lib/types";

export function StockBar({
  stocks,
  activeId,
  summaries,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  embedded = false,
}: {
  stocks: Stock[];
  activeId: string;
  summaries: Record<string, StockSummary>;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (stock: Stock) => void;
  onDelete: (id: string) => void;
  embedded?: boolean;
}) {
  const active = stocks.find((s) => s.id === activeId);

  const inner = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">종목</h2>
        {active && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onEdit(active)}
              className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted hover:bg-surface-dim"
            >
              이름 수정
            </button>
            <button
              type="button"
              onClick={() => onDelete(active.id)}
              className="rounded-lg border border-line px-2.5 py-1 text-xs text-loss hover:bg-loss-soft"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {stocks.map((s) => {
          const sum = summaries[s.id];
          const isActive = s.id === activeId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={`rounded-xl px-4 py-2 transition ${
                isActive ? "bg-ink text-white shadow-md" : "border border-line bg-surface-dim text-ink hover:border-slate-400"
              }`}
            >
              <span className="block text-sm font-semibold">{s.name}</span>
              {sum && (
                <span className={`block text-xs tabular-nums ${isActive ? "text-slate-300" : "text-ink-muted"}`}>
                  {sum.holdingQty > 0 ? `보유 ${fmtQty(sum.holdingQty)} · ` : ""}
                  {fmtPct(sum.returnRate)}
                </span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onAdd}
          className="rounded-xl border-2 border-dashed border-line px-4 py-2 text-sm font-semibold text-ink-muted hover:border-gain hover:text-gain"
        >
          + 종목
        </button>
      </div>
    </>
  );

  if (embedded) return inner;

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      {inner}
    </section>
  );
}
