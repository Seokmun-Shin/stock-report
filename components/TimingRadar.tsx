"use client";

import type { BuyTimingSignal, SellTimingSignal, StockSummary } from "@/lib/types";
import { fmt, fmtPct, fmtQty, fmtSigned } from "@/lib/calc";
import { STOCK_SETTLEMENT_HINTS, TIMING_HINTS } from "@/lib/metricHints";
import { FormattedNumberInput } from "./FormattedNumberInput";
import { HintTooltip, SectionTitle, StatCard } from "./StatCard";
import { formatKisUpdatedTime, isKrxMarketOpen } from "@/hooks/useKisPrices";

function buildKisStatusText(
  stockCode: string | undefined,
  lastUpdated: Date | null,
  autoRefresh: boolean
) {
  const marketOpen = isKrxMarketOpen();
  return [
    "KIS",
    stockCode ?? "코드 없음",
    lastUpdated ? `${formatKisUpdatedTime(lastUpdated)} 갱신` : null,
    autoRefresh ? (marketOpen ? "1분 자동" : "장 마감") : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function KisPriceToolbar({
  loading,
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
  stockCode,
}: {
  loading: boolean;
  autoRefresh: boolean;
  onAutoRefreshChange: (v: boolean) => void;
  onRefresh: () => void;
  stockCode?: string;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(e) => onAutoRefreshChange(e.target.checked)}
          className="rounded border-line"
        />
        1분 자동
      </label>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading || !stockCode}
        className="w-full shrink-0 rounded-lg bg-gain px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
      >
        {loading ? "조회 중…" : "현재가 새로고침"}
      </button>
    </div>
  );
}

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

function BuyTimingHeader({ summary, signal }: { summary: StockSummary; signal: BuyTimingSignal }) {
  const { currentPrice, lastSellPrice, timing10, timing20 } = summary;
  const ref = lastSellPrice ?? currentPrice;
  const min = timing20 ?? ref * 0.75;
  const max = ref * 1.05;
  const clamped = priceBarPos(currentPrice, min, max);

  return (
    <>
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
    </>
  );
}

type TimingCardRow = { label: string; hint?: string; value: string; tone?: "gain" | "loss" };

function getBuyTimingRows(summary: StockSummary): TimingCardRow[] {
  const { timing10, timing20, lastSellPrice } = summary;
  if (!timing10 || !timing20 || !lastSellPrice) return [];
  return [
    { label: "-20% 매수선", hint: TIMING_HINTS.timing20, value: fmt(timing20) },
    { label: "-10% 매수선", hint: TIMING_HINTS.timing10, value: fmt(timing10) },
    { label: "최근 매도가", hint: TIMING_HINTS.lastSellPrice, value: fmt(lastSellPrice) },
  ];
}

function getSellTimingRows(summary: StockSummary): TimingCardRow[] {
  const { sellTiming10, sellTiming20, holdingAvgPrice, holdingQty } = summary;
  if (!sellTiming10 || !sellTiming20 || holdingQty <= 0) return [];
  return [
    { label: "+10% 매도선", hint: TIMING_HINTS.sellTiming10, value: fmt(sellTiming10) },
    { label: "+20% 매도선", hint: TIMING_HINTS.sellTiming20, value: fmt(sellTiming20) },
    { label: "평단", hint: TIMING_HINTS.holdingAvgPriceSell, value: fmt(holdingAvgPrice) },
  ];
}

function TimingCard({ row, fill = false }: { row: TimingCardRow; fill?: boolean }) {
  return <StatCard inline fill={fill} label={row.label} hint={row.hint} value={row.value} tone={row.tone} />;
}

function SellTimingHeader({ summary, signal }: { summary: StockSummary; signal: SellTimingSignal }) {
  const { currentPrice, sellTiming10, sellTiming20, holdingAvgPrice, holdingQty } = summary;
  const min = holdingAvgPrice * 0.95;
  const max = (sellTiming20 ?? holdingAvgPrice) * 1.05;
  const clamped = priceBarPos(currentPrice, min, max);

  return (
    <>
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
    </>
  );
}

export function TimingRadar({
  summary,
  buySignal,
  sellSignal,
  onPriceChange,
  kisConfigured,
  kisLoading,
  kisError,
  kisLastUpdated,
  kisAutoRefresh,
  onKisAutoRefreshChange,
  onKisRefresh,
  kisStockCode,
}: {
  summary: StockSummary;
  buySignal: BuyTimingSignal;
  sellSignal: SellTimingSignal;
  onPriceChange: (price: number) => void;
  kisConfigured?: boolean | null;
  kisLoading?: boolean;
  kisError?: string | null;
  kisLastUpdated?: Date | null;
  kisAutoRefresh?: boolean;
  onKisAutoRefreshChange?: (v: boolean) => void;
  onKisRefresh?: () => void;
  kisStockCode?: string;
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

  const buyRows = getBuyTimingRows(summary);
  const sellRows = getSellTimingRows(summary);
  const alignedRows = holdingRows.length > 0;

  const kisStatusBlock =
    onKisRefresh && onKisAutoRefreshChange ? (
      kisConfigured === null ? (
        <p className="text-xs text-ink-muted">KIS 시세 연동 확인 중…</p>
      ) : kisConfigured === false ? (
        <p className="text-xs leading-relaxed text-amber-800">
          KIS 미설정 — 현재가 직접 입력. 서버에 KIS_APP_KEY 등록 시 자동 시세 사용.
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-right text-xs leading-snug tabular-nums text-ink-muted">
            {buildKisStatusText(kisStockCode, kisLastUpdated ?? null, kisAutoRefresh ?? false)}
          </p>
          {kisError && <p className="text-right text-xs leading-snug text-loss">{kisError}</p>}
          {!kisStockCode && (
            <p className="text-right text-xs text-amber-800">「이름 수정」에서 종목코드를 입력하세요.</p>
          )}
        </div>
      )
    ) : null;

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-5">
      {/* 모바일: 영역별 세로 배치 */}
      <div className="flex flex-col gap-5 md:hidden">
        <div className="space-y-2">
          <SectionTitle unit>매매 타이밍</SectionTitle>
          {onKisRefresh &&
            onKisAutoRefreshChange &&
            kisConfigured !== false &&
            kisConfigured !== null && (
              <KisPriceToolbar
                loading={kisLoading ?? false}
                autoRefresh={kisAutoRefresh ?? false}
                onAutoRefreshChange={onKisAutoRefreshChange}
                onRefresh={onKisRefresh}
                stockCode={kisStockCode}
              />
            )}
          {kisStatusBlock}
        </div>
        <div>
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
          <div className="flex flex-col gap-1.5">
            {holdingRows.map((row) => (
              <TimingCard key={row.label} row={row} />
            ))}
          </div>
        )}
        <BuyTimingHeader summary={summary} signal={buySignal} />
        {buyRows.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {buyRows.map((row) => (
              <TimingCard key={row.label} row={row} />
            ))}
          </div>
        )}
        <SellTimingHeader summary={summary} signal={sellSignal} />
        {sellRows.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {sellRows.map((row) => (
              <TimingCard key={row.label} row={row} />
            ))}
          </div>
        )}
      </div>

      {/* 데스크톱: 좌측 4행(현재가+보유3)과 매수/매도 카드 6개 상·하단·행간 맞춤 */}
      <div className="hidden md:grid md:grid-cols-3 md:grid-rows-[auto_auto_auto_auto_auto_auto] md:items-stretch md:gap-x-0 md:gap-y-1.5 md:divide-x md:divide-line">
        <div className="space-y-2 md:col-start-1 md:row-start-1 md:pr-5">
          <SectionTitle unit>매매 타이밍</SectionTitle>
          {onKisRefresh &&
            onKisAutoRefreshChange &&
            kisConfigured !== false &&
            kisConfigured !== null && (
              <KisPriceToolbar
                loading={kisLoading ?? false}
                autoRefresh={kisAutoRefresh ?? false}
                onAutoRefreshChange={onKisAutoRefreshChange}
                onRefresh={onKisRefresh}
                stockCode={kisStockCode}
              />
            )}
          {kisStatusBlock}
        </div>
        <div className="md:col-start-2 md:row-start-1 md:px-5">
          <BuyTimingHeader summary={summary} signal={buySignal} />
        </div>
        <div className="md:col-start-3 md:row-start-1 md:pl-5">
          <SellTimingHeader summary={summary} signal={sellSignal} />
        </div>

        <div className="md:col-start-1 md:row-start-2 md:pr-5">
          <label className="inline-flex items-center text-sm font-semibold text-slate-700">
            현재가
            <HintTooltip text={TIMING_HINTS.currentPrice} />
          </label>
        </div>

        <div className="md:col-start-1 md:row-start-3 md:pr-5">
          <FormattedNumberInput
            value={summary.currentPrice}
            onChange={onPriceChange}
            className="min-h-[2.75rem] w-full rounded-lg border border-line bg-surface-dim px-3 py-2.5 text-right text-lg font-bold tabular-nums text-ink outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="0"
          />
        </div>

        {alignedRows && (
          <>
            {holdingRows[0] && (
              <div className="md:col-start-1 md:row-start-4 md:pr-5">
                <TimingCard row={holdingRows[0]} />
              </div>
            )}
            {holdingRows[1] && (
              <div className="md:col-start-1 md:row-start-5 md:pr-5">
                <TimingCard row={holdingRows[1]} />
              </div>
            )}
            {holdingRows[2] && (
              <div className="md:col-start-1 md:row-start-6 md:pr-5">
                <TimingCard row={holdingRows[2]} />
              </div>
            )}

            {buyRows.length > 0 && (
              <div className="md:col-start-2 md:row-start-3 md:row-span-4 md:flex md:h-full md:min-h-0 md:flex-col md:gap-1.5 md:px-5">
                {buyRows.map((row) => (
                  <TimingCard key={row.label} row={row} fill />
                ))}
              </div>
            )}

            {sellRows.length > 0 && (
              <div className="md:col-start-3 md:row-start-3 md:row-span-4 md:flex md:h-full md:min-h-0 md:flex-col md:gap-1.5 md:pl-5">
                {sellRows.map((row) => (
                  <TimingCard key={row.label} row={row} fill />
                ))}
              </div>
            )}
          </>
        )}

        {!alignedRows && (
          <>
            {buyRows.map((row, i) => (
              <div key={row.label} className={i === 0 ? "md:col-start-2 md:row-start-3 md:px-5" : i === 1 ? "md:col-start-2 md:row-start-4 md:px-5" : "md:col-start-2 md:row-start-5 md:px-5"}>
                <TimingCard row={row} />
              </div>
            ))}
            {sellRows.map((row, i) => (
              <div key={row.label} className={i === 0 ? "md:col-start-3 md:row-start-3 md:pl-5" : i === 1 ? "md:col-start-3 md:row-start-4 md:pl-5" : "md:col-start-3 md:row-start-5 md:pl-5"}>
                <TimingCard row={row} />
              </div>
            ))}
          </>
        )}
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
    <section className="min-w-0 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-5">
      <SectionTitle unit>{stockName} 정산</SectionTitle>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {rows.map((row) => (
          <StatCard key={row.label} label={row.label} hint={row.hint} value={row.value} tone={row.tone} />
        ))}
      </div>
    </section>
  );
}
