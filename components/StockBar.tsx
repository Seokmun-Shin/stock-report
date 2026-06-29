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
  view,
  onViewChange,
}: {
  stocks: Stock[];
  activeId: string;
  summaries: Record<string, StockSummary>;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (stock: Stock) => void;
  onDelete: (id: string) => void;
  embedded?: boolean;
  view?: "summary" | "detail";
  onViewChange?: (view: "summary" | "detail") => void;
}) {
  const active = stocks.find((s) => s.id === activeId);

  const inner = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-ink sm:text-lg">종목</h2>
          {onViewChange && view && (
            <div className="flex rounded-lg border border-line bg-surface-dim p-0.5 text-sm">
              <button
                type="button"
                onClick={() => onViewChange("summary")}
                className={`rounded-md px-2.5 py-1 font-semibold ${
                  view === "summary" ? "bg-white text-ink shadow-sm" : "text-ink-muted"
                }`}
              >
                Summary
              </button>
              <button
                type="button"
                onClick={() => onViewChange("detail")}
                className={`rounded-md px-2.5 py-1 font-semibold ${
                  view === "detail" ? "bg-white text-ink shadow-sm" : "text-ink-muted"
                }`}
              >
                상세
              </button>
            </div>
          )}
        </div>
        {active && (
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
              onClick={() => onDelete(active.id)}
              className="rounded-lg border border-line px-2.5 py-1 text-sm text-loss hover:bg-loss-soft"
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
              <span className="block text-base font-semibold">{s.name}</span>
              {sum && (
                <span className={`block text-sm tabular-nums ${isActive ? "text-slate-300" : "text-ink-muted"}`}>
                  {sum.holdingQty > 0 ? `보유 ${fmtQty(sum.holdingQty)} · ` : ""}
                  {fmtPct(sum.returnRate)}
                  {s.code && <span className="ml-1 opacity-80">· {s.code}</span>}
                </span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onAdd}
          className="rounded-xl border-2 border-dashed border-line px-4 py-2 text-base font-semibold text-ink-muted hover:border-gain hover:text-gain"
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
