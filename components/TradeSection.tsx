"use client";

import { useEffect, useState } from "react";
import type { Trade, TradeType } from "@/lib/types";
import { compareTradesByDateDesc, fmt, fmtQty, tradeAmount, tradeCost } from "@/lib/calc";
import { FormattedNumberInput } from "./FormattedNumberInput";
import { SectionTitle } from "./StatCard";

type TradeInput = Omit<Trade, "id" | "stockId" | "createdAt">;

const inputCls =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-right text-base tabular-nums outline-none focus:ring-2 focus:ring-blue-200";

const DEFAULT_VISIBLE = 5;

export function TradeTable({
  trades,
  stockName,
  initialCapitalIds,
  onToggleCapital,
  onEdit,
  onDelete,
}: {
  trades: Trade[];
  stockName: string;
  initialCapitalIds: Set<string>;
  onToggleCapital: (tradeId: string) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (tradeId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...trades].sort(compareTradesByDateDesc);

  useEffect(() => {
    setExpanded(false);
  }, [stockName]);

  const hasMore = sorted.length > DEFAULT_VISIBLE;
  const visible = expanded || !hasMore ? sorted : sorted.slice(0, DEFAULT_VISIBLE);

  if (sorted.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-surface-dim/50 p-8 text-center text-sm text-ink-muted">
        아직 매매 내역이 없습니다.
        <br />
        <span className="mt-1 inline-block text-ink">우측 상단 「+ 매매 내역 추가」</span>를 눌러 체결 내역을 입력해 주세요.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="min-w-0 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[640px] text-sm sm:text-base">
          <thead className="bg-surface-dim text-sm text-ink-muted">
            <tr>
              <th className="px-3 py-3 text-center">기준</th>
              <th className="px-3 py-3 text-center">구분</th>
              <th className="px-3 py-3 text-center">날짜</th>
              <th className="px-3 py-3 text-right">수량</th>
              <th className="px-3 py-3 text-right">단가</th>
              <th className="px-3 py-3 text-right">금액</th>
              <th className="px-3 py-3 text-right">비용</th>
              <th className="px-3 py-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => {
              const isCapital = initialCapitalIds.has(t.id);
              return (
                <tr key={t.id} className={`border-t border-line ${isCapital ? "bg-amber-50/60" : ""}`}>
                  <td className="px-3 py-2.5 text-center">
                    {t.type === "buy" ? (
                      <button
                        type="button"
                        onClick={() => onToggleCapital(t.id)}
                        className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                          isCapital ? "bg-amber-500 text-white" : "border border-line bg-white text-ink-muted"
                        }`}
                      >
                        {isCapital ? "★" : "기준"}
                      </button>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${t.type === "buy" ? "bg-gain-soft text-gain" : "bg-loss-soft text-loss"}`}>
                      {t.type === "buy" ? "매수" : "매도"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-ink">{t.date}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtQty(t.quantity)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmt(t.price)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmt(tradeAmount(t))}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink-muted">{fmt(tradeCost(t))}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button type="button" onClick={() => onEdit(t)} className="px-1.5 text-xs text-gain hover:underline">
                      수정
                    </button>
                    <span className="text-ink-muted">|</span>
                    <button type="button" onClick={() => onDelete(t.id)} className="px-1.5 text-xs text-loss hover:underline">
                      삭제
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="border-t border-line bg-surface-dim px-4 py-2 text-center text-xs text-ink-muted">
          {stockName} · 총 {sorted.length}건 · 최신순
        </p>
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full rounded-lg border border-line bg-white py-2 text-sm text-ink-muted hover:bg-surface-dim"
        >
          {expanded ? "접기" : `더보기 (${sorted.length - DEFAULT_VISIBLE}건)`}
        </button>
      )}
    </div>
  );
}

export function TradeForm({
  onSubmit,
  editing,
  onCancel,
}: {
  onSubmit: (t: TradeInput) => void;
  editing?: Trade | null;
  onCancel: () => void;
}) {
  const [type, setType] = useState<TradeType>("buy");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [fee, setFee] = useState(0);
  const [tax, setTax] = useState(0);

  const isEditing = !!editing;

  useEffect(() => {
    if (editing) {
      setType(editing.type);
      setDate(editing.date);
      setQuantity(editing.quantity);
      setPrice(editing.price);
      setFee(editing.fee);
      setTax(editing.tax);
    } else {
      setType("buy");
      setDate(new Date().toISOString().slice(0, 10));
      setQuantity(0);
      setPrice(0);
      setFee(0);
      setTax(0);
    }
  }, [editing]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (quantity <= 0 || price <= 0) return;
    onSubmit({ type, date, quantity, price, fee, tax: type === "sell" ? tax : 0 });
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-gain/30 bg-gain-soft/30 p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{isEditing ? "매매 수정" : "매매 내역 입력"}</p>
        <span className="text-xs text-ink-muted">(단위 : 원)</span>
      </div>

      <div className="mb-3 flex gap-2">
        {(["buy", "sell"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium ${
              type === t ? (t === "buy" ? "bg-gain text-white" : "bg-loss text-white") : "border border-line bg-white text-ink-muted"
            }`}
          >
            {t === "buy" ? "매수" : "매도"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="text-xs text-ink-muted">
          날짜
          <input type="date" className={`${inputCls} text-center`} value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="text-xs text-ink-muted">
          수량
          <FormattedNumberInput value={quantity} onChange={setQuantity} className={inputCls} placeholder="0" />
        </label>
        <label className="text-xs text-ink-muted">
          단가
          <FormattedNumberInput value={price} onChange={setPrice} className={inputCls} placeholder="0" />
        </label>
        <label className="text-xs text-ink-muted">
          수수료
          <FormattedNumberInput value={fee} onChange={setFee} className={inputCls} placeholder="0" />
        </label>
        {type === "sell" && (
          <label className="text-xs text-ink-muted">
            세금
            <FormattedNumberInput value={tax} onChange={setTax} className={inputCls} placeholder="0" />
          </label>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-line bg-white px-4 py-1.5 text-sm text-ink-muted hover:bg-surface-dim">
          취소
        </button>
        <button type="submit" className="rounded-lg bg-ink px-5 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
          {isEditing ? "수정" : "저장"}
        </button>
      </div>
    </form>
  );
}

export function TradeHistorySection({
  stockName,
  trades,
  initialCapitalIds,
  editing,
  onSubmit,
  onToggleCapital,
  onEdit,
  onDelete,
  onCancelEdit,
}: {
  stockName: string;
  trades: Trade[];
  initialCapitalIds: Set<string>;
  editing: Trade | null;
  onSubmit: (t: TradeInput) => void;
  onToggleCapital: (tradeId: string) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (tradeId: string) => void;
  onCancelEdit: () => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const showForm = formOpen || !!editing;

  useEffect(() => {
    setFormOpen(false);
  }, [stockName]);

  useEffect(() => {
    if (editing) setFormOpen(true);
  }, [editing]);

  function closeForm() {
    setFormOpen(false);
    onCancelEdit();
  }

  function handleSubmit(t: TradeInput) {
    onSubmit(t);
    setFormOpen(false);
  }

  return (
    <section className="min-w-0 space-y-3 border-t border-line pt-4 sm:pt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <SectionTitle>
            매매 내역 — {stockName}
            <span className="ml-1.5 text-xs font-normal text-ink-muted">({trades.length}건)</span>
          </SectionTitle>
          <p className="mt-1 text-xs text-ink-muted">최신순 · 매수 「★」= 초기 투자금 · 표에서 수정/삭제</p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="w-full shrink-0 rounded-lg bg-gain px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 sm:w-auto"
          >
            + 매매 내역 추가
          </button>
        )}
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-relaxed text-slate-700">
        <strong className="text-ink">증권 앱 체결 내역을 입력하세요.</strong> 날짜·매수/매도·수량·단가·수수료(매도 시 세금)를
        등록하면 위 타이밍·정산·전체 요약이 자동으로 갱신됩니다.
      </div>

      {showForm && (
        <TradeForm
          editing={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      )}

      <TradeTable
        trades={trades}
        stockName={stockName}
        initialCapitalIds={initialCapitalIds}
        onToggleCapital={onToggleCapital}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </section>
  );
}
