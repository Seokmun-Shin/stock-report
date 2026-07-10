"use client";

import { useState } from "react";
import type { AppData, Stock, StockEvent } from "@/lib/types";
import { applySplitToTrades, createStockEvent } from "@/lib/stockEvents";
import { fmt } from "@/lib/calc";
import { CollapsibleSection } from "./CollapsibleSection";
import { BtnCreate, BtnDelete, BtnTextAction, listDivide, pickDetailZone, SegmentTab, UI, DetailZoneLabel } from "./ui/PanelCard";

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
      subtitle="DART 공시에서 분할·배당 자동 등록 · 분할 매매 반영은 「매매에 반영」 버튼"
      summary={<span className="text-sm text-zinc-300">{events.length}건</span>}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["split", "dividend"] as const).map((t) => (
            <SegmentTab key={t} active={type === t} size="lg" onClick={() => setType(t)}>
              {t === "split" ? "주식분할" : "배당"}
            </SegmentTab>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="text-xs text-zinc-300">
            일자
            <input
              type="date"
              className={`${UI.input} text-left`}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          {type === "split" ? (
            <label className="text-xs text-zinc-300">
              비율 (2 = 2:1)
              <input
                type="number"
                min={2}
                max={20}
                className={UI.input}
                value={ratio}
                onChange={(e) => setRatio(Number(e.target.value))}
              />
            </label>
          ) : (
            <label className="text-xs text-zinc-300">
              주당(원)
              <input
                type="number"
                min={0}
                className={UI.input}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </label>
          )}
          <label className="col-span-2 text-xs text-zinc-300 sm:col-span-2">
            메모
            <input
              className={`${UI.input} text-left tabular-nums`}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="선택"
            />
          </label>
        </div>

        <BtnCreate type="button" onClick={addEvent} className="px-4 py-2 text-sm font-medium">
          이벤트 추가
        </BtnCreate>

        {events.length > 0 && (
          <section className={pickDetailZone} aria-label="등록된 이벤트">
            <DetailZoneLabel>등록 내역</DetailZoneLabel>
            <ul className={`text-sm ${listDivide}`}>
            {events.map((e) => (
              <EventRow
                key={e.id}
                event={e}
                stock={activeStock}
                onRemove={() => removeEvent(e.id)}
                onApplySplit={
                  e.type === "split" && e.ratio && e.ratio > 1
                    ? () => {
                        if (
                          !confirm(
                            `${e.ratio}:1 분할을 매매 내역에 반영할까요? (${e.date} 이전 체결만 조정)`
                          )
                        )
                          return;
                        onPersist({
                          ...data,
                          trades: applySplitToTrades(data.trades, e),
                        });
                      }
                    : undefined
                }
              />
            ))}
            </ul>
          </section>
        )}
      </div>
    </CollapsibleSection>
  );
}

function EventRow({
  event,
  stock,
  onRemove,
  onApplySplit,
}: {
  event: StockEvent;
  stock: Stock;
  onRemove: () => void;
  onApplySplit?: () => void;
}) {
  const detail =
    event.type === "split"
      ? event.ratio
        ? `${event.ratio}:1 분할`
        : "분할(공시에서 비율 확인 필요)"
      : `배당 ${event.amount != null ? fmt(event.amount) : "금액 미상"}원/주`;

  return (
    <li className="flex items-center justify-between py-3">
      <span>
        <span className="font-medium text-white">{event.date}</span>
        <span className="ml-2 text-zinc-300">{stock.name} · {detail}</span>
        {event.memo && <span className="ml-1 text-xs text-zinc-300">({event.memo})</span>}
      </span>
      <span className="flex items-center gap-2">
        {onApplySplit && (
          <BtnTextAction type="button" onClick={onApplySplit} className="text-xs font-medium">
            매매 반영
          </BtnTextAction>
        )}
        <BtnDelete type="button" onClick={onRemove} className="text-xs" />
      </span>
    </li>
  );
}
