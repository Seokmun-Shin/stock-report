"use client";

export function StockPills({
  stocks,
  activeId,
  onSelect,
}: {
  stocks: { id: string; name: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {stocks.map((s) => {
        const active = s.id === activeId;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
              active ? "bg-gain text-white" : "bg-surface-dim text-ink-muted hover:bg-line/50"
            }`}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
