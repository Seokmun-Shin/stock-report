"use client";

import { useEffect, useState } from "react";
import type { Trade, TradeType } from "@/lib/types";
import { compareTradesByDateDesc, computeRealizedPnlByTrade, fmt, fmtQty, fmtSigned, tradeAmount, tradeCost } from "@/lib/calc";
import { calcBuyFees, calcSellFees, calcSellTaxes } from "@/lib/tradeFees";
import type { ReportSettings } from "@/lib/reportSettings";
import {
  buyFeeRateFromSettings,
  formatFeePct,
  resolveReportSettings,
  sellFeeRateFromSettings,
  sellTaxRateFromSettings,
} from "@/lib/reportSettings";
import type { TradeSuggestion } from "@/lib/briefing/tradeSuggestions";
import { FormattedNumberInput } from "@/components/FormattedNumberInput";
import { SectionCollapseToggle } from "@/components/CollapsibleSection";
import { insetCard, panelShell, UI, HeaderActionButton, AreaSectionTitle } from "@/components/ui/PanelCard";

type TradeInput = Omit<Trade, "id" | "stockId" | "createdAt">;

const inputCls = UI.input;

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
  const [expanded, setExpanded] = useState(true);
  const sorted = [...trades].sort(compareTradesByDateDesc);
  const realizedById = computeRealizedPnlByTrade(trades);

  useEffect(() => {
    setExpanded(true);
  }, [stockName]);

  const hasMore = sorted.length > DEFAULT_VISIBLE;
  const visible = expanded || !hasMore ? sorted : sorted.slice(0, DEFAULT_VISIBLE);

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-surface-dim/50 p-8 text-center text-sm text-ink-muted">
        아직 매매 내역이 없습니다.
        <br />
        <span className="mt-1 inline-block text-ink">위 「+ 체결 내역 입력」</span>을 눌러 체결 내역을 입력해 주세요.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="space-y-2 lg:hidden">
        {visible.map((t) => {
          const isCapital = initialCapitalIds.has(t.id);
          const realized = realizedById[t.id];
          return (
            <div
              key={t.id}
              className={`rounded-xl border border-line p-3 text-sm ${isCapital ? "border-amber-200 bg-amber-50/50" : "bg-white"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${t.type === "buy" ? "bg-gain-soft text-gain" : "bg-loss-soft text-loss"}`}>
                  {t.type === "buy" ? "매수" : "매도"}
                </span>
                <span className="tabular-nums text-ink-muted">{t.executedTime ? `${t.date} ${t.executedTime}` : t.date}</span>
              </div>
              <p className="mt-2 tabular-nums">
                {fmtQty(t.quantity)}주 × {fmt(t.price)} = <strong>{fmt(tradeAmount(t))}</strong>
              </p>
              {t.type === "sell" && (
                <p className={`mt-1 text-xs font-semibold tabular-nums ${realized >= 0 ? "text-gain" : "text-loss"}`}>
                  실현 {fmtSigned(realized ?? 0)}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {t.type === "buy" && (
                  <button
                    type="button"
                    onClick={() => onToggleCapital(t.id)}
                    title={isCapital ? "기준 매수" : "기준으로 지정"}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold ${
                      isCapital ? "bg-amber-500 text-white" : "border border-line"
                    }`}
                  >
                    {isCapital ? "★" : "○"}
                  </button>
                )}
                <HeaderActionButton onClick={() => onEdit(t)} className="px-2 py-0.5">
                  수정
                </HeaderActionButton>
                <HeaderActionButton variant="danger" onClick={() => onDelete(t.id)} className="px-2 py-0.5">
                  삭제
                </HeaderActionButton>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`hidden min-w-0 lg:block ${UI.dataTableWrap}`}>
        <table className={`${UI.dataTable} min-w-[42rem]`}>
          <thead className="bg-surface-dim text-xs text-ink-muted">
            <tr>
              <th className={`${UI.dataTh} w-14 text-center`}>기준</th>
              <th className={`${UI.dataTh} w-16 text-center`}>구분</th>
              <th className={`${UI.dataTh} text-left`}>일시</th>
              <th className={`${UI.dataTh} text-right`}>수량</th>
              <th className={`${UI.dataTh} text-right`}>단가</th>
              <th className={`${UI.dataTh} text-right`}>금액</th>
              <th className={`${UI.dataTh} text-right`}>비용</th>
              <th className={`${UI.dataTh} text-right`}>실현손익</th>
              <th className={`${UI.dataTh} text-center`}>관리</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => {
              const isCapital = initialCapitalIds.has(t.id);
              return (
                <tr key={t.id} className={`border-t border-line ${isCapital ? "bg-amber-50/60" : ""}`}>
                  <td className={`${UI.dataTd} text-center`}>
                    {t.type === "buy" ? (
                      <button
                        type="button"
                        onClick={() => onToggleCapital(t.id)}
                        title={isCapital ? "기준 매수" : "기준으로 지정"}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold ${
                          isCapital ? "bg-amber-500 text-white" : "border border-line bg-white text-ink-muted"
                        }`}
                      >
                        {isCapital ? "★" : "○"}
                      </button>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className={`${UI.dataTd} text-center`}>
                    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${t.type === "buy" ? "bg-gain-soft text-gain" : "bg-loss-soft text-loss"}`}>
                      {t.type === "buy" ? "매수" : "매도"}
                    </span>
                  </td>
                  <td className={`${UI.dataTd} text-left text-ink`}>
                    {t.executedTime ? `${t.date} ${t.executedTime}` : t.date}
                  </td>
                  <td className={`${UI.dataTd} text-right`}>{fmtQty(t.quantity)}</td>
                  <td className={`${UI.dataTd} text-right`}>{fmt(t.price)}</td>
                  <td className={`${UI.dataTd} text-right`}>{fmt(tradeAmount(t))}</td>
                  <td className={`${UI.dataTd} text-right text-ink-muted`}>{fmt(tradeCost(t))}</td>
                  <td className={`${UI.dataTd} text-right font-medium ${t.type === "sell" ? (realizedById[t.id] >= 0 ? "text-gain" : "text-loss") : "text-ink-muted"}`}>
                    {t.type === "sell" ? fmtSigned(realizedById[t.id] ?? 0) : "—"}
                  </td>
                  <td className={`${UI.dataTd} text-center`}>
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <HeaderActionButton onClick={() => onEdit(t)} className="px-2 py-0.5">
                        수정
                      </HeaderActionButton>
                      <HeaderActionButton variant="danger" onClick={() => onDelete(t.id)} className="px-2 py-0.5">
                        삭제
                      </HeaderActionButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="border-t border-line bg-surface-dim px-3 py-1.5 text-center text-xs text-ink-muted">
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
  suggestion,
  reportSettings,
}: {
  onSubmit: (t: TradeInput) => void;
  editing?: Trade | null;
  onCancel: () => void;
  suggestion?: TradeSuggestion | null;
  reportSettings?: Partial<ReportSettings>;
}) {
  const [type, setType] = useState<TradeType>("buy");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [executedTime, setExecutedTime] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [fee, setFee] = useState(0);
  const [transactionTax, setTransactionTax] = useState(0);
  const [ruralTax, setRuralTax] = useState(0);

  const isEditing = !!editing;
  const orderAmount = quantity * price;
  const resolvedFees = resolveReportSettings(reportSettings);
  const buyFeeRate = buyFeeRateFromSettings(reportSettings);
  const sellFeeRate = sellFeeRateFromSettings(reportSettings);
  const sellTaxRate = sellTaxRateFromSettings(reportSettings);
  const feeLabel =
    type === "buy" ? formatFeePct(resolvedFees.buyTotalFeePct!) : formatFeePct(resolvedFees.sellTotalFeePct!);
  const taxLabel = formatFeePct(resolvedFees.sellTransactionTaxPct!);

  useEffect(() => {
    if (editing) {
      setType(editing.type);
      setDate(editing.date);
      setExecutedTime(editing.executedTime ?? "");
      setQuantity(editing.quantity);
      setPrice(editing.price);
      setFee(editing.fee);
      if (editing.type === "sell") {
        if (editing.transactionTax != null || editing.ruralTax != null) {
          setTransactionTax(editing.transactionTax ?? 0);
          setRuralTax(editing.ruralTax ?? 0);
        } else {
          setTransactionTax(editing.tax);
          setRuralTax(0);
        }
      } else {
        setTransactionTax(0);
        setRuralTax(0);
      }
    } else {
      setType("buy");
      setDate(new Date().toISOString().slice(0, 10));
      setExecutedTime("");
      setQuantity(0);
      setPrice(0);
      setFee(0);
      setTransactionTax(0);
      setRuralTax(0);
    }
  }, [editing]);

  function selectType(next: TradeType) {
    setType(next);
    if (next === "buy") {
      setTransactionTax(0);
      setRuralTax(0);
    }
  }

  function applySuggestion(s: TradeSuggestion) {
    setDate(s.date);
    setExecutedTime(s.executedTime);
    setQuantity(s.quantity);
    setPrice(s.price);
    setFee(s.fee);
    if (type === "sell") {
      setTransactionTax(s.transactionTax);
      setRuralTax(s.ruralTax);
    } else {
      setTransactionTax(0);
      setRuralTax(0);
    }
  }

  const canApplyReference =
    !!suggestion &&
    suggestion.alignedWithVerdict &&
    suggestion.recommendedAction !== "hold" &&
    suggestion.recommendedAction === type &&
    suggestion.quantity > 0 &&
    suggestion.price > 0;

  function applyFeePreset() {
    if (orderAmount <= 0) return;
    setFee(
      type === "buy" ? calcBuyFees(orderAmount, buyFeeRate) : calcSellFees(orderAmount, sellFeeRate)
    );
  }

  function applySellTaxPreset() {
    if (orderAmount <= 0) return;
    const { transactionTax: tt, ruralTax: rt } = calcSellTaxes(orderAmount, { taxRate: sellTaxRate });
    setTransactionTax(tt);
    setRuralTax(rt);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (quantity <= 0 || price <= 0) return;
    const taxTotal = type === "sell" ? transactionTax + ruralTax : 0;
    onSubmit({
      type,
      date,
      executedTime: executedTime.trim() || undefined,
      quantity,
      price,
      fee,
      tax: taxTotal,
      transactionTax: type === "sell" ? transactionTax : undefined,
      ruralTax: type === "sell" ? ruralTax : undefined,
    });
  }

  return (
    <form onSubmit={submit} className={`${panelShell} p-3 sm:p-5`}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <AreaSectionTitle as="p">{isEditing ? "매매 수정" : "체결 내역 입력"}</AreaSectionTitle>
        <span className="text-xs text-ink-muted">(단위 : 원)</span>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-ink-muted">
        증권사에서 체결한 <strong className="font-medium text-ink">매수/매도</strong>를 고른 뒤, 확인서 기준으로 수량·단가를 입력하세요.
      </p>

      <div className="mb-3 flex gap-2">
        {(["buy", "sell"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => selectType(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium ${
              type === t ? (t === "buy" ? "bg-gain text-white" : "bg-loss text-white") : "border border-line bg-white text-ink-muted"
            }`}
          >
            {t === "buy" ? "매수 체결" : "매도 체결"}
          </button>
        ))}
      </div>

      {!isEditing && suggestion && suggestion.rationale.length > 0 && (
        <div className={`mb-3 ${insetCard} leading-relaxed`}>
          <p className="font-semibold text-ink">판단 참고 (자동 입력 없음)</p>
          <ul className="mt-1 list-inside list-disc">
            {suggestion.rationale.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          {suggestion.alignedWithVerdict && suggestion.recommendedAction !== "hold" && (
            <p className="mt-2 text-ink-muted">
              판단: <strong className="text-ink">{suggestion.recommendedAction === "buy" ? "매수" : "매도"}</strong>{" "}
              참고 — 체결과 다르면 아래에 실제 값을 입력하세요.
            </p>
          )}
          {canApplyReference && (
            <button
              type="button"
              onClick={() => suggestion && applySuggestion(suggestion)}
              className="mt-2 rounded-md border border-line bg-white px-2 py-1 text-xs font-medium text-ink-muted hover:bg-surface-dim"
            >
              {type === "buy" ? "매수" : "매도"} 참고값만 넣기 (선택)
            </button>
          )}
          {suggestion.alignedWithVerdict &&
            suggestion.recommendedAction !== "hold" &&
            suggestion.recommendedAction !== type && (
              <p className="mt-2 text-amber-800">
                판단은 {suggestion.recommendedAction === "buy" ? "매수" : "매도"} 쪽입니다. 다른 체결을 기록 중이면 참고값은 쓰지 마세요.
              </p>
            )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="text-xs text-ink-muted">
          날짜
          <input type="date" className={`${inputCls} text-center`} value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="text-xs text-ink-muted">
          체결시각
          <input
            type="time"
            className={`${inputCls} text-center`}
            value={executedTime}
            onChange={(e) => setExecutedTime(e.target.value)}
            title="같은 날 여러 체결 시 FIFO 순서"
          />
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
          <span className="flex items-center justify-between gap-1">
            수수료
            <button type="button" onClick={applyFeePreset} className="text-[10px] font-medium text-gain hover:underline">
              {feeLabel} 적용
            </button>
          </span>
          <FormattedNumberInput value={fee} onChange={setFee} className={inputCls} placeholder="0" />
        </label>
        {type === "sell" && (
          <>
            <label className="text-xs text-ink-muted">
              <span className="flex items-center justify-between gap-1">
                증권거래세
                <button type="button" onClick={applySellTaxPreset} className="text-[10px] font-medium text-gain hover:underline">
                  {taxLabel} 적용
                </button>
              </span>
              <FormattedNumberInput value={transactionTax} onChange={setTransactionTax} className={inputCls} placeholder="0" />
            </label>
            {(isEditing && ruralTax > 0) && (
              <label className="text-xs text-ink-muted">
                농특세 (과거 기록)
                <FormattedNumberInput value={ruralTax} onChange={setRuralTax} className={inputCls} placeholder="0" />
              </label>
            )}
            <p className="col-span-2 text-xs text-ink-muted sm:col-span-3">
              매도 세금 합계: {fmt(transactionTax + ruralTax)}원 ({taxLabel} 증권거래세 참고 · 매수 시 세금 없음)
            </p>
          </>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-line bg-white px-4 py-1.5 text-sm text-ink-muted hover:bg-surface-dim">
          취소
        </button>
        <button type="submit" className={`${UI.btnPrimary} px-5 py-1.5 text-sm`}>
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
  suggestion,
  formOpen: formOpenProp,
  onFormOpenChange,
  hideHeaderAction,
  reportSettings,
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
  suggestion?: TradeSuggestion | null;
  formOpen?: boolean;
  onFormOpenChange?: (open: boolean) => void;
  hideHeaderAction?: boolean;
  reportSettings?: Partial<ReportSettings>;
}) {
  const [formOpenLocal, setFormOpenLocal] = useState(false);
  const [listOpen, setListOpen] = useState(true);
  const formOpen = formOpenProp ?? formOpenLocal;
  const setFormOpen = onFormOpenChange ?? setFormOpenLocal;
  const showForm = formOpen || !!editing;

  useEffect(() => {
    if (onFormOpenChange) onFormOpenChange(false);
    else setFormOpenLocal(false);
    setListOpen(true);
  }, [stockName, onFormOpenChange]);

  useEffect(() => {
    if (editing) setFormOpen(true);
  }, [editing, setFormOpen]);

  function closeForm() {
    setFormOpen(false);
    onCancelEdit();
  }

  function handleSubmit(t: TradeInput) {
    onSubmit(t);
    setFormOpen(false);
  }

  return (
    <section className="min-w-0 space-y-3">
      {showForm ? (
        <TradeForm
          editing={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          suggestion={suggestion}
          reportSettings={reportSettings}
        />
      ) : (
        !hideHeaderAction && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="w-full rounded-lg border border-dashed border-line py-2.5 text-sm text-ink-muted hover:border-gain hover:text-gain"
          >
            + 체결 내역 입력
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => setListOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-lg border border-line/80 bg-surface-dim/50 px-3 py-2 text-left"
      >
        <span className="min-w-0 flex-1 text-sm">
          매매 기록 <span className="text-ink-muted">({trades.length}건)</span>
        </span>
        <SectionCollapseToggle open={listOpen} />
      </button>

      {listOpen && (
        <TradeTable
          trades={trades}
          stockName={stockName}
          initialCapitalIds={initialCapitalIds}
          onToggleCapital={onToggleCapital}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </section>
  );
}
