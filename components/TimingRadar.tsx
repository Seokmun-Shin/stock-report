"use client";

import type { BuyTimingSignal, SellTimingSignal, StockQuote, StockSummary } from "@/lib/types";
import { fmt, fmtPct, fmtQty, fmtSigned } from "@/lib/calc";
import { STOCK_SETTLEMENT_HINTS, TIMING_HINTS } from "@/lib/metricHints";
import { resolveReportSettings, type ReportSettings } from "@/lib/reportSettings";
import { FormattedNumberInput } from "./FormattedNumberInput";
import { HintTooltip, StatCard } from "./StatCard";
import { AreaSectionTitle, pickCard, AreaCardHeader, RefreshButton } from "./ui/PanelCard";
import { formatKisUpdatedTime, isKrxMarketOpen } from "@/hooks/useKisPrices";
import type { RefreshMode } from "@/lib/appPreferences";
import { isAutoRefresh } from "@/lib/appPreferences";
import { tabLabel } from "@/lib/appTabs";

function buildKisStatusText(
  stockCode: string | undefined,
  lastUpdated: Date | null,
  refreshMode: RefreshMode
) {
  const marketOpen = isKrxMarketOpen();
  return [
    "KIS",
    stockCode ?? "코드 없음",
    lastUpdated ? `${formatKisUpdatedTime(lastUpdated)} 갱신` : null,
    isAutoRefresh(refreshMode) ? (marketOpen ? "탭 자동" : "탭 자동·장 마감") : "수동",
  ]
    .filter(Boolean)
    .join(" · ");
}

function KisPriceToolbar({
  loading,
  onRefresh,
  stockCode,
}: {
  loading: boolean;
  onRefresh: () => void;
  stockCode?: string;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <RefreshButton
        type="button"
        onClick={onRefresh}
        disabled={loading || !stockCode}
        kind="kis"
        loading={loading}
        className="w-full sm:w-auto"
      />
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
      <AreaCardHeader
        as="h3"
        title="매수 타이밍"
        subtitle="기준 · 최근 매도가"
        trailing={
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${timingBadge(signal.status, "buy")}`}>
            {signal.label}
          </span>
        }
      />
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-300">{signal.hint}</p>
      {timing10 && timing20 && lastSellPrice && (
        <div className="relative mt-3 h-2.5 shrink-0 rounded-full bg-gradient-to-r from-red-500/40 via-amber-400/30 to-white/10">
          <div
            className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-gain shadow"
            style={{ left: `calc(${clamped}% - 8px)` }}
          />
        </div>
      )}
    </>
  );
}

type TimingCardRow = { label: string; hint?: string; value: string; tone?: "gain" | "loss" };

function getBuyTimingRows(summary: StockSummary, settings: ReportSettings): TimingCardRow[] {
  const { timing10, timing20, lastSellPrice } = summary;
  if (!timing10 || !timing20 || !lastSellPrice) return [];
  return [
    { label: `매도가보다 ${settings.buyTimingPct2}%↓`, hint: TIMING_HINTS.timing20, value: fmt(timing20) },
    { label: `매도가보다 ${settings.buyTimingPct1}%↓`, hint: TIMING_HINTS.timing10, value: fmt(timing10) },
    { label: "최근 매도가", hint: TIMING_HINTS.lastSellPrice, value: fmt(lastSellPrice) },
  ];
}

function getSellTimingRows(summary: StockSummary, settings: ReportSettings): TimingCardRow[] {
  const { sellTiming10, sellTiming20, holdingAvgPrice, holdingQty, lastBuyPrice } = summary;
  if (!sellTiming10 || !sellTiming20 || holdingQty <= 0) return [];
  const rows: TimingCardRow[] = [
    { label: `평단보다 ${settings.sellTimingPct1}%↑`, hint: TIMING_HINTS.sellTiming10, value: fmt(sellTiming10) },
    { label: `평단보다 ${settings.sellTimingPct2}%↑`, hint: TIMING_HINTS.sellTiming20, value: fmt(sellTiming20) },
    { label: "평단(매수가)", hint: TIMING_HINTS.holdingAvgPriceSell, value: fmt(holdingAvgPrice) },
  ];
  if (lastBuyPrice && lastBuyPrice !== holdingAvgPrice) {
    rows.push({ label: "최근 매수가", hint: TIMING_HINTS.lastBuyPrice, value: fmt(lastBuyPrice) });
  }
  return rows;
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
      <AreaCardHeader
        as="h3"
        title="매도 타이밍"
        subtitle="기준 · 평단(보유 매수가)"
        trailing={
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${timingBadge(signal.status, "sell")}`}>
            {signal.label}
          </span>
        }
      />
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-300">{signal.hint}</p>
      {sellTiming10 && sellTiming20 && holdingQty > 0 && (
        <div className="relative mt-3 h-2.5 shrink-0 rounded-full bg-gradient-to-r from-white/10 via-amber-400/30 to-blue-500/40">
          <div
            className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-gain shadow"
            style={{ left: `calc(${clamped}% - 8px)` }}
          />
        </div>
      )}
    </>
  );
}

function TargetPriceField({
  value,
  onChange,
}: {
  value?: number;
  onChange?: (price: number) => void;
}) {
  if (!onChange) return null;
  return (
    <label className="mt-2 block text-xs text-zinc-300">
      목표가 (알림)
      <FormattedNumberInput
        value={value ?? 0}
        onChange={onChange}
        className="mt-1 w-full ui-glass-input py-2 text-right text-sm tabular-nums"
        placeholder="0"
      />
    </label>
  );
}

function KisQuoteStrip({ quote }: { quote?: StockQuote }) {
  if (!quote) return null;
  const tone = quote.changeRate >= 0 ? "text-gain" : "text-loss";
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 ui-inner-block py-2 text-xs sm:grid-cols-4">
      <div>
        <span className="text-zinc-300">전일 </span>
        <span className="font-semibold tabular-nums">{fmt(quote.prevClose)}</span>
      </div>
      <div>
        <span className="text-zinc-300">등락 </span>
        <span className={`font-semibold tabular-nums ${tone}`}>{fmtPct(quote.changeRate)}</span>
      </div>
      <div>
        <span className="text-zinc-300">고가 </span>
        <span className="font-semibold tabular-nums">{fmt(quote.high)}</span>
      </div>
      <div>
        <span className="text-zinc-300">저가 </span>
        <span className="font-semibold tabular-nums">{fmt(quote.low)}</span>
      </div>
    </div>
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
  refreshMode,
  onKisRefresh,
  kisStockCode,
  stockQuote,
  reportSettings,
  targetPrice,
  onTargetPriceChange,
}: {
  summary: StockSummary;
  buySignal: BuyTimingSignal;
  sellSignal: SellTimingSignal;
  onPriceChange: (price: number) => void;
  kisConfigured?: boolean | null;
  kisLoading?: boolean;
  kisError?: string | null;
  kisLastUpdated?: Date | null;
  refreshMode?: RefreshMode;
  onKisRefresh?: () => void;
  kisStockCode?: string;
  stockQuote?: StockQuote;
  reportSettings?: Partial<ReportSettings>;
  targetPrice?: number;
  onTargetPriceChange?: (price: number) => void;
}) {
  const timingSettings = resolveReportSettings(reportSettings);
  const holdingRows: { label: string; hint?: string; value: string; tone?: "gain" | "loss" }[] = [];
  if (summary.holdingQty > 0) {
    holdingRows.push(
      { label: "보유", hint: TIMING_HINTS.holdingQty, value: `${fmtQty(summary.holdingQty)}주` },
      { label: "평단", hint: TIMING_HINTS.holdingAvgPrice, value: fmt(summary.holdingAvgPrice) },
      {
        label: "평단(비용)",
        hint: TIMING_HINTS.holdingAvgPriceWithCost,
        value: fmt(summary.holdingAvgPriceWithCost),
      },
      {
        label: "평가손익",
        hint: TIMING_HINTS.unrealizedPnlWithCost,
        value: `${fmtSigned(summary.unrealizedPnlWithCost)} (${fmtPct(summary.unrealizedPnlPct)})`,
        tone: summary.unrealizedPnlWithCost >= 0 ? "gain" : "loss",
      }
    );
  }

  const useTimingLines = timingSettings.useTimingPctLines ?? true;
  const buyRows = useTimingLines ? getBuyTimingRows(summary, timingSettings) : [];
  const sellRows = useTimingLines ? getSellTimingRows(summary, timingSettings) : [];
  const alignedRows = holdingRows.length > 0;

  const kisStatusBlock =
    onKisRefresh ? (
      kisConfigured === null ? (
        <p className="text-xs text-zinc-300">KIS 시세 연동 확인 중…</p>
      ) : kisConfigured === false ? (
        <p className="text-xs leading-relaxed text-amber-200">
          KIS 미설정 — 현재가 직접 입력. 서버에 KIS_APP_KEY 등록 시 자동 시세 사용.
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-right text-xs leading-snug tabular-nums text-zinc-300">
            {buildKisStatusText(kisStockCode, kisLastUpdated ?? null, refreshMode ?? "auto")}
          </p>
          {kisError && <p className="text-right text-xs leading-snug text-amber-200">{kisError}</p>}
          {!kisStockCode && (
            <p className="text-right text-xs text-amber-200">「이름 수정」에서 종목코드를 입력하세요.</p>
          )}
          <p className="text-right text-[10px] text-zinc-500">
            자동/수동 → 「{tabLabel("settings")}」 화면·갱신
          </p>
        </div>
      )
    ) : null;

  return (
    <article className={pickCard}>
      <AreaCardHeader title="매매 타이밍" unit as="h2" />
      {/* 모바일: 영역별 세로 배치 */}
      <div className="mt-3 flex flex-col gap-5 lg:hidden">
        <div className="space-y-2">
          {onKisRefresh && kisConfigured !== false && kisConfigured !== null && (
              <KisPriceToolbar
                loading={kisLoading ?? false}
                onRefresh={onKisRefresh}
                stockCode={kisStockCode}
              />
            )}
          {kisStatusBlock}
        </div>
        <div>
          <label className="inline-flex items-center text-sm font-semibold text-zinc-300">
            현재가
            <HintTooltip text={TIMING_HINTS.currentPrice} />
          </label>
          <FormattedNumberInput
            value={summary.currentPrice}
            onChange={onPriceChange}
            className={UI.inputHero}
            placeholder="0"
          />
          <KisQuoteStrip quote={stockQuote} />
          <TargetPriceField value={targetPrice} onChange={onTargetPriceChange} />
        </div>
        {holdingRows.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {holdingRows.map((row) => (
              <TimingCard key={row.label} row={row} />
            ))}
          </div>
        )}
        {!useTimingLines && (
          <p className="rounded-lg border border-white/10 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-zinc-300">
            추천은 상단 <strong className="text-white">매매 타이밍</strong> 카드 참고 (시세·시장·뉴스 자동 분석)
          </p>
        )}
        {useTimingLines && <BuyTimingHeader summary={summary} signal={buySignal} />}
        {buyRows.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {buyRows.map((row) => (
              <TimingCard key={row.label} row={row} />
            ))}
          </div>
        )}
        {useTimingLines && <SellTimingHeader summary={summary} signal={sellSignal} />}
        {sellRows.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {sellRows.map((row) => (
              <TimingCard key={row.label} row={row} />
            ))}
          </div>
        )}
      </div>

      {/* 데스크톱: 좌측(현재가+보유4)과 매수/매도 카드 행간 맞춤 */}
      <div className="mt-3 hidden lg:grid lg:grid-cols-3 lg:grid-rows-[auto_auto_auto_auto_auto_auto_auto] lg:items-stretch lg:gap-x-0 lg:gap-y-1.5 lg:divide-x lg:divide-white/10">
        <div className="space-y-2 lg:col-start-1 lg:row-start-1 lg:pr-5">
          {onKisRefresh && kisConfigured !== false && kisConfigured !== null && (
              <KisPriceToolbar
                loading={kisLoading ?? false}
                onRefresh={onKisRefresh}
                stockCode={kisStockCode}
              />
            )}
          {kisStatusBlock}
        </div>
        <div className="lg:col-start-2 lg:row-start-1 lg:px-5">
          {useTimingLines ? (
            <BuyTimingHeader summary={summary} signal={buySignal} />
          ) : (
            <p className="text-xs leading-relaxed text-zinc-300">
              상단 <strong className="text-white">매매 타이밍</strong> 카드 참고
            </p>
          )}
        </div>
        <div className="lg:col-start-3 lg:row-start-1 lg:pl-5">
          {useTimingLines && <SellTimingHeader summary={summary} signal={sellSignal} />}
        </div>

        <div className="lg:col-start-1 lg:row-start-2 lg:pr-5">
          <label className="inline-flex items-center text-sm font-semibold text-zinc-300">
            현재가
            <HintTooltip text={TIMING_HINTS.currentPrice} />
          </label>
        </div>

        <div className="lg:col-start-1 lg:row-start-3 lg:pr-5">
          <FormattedNumberInput
            value={summary.currentPrice}
            onChange={onPriceChange}
            className={`min-h-[2.75rem] ${UI.inputHero}`}
            placeholder="0"
          />
          <KisQuoteStrip quote={stockQuote} />
          <TargetPriceField value={targetPrice} onChange={onTargetPriceChange} />
        </div>

        {alignedRows && (
          <>
            {holdingRows[0] && (
              <div className="lg:col-start-1 lg:row-start-4 lg:pr-5">
                <TimingCard row={holdingRows[0]} />
              </div>
            )}
            {holdingRows[1] && (
              <div className="lg:col-start-1 lg:row-start-5 lg:pr-5">
                <TimingCard row={holdingRows[1]} />
              </div>
            )}
            {holdingRows[2] && (
              <div className="lg:col-start-1 lg:row-start-6 lg:pr-5">
                <TimingCard row={holdingRows[2]} />
              </div>
            )}
            {holdingRows[3] && (
              <div className="lg:col-start-1 lg:row-start-7 lg:pr-5">
                <TimingCard row={holdingRows[3]} />
              </div>
            )}

            {buyRows.length > 0 && (
              <div className="lg:col-start-2 lg:row-start-3 lg:row-span-5 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-1.5 lg:px-5">
                {buyRows.map((row) => (
                  <TimingCard key={row.label} row={row} fill />
                ))}
              </div>
            )}

            {sellRows.length > 0 && (
              <div className="lg:col-start-3 lg:row-start-3 lg:row-span-5 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-1.5 lg:pl-5">
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
              <div key={row.label} className={i === 0 ? "lg:col-start-2 lg:row-start-3 lg:px-5" : i === 1 ? "lg:col-start-2 lg:row-start-4 lg:px-5" : "lg:col-start-2 lg:row-start-5 lg:px-5"}>
                <TimingCard row={row} />
              </div>
            ))}
            {sellRows.map((row, i) => (
              <div key={row.label} className={i === 0 ? "lg:col-start-3 lg:row-start-3 lg:pl-5" : i === 1 ? "lg:col-start-3 lg:row-start-4 lg:pl-5" : "lg:col-start-3 lg:row-start-5 lg:pl-5"}>
                <TimingCard row={row} />
              </div>
            ))}
          </>
        )}
      </div>
    </article>
  );
}

export function StockSettlement({ stockName, summary }: { stockName: string; summary: StockSummary }) {
  const realizedTone = summary.netProfit >= 0 ? "gain" : "loss";
  const unrealizedTone = summary.unrealizedPnlWithCost >= 0 ? "gain" : "loss";

  return (
    <section className="min-w-0 space-y-3">
      <AreaCardHeader
        title={`${stockName} 종목 성과`}
        subtitle="실현(매도 누적) · 평가(현재 보유) 구분"
      />

      {summary.holdingQty > 0 ? (
        <>
          <AreaSectionTitle as="p" size="sub">
            평가 (보유 · 미실현)
          </AreaSectionTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatCard label="보유" hint={STOCK_SETTLEMENT_HINTS.holdingQty} value={`${fmtQty(summary.holdingQty)}주`} />
            <StatCard label="평단" hint={TIMING_HINTS.holdingAvgPrice} value={fmt(summary.holdingAvgPrice)} />
            <StatCard
              label="평가 손익"
              hint={TIMING_HINTS.unrealizedPnlWithCost}
              value={fmtSigned(summary.unrealizedPnlWithCost)}
              sub={fmtPct(summary.unrealizedPnlPct)}
              tone={unrealizedTone}
            />
          </div>
        </>
      ) : (
        <p className="ui-inner-block border border-dashed border-white/10 px-3 py-2 text-xs text-zinc-300">
          현재 보유 없음 — 평가 손익 없음
        </p>
      )}

      <AreaSectionTitle as="p" size="sub" className="text-gain">
        실현 (매도 확정)
      </AreaSectionTitle>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatCard label="매수" hint={STOCK_SETTLEMENT_HINTS.buyAmount} value={fmt(summary.buyAmount)} />
        <StatCard label="매도" hint={STOCK_SETTLEMENT_HINTS.sellAmount} value={fmt(summary.sellAmount)} />
        <StatCard label="비용" hint={STOCK_SETTLEMENT_HINTS.tradeCost} value={fmt(summary.tradeCost)} />
        <StatCard
          label="실현 순수익"
          hint={STOCK_SETTLEMENT_HINTS.netProfit}
          value={fmt(summary.netProfit)}
          tone={realizedTone}
        />
        <StatCard
          label="실현 수익률"
          hint={STOCK_SETTLEMENT_HINTS.returnRate}
          value={fmtPct(summary.returnRate)}
          tone={realizedTone}
        />
      </div>
    </section>
  );
}
