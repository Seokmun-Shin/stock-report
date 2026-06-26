"use client";

import type { TimingSignal } from "@/lib/types";
import { fmt, fmtPct, fmtQty, fmtSigned } from "@/lib/calc";
import type { StockSummary } from "@/lib/types";
import { STOCK_SETTLEMENT_HINTS, TIMING_HINTS } from "@/lib/metricHints";
import { FormattedNumberInput } from "./FormattedNumberInput";
import { HintTooltip, SectionTitle, StatCard } from "./StatCard";

export function TimingRadar({
  summary,
  signal,
  onPriceChange,
}: {
  summary: StockSummary;
  signal: TimingSignal;
  onPriceChange: (price: number) => void;
}) {
  const { currentPrice, lastSellPrice, timing10, timing20 } = summary;
  const ref = lastSellPrice ?? currentPrice;
  const min = timing20 ?? ref * 0.75;
  const max = ref * 1.05;
  const pos = max > min ? ((currentPrice - min) / (max - min)) * 100 : 50;
  const clamped = Math.min(100, Math.max(0, pos));

  const badge =
    signal.status === "zone20"
      ? "bg-loss text-white"
      : signal.status === "zone10"
        ? "bg-amber-500 text-white"
        : signal.status === "above"
          ? "bg-slate-600 text-white"
          : "bg-slate-400 text-white";

  const extraRows: { label: string; hint?: string; value: string; tone?: "gain" | "loss" }[] = [];
  if (timing10 && timing20 && lastSellPrice) {
    extraRows.push(
      { label: "-20% 매수선", hint: TIMING_HINTS.timing20, value: fmt(timing20) },
      { label: "-10% 매수선", hint: TIMING_HINTS.timing10, value: fmt(timing10) },
      { label: "최근 매도가", hint: TIMING_HINTS.lastSellPrice, value: fmt(lastSellPrice) }
    );
  }
  if (summary.holdingQty > 0) {
    extraRows.push(
      { label: "보유", hint: TIMING_HINTS.holdingQty, value: `${fmtQty(summary.holdingQty)}주` },
      { label: "평단", hint: TIMING_HINTS.holdingAvgPrice, value: fmt(summary.holdingAvgPrice) },
      {
        label: "평가손익",
        hint: TIMING_HINTS.unrealizedPnl,
        value: fmtSigned(summary.unrealizedPnl),
        tone: summary.unrealizedPnl >= 0 ? "gain" : "loss",
      }
    );
  }

  return (
    <section className="flex h-full min-h-[300px] flex-col rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle unit>매매 타이밍</SectionTitle>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}>{signal.label}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs text-ink-muted">{signal.hint}</p>

      <div className="mt-3">
        <label className="inline-flex items-center text-xs font-semibold text-slate-700">
          현재가
          <HintTooltip text={TIMING_HINTS.currentPrice} />
        </label>
        <FormattedNumberInput
          value={currentPrice}
          onChange={onPriceChange}
          className="mt-1 w-full rounded-lg border border-line bg-surface-dim px-3 py-2 text-right text-base font-bold tabular-nums text-ink outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="0"
        />
      </div>

      {timing10 && timing20 && lastSellPrice && (
        <div className="relative mt-4 h-2 shrink-0 rounded-full bg-gradient-to-r from-gain via-amber-300 to-slate-200">
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-ink shadow"
            style={{ left: `calc(${clamped}% - 7px)` }}
          />
        </div>
      )}

      <div className="mt-2 flex flex-1 flex-col gap-1.5">
        {extraRows.map((row) => (
          <StatCard key={row.label} inline fill label={row.label} hint={row.hint} value={row.value} tone={row.tone} />
        ))}
      </div>
    </section>
  );
}

export function StockSettlement({ stockName, summary }: { stockName: string; summary: StockSummary }) {
  const rows: { label: string; hint: string; value: string; tone?: "gain" | "loss" }[] = [
    { label: "매수", hint: STOCK_SETTLEMENT_HINTS.buyAmount, value: fmt(summary.buyAmount) },
    { label: "매도", hint: STOCK_SETTLEMENT_HINTS.sellAmount, value: fmt(summary.sellAmount) },
    { label: "비용", hint: STOCK_SETTLEMENT_HINTS.tradeCost, value: fmt(summary.tradeCost) },
    { label: "순수익", hint: STOCK_SETTLEMENT_HINTS.netProfit, value: fmt(summary.netProfit), tone: summary.netProfit >= 0 ? "gain" : "loss" },
    { label: "수익률", hint: STOCK_SETTLEMENT_HINTS.returnRate, value: fmtPct(summary.returnRate), tone: summary.returnRate >= 0 ? "gain" : "loss" },
    { label: "보유", hint: STOCK_SETTLEMENT_HINTS.holdingQty, value: summary.holdingQty > 0 ? `${fmtQty(summary.holdingQty)}주` : "없음" },
  ];

  return (
    <section className="flex h-full min-h-[300px] flex-col rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <SectionTitle unit>{stockName} 정산</SectionTitle>
      <div className="mt-3 flex flex-1 flex-col gap-1.5">
        {rows.map((row) => (
          <StatCard key={row.label} inline fill label={row.label} hint={row.hint} value={row.value} tone={row.tone} />
        ))}
      </div>
    </section>
  );
}
