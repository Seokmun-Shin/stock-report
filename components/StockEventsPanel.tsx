"use client";

import { useState } from "react";
import type { AppData, Stock, StockEvent } from "@/lib/types";
import { applySplitToTrades, createStockEvent } from "@/lib/stockEvents";
import { fmt } from "@/lib/calc";
import { CollapsibleSection } from "./CollapsibleSection";

export function StockEventsPanel({
  data,
  activeStock,
  onPersist,
}: {
  data: AppData;
  activeStock: Stock | null;
  onPersist: (next: AppData) => void;
}) {
  const [type, setType] = useState<"split" | "dividend">("split");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [ratio, setRatio] = useState(2);
  const [amount, setAmount] = useState(0);
  const [memo, setMemo] = useState("");

  const events = (data.stockEvents ?? []).filter(
    (e) => !activeStock || e.stockId === activeStock.id
  );

  function addEvent() {
    if (!activeStock) return;
    const event = createStockEvent(activeStock.id, type, date, {
      ratio: type === "split" ? ratio : undefined,
      amount: type === "dividend" ? amount : undefined,
      memo: memo.trim() || undefined,
    });

    let next: AppData = {
      ...data,
      stockEvents: [...(data.stockEvents ?? []), event],
    };

    if (type === "split" && ratio > 1) {
      if (!confirm(`${ratio}:1 분할을 매매 내역에 반영할까요? (해당일 이전 체결만 조정)`)) {
        onPersist(next);
        return;
      }
      next = {
        ...next,
        trades: applySplitToTrades(next.trades, event),
      };
    }

    onPersist(next);
    setMemo("");
  }

  function removeEvent(id: string) {
    if (!confirm("이 이벤트 기록을 삭제할까요? (분할 반영은 되돌리지 않습니다)")) return;
    onPersist({
      ...data,
      stockEvents: (data.stockEvents ?? []).filter((e) => e.id !== id),
    });
  }

  if (!activeStock) return null;

  return (
    <CollapsibleSection
      title={`기업 이벤트 — ${activeStock.name}`}
      subtitle="분할·배당 기록 (분할은 매매 수량·단가 자동 조정)"
      summary={<span className="text-sm text-ink-muted">{events.length}건</span>}
      defaultOpen={false}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["split", "dividend"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg px-3 py-1.5 text-sm ${type === t ? "bg-gain text-white" : "border border-line text-ink-muted"}`}
            >
              {t === "split" ? "주식분할" : "배당"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="text-xs text-ink-muted">
            일자
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-line px-2 py-1.5"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          {type === "split" ? (
            <label className="text-xs text-ink-muted">
              비율 (2 = 2:1)
              <input
                type="number"
                min={2}
                max={20}
                className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-right"
                value={ratio}
                onChange={(e) => setRatio(Number(e.target.value))}
              />
            </label>
          ) : (
            <label className="text-xs text-ink-muted">
              주당(원)
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-right"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </label>
          )}
          <label className="col-span-2 text-xs text-ink-muted sm:col-span-2">
            메모
            <input
              className="mt-1 w-full rounded-lg border border-line px-2 py-1.5"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="선택"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={addEvent}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          이벤트 추가
        </button>

        {events.length > 0 && (
          <ul className="space-y-2 text-sm">
            {events.map((e) => (
              <EventRow key={e.id} event={e} stock={activeStock} onRemove={() => removeEvent(e.id)} />
            ))}
          </ul>
        )}
      </div>
    </CollapsibleSection>
  );
}

function EventRow({
  event,
  stock,
  onRemove,
}: {
  event: StockEvent;
  stock: Stock;
  onRemove: () => void;
}) {
  const detail =
    event.type === "split"
      ? `${event.ratio}:1 분할`
      : `배당 ${event.amount != null ? fmt(event.amount) : "—"}원/주`;

  return (
    <li className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
      <span>
        <span className="font-medium text-ink">{event.date}</span>
        <span className="ml-2 text-ink-muted">{stock.name} · {detail}</span>
        {event.memo && <span className="ml-1 text-xs text-ink-muted">({event.memo})</span>}
      </span>
      <button type="button" onClick={onRemove} className="text-xs text-loss hover:underline">
        삭제
      </button>
    </li>
  );
}
