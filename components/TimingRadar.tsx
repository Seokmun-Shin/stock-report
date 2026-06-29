"use client";

import type { BuyTimingSignal, SellTimingSignal, StockSummary } from "@/lib/types";
import { fmt, fmtPct, fmtQty, fmtSigned } from "@/lib/calc";
import { STOCK_SETTLEMENT_HINTS, TIMING_HINTS } from "@/lib/metricHints";
import { FormattedNumberInput } from "./FormattedNumberInput";
import { HintTooltip, SectionTitle, StatCard, ZoneDivider } from "./StatCard";

function timingBadge(
  status: BuyTimingSignal["status"] | SellTimingSignal["status"],
  kind: "buy" | "sell"
) {
  if (status === "zone20") return kind === "buy" ? "bg-loss text-white" : "bg-gain text-white";
  if (status === "zone10") return "bg-amber-500 text-white";
  if (status === "above" || status === "below") return "bg-slate-600 text-white";
  return "bg-slate-400 text-white";
}

function priceBarPos(current: number, min: number, max: number) {
  const pos = max > min ? ((current - min) / (max - min)) * 100 : 50;
  return Math.min(100, Math.max(0, pos));
}

function BuyTimingBlock({ summary, signal }: { summary: StockSummary; signal: BuyTimingSignal }) {
  const { currentPrice, lastSellPrice, timing10, timing20 } = summary;
  const ref = lastSellPrice ?? currentPrice;
  const min = timing20 ?? ref * 0.75;
  const max = ref * 1.05;
  const clamped = priceBarPos(currentPrice, min, max);

  const rows: { label: string; hint?: string; value: string; tone?: "gain" | "loss" }[] = [];
  if (timing10 && timing20 && lastSellPrice) {
    rows.push(
      { label: "-20% 매수선", hint: TIMING_HINTS.timing20, value: fmt(timing20) },
      { label: "-10% 매수선", hint: TIMING_HINTS.timing10, value: fmt(timing10) },
      { label: "최근 매도가", hint: TIMING_HINTS.lastSellPrice, value: fmt(lastSellPrice) }
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-ink">매수 타이밍</h3>
        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${timingBadge(signal.status, "buy")}`}>
          {signal.label}
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">{signal.hint}</p>

      {timing10 && timing20 && lastSellPrice && (
        <div className="relative mt-3 h-2.5 shrink-0 rounded-full bg-gradient-to-r from-gain via-amber-300 to-slate-200">
          <div
            className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-ink shadow"
            style={{ left: `calc(${clamped}% - 8px)` }}
          />
        </div>
      )}

      <div className="mt-2 flex flex-col gap-1.5">
        {rows.map((row) => (
          <StatCard key={row.label} inline fill label={row.label} hint={row.hint} value={row.value} tone={row.tone} />
        ))}
      </div>
    </div>
  );
}

function SellTimingBlock({ summary, signal }: { summary: StockSummary; signal: SellTimingSignal }) {
  const { currentPrice, sellTiming10, sellTiming20, holdingAvgPrice, holdingQty } = summary;
  const min = holdingAvgPrice * 0.95;
  const max = (sellTiming20 ?? holdingAvgPrice) * 1.05;
  const clamped = priceBarPos(currentPrice, min, max);

  const rows: { label: string; hint?: string; value: string; tone?: "gain" | "loss" }[] = [];
  if (sellTiming10 && sellTiming20 && holdingQty > 0) {
    rows.push(
      { label: "+10% 매도선", hint: TIMING_HINTS.sellTiming10, value: fmt(sellTiming10) },
      { label: "+20% 매도선", hint: TIMING_HINTS.sellTiming20, value: fmt(sellTiming20) },
      { label: "평단", hint: TIMING_HINTS.holdingAvgPriceSell, value: fmt(holdingAvgPrice) }
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-ink">매도 타이밍</h3>
        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${timingBadge(signal.status, "sell")}`}>
          {signal.label}
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">{signal.hint}</p>

      {sellTiming10 && sellTiming20 && holdingQty > 0 && (
        <div className="relative mt-3 h-2.5 shrink-0 rounded-full bg-gradient-to-r from-slate-200 via-amber-300 to-gain">
          <div
            className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-ink shadow"
            style={{ left: `calc(${clamped}% - 8px)` }}
          />
        </div>
      )}

      <div className="mt-2 flex flex-col gap-1.5">
        {rows.map((row) => (
          <StatCard key={row.label} inline fill label={row.label} hint={row.hint} value={row.value} tone={row.tone} />
        ))}
      </div>
    </div>
  );
}

export function TimingRadar({
  summary,
  buySignal,
  sellSignal,
  onPriceChange,
}: {
  summary: StockSummary;
  buySignal: BuyTimingSignal;
  sellSignal: SellTimingSignal;
  onPriceChange: (price: number) => void;
}) {
  const holdingRows: { label: string; hint?: string; value: string; tone?: "gain" | "loss" }[] = [];
  if (summary.holdingQty > 0) {
    holdingRows.push(
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
      <SectionTitle unit>매매 타이밍</SectionTitle>

      <div className="mt-3">
        <label className="inline-flex items-center text-sm font-semibold text-slate-700">
          현재가
          <HintTooltip text={TIMING_HINTS.currentPrice} />
        </label>
        <FormattedNumberInput
          value={summary.currentPrice}
          onChange={onPriceChange}
          className="mt-1.5 w-full rounded-lg border border-line bg-surface-dim px-3 py-2.5 text-right text-lg font-bold tabular-nums text-ink outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="0"
        />
      </div>

      {holdingRows.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {holdingRows.map((row) => (
            <StatCard key={row.label} inline fill label={row.label} hint={row.hint} value={row.value} tone={row.tone} />
          ))}
        </div>
      )}

      <div className="mt-4">
        <BuyTimingBlock summary={summary} signal={buySignal} />
      </div>

      <ZoneDivider label="매도" />

      <div className="mt-1">
        <SellTimingBlock summary={summary} signal={sellSignal} />
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
