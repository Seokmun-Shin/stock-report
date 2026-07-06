"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { fmt, fmtPct } from "@/lib/calc";
import {
  HISTORY_INTERVAL_LABEL,
  HISTORY_RANGE_LABEL,
  rangeOptionsForInterval,
  type HistoryInterval,
  type HistoryRange,
} from "@/lib/stockPriceHistory";
import type { StockHistoryPayload } from "@/hooks/useStockHistory";
import type { Trade } from "@/lib/types";
import { matchTradesToChart } from "@/lib/chartTrades";
import { panelHeaderBar, panelShell, UI, AreaSectionSubtitle, AreaSectionTitle } from "@/components/ui/PanelCard";

/** globals.css --market-* · tailwind gain/loss 와 동기화 */
const MARKET = {
  up: "#dc2626",
  down: "#2563eb",
  upSoft: "#fef2f2",
  downSoft: "#eff6ff",
} as const;

const CHART_THEME = {
  plot: "#f8fafc",
  plotEdge: "#e8edf2",
  grid: "#eef2f6",
  axis: "#64748b",
  kospi: "#cbd5e1",
  avgCost: "#f59e0b",
  crosshair: "#94a3b8",
} as const;

const CHART = { w: 640, h: 182, padL: 28, padR: 3, padT: 8, padB: 20 };
const AXIS_FONT = 8;
const GRID_DASH = "1.5 4";

function yAxisLabelY(y: number, index: number, total: number): number {
  if (index === total - 1) return y - 4;
  if (index === 0) return y + 4;
  return y + 2.5;
}

function xAxisLabelY(): number {
  return CHART.h - (CHART.padB - AXIS_FONT) / 2 - 1;
}

function pickYTicks(count = 7): number[] {
  if (count <= 1) return [0];
  return Array.from({ length: count }, (_, i) => i / (count - 1));
}

function toneClass(rate: number) {
  return rate >= 0 ? "text-gain" : "text-loss";
}

function formatAxisPrice(n: number): string {
  if (n >= 100_000) return `${Math.round(n / 1000)}k`;
  if (n >= 10_000) return `${(n / 1000).toFixed(0)}k`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatDateLabel(iso: string, interval: HistoryInterval, range: HistoryRange): string {
  if (interval === "5m") {
    const [dayPart, timePart = ""] = iso.includes(" ") ? iso.split(" ") : [iso.slice(0, 10), iso.slice(11, 16)];
    const hm = timePart.slice(0, 5);
    if (range === "5d") {
      const md = dayPart.slice(5).replace("-", "/");
      return hm ? `${md} ${hm}` : md;
    }
    return hm || iso;
  }
  const [, m, d] = iso.split("-");
  return `${m}/${d}`;
}

function formatTooltipDate(iso: string, interval: HistoryInterval): string {
  if (interval === "5m") {
    const [dayPart, timePart = ""] = iso.includes(" ") ? iso.split(" ") : [iso.slice(0, 10), iso.slice(11, 16)];
    return timePart ? `${dayPart} ${timePart.slice(0, 5)}` : dayPart;
  }
  return iso.slice(0, 10);
}

function pickIntervalOnChange(
  iv: HistoryInterval,
  range: HistoryRange,
  onIntervalChange: (i: HistoryInterval) => void,
  onRangeChange: (r: HistoryRange) => void
) {
  onIntervalChange(iv);
  const allowed = rangeOptionsForInterval(iv);
  if (!allowed.includes(range)) onRangeChange(allowed[0]);
}

function pickDateTicks(n: number, maxTicks = 4): number[] {
  if (n <= maxTicks) return Array.from({ length: n }, (_, i) => i);
  const step = (n - 1) / (maxTicks - 1);
  return Array.from({ length: maxTicks }, (_, i) => Math.round(i * step));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function ChartTabRow<T extends string>({
  items,
  active,
  onChange,
  getLabel,
  ariaLabel,
}: {
  items: readonly T[];
  active: T;
  onChange: (id: T) => void;
  getLabel: (id: T) => string;
  ariaLabel: string;
}) {
  return (
    <div className="inline-flex items-end gap-2 border-b border-line/80" role="tablist" aria-label={ariaLabel}>
      {items.map((id) => {
        const selected = id === active;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={`relative -mb-px flex h-6 min-w-[1.75rem] items-center justify-center px-0.5 pb-1 text-xs leading-none tabular-nums transition sm:text-[13px] ${
              selected ? "font-bold text-ink" : "font-medium text-ink-muted hover:text-ink"
            }`}
          >
            {getLabel(id)}
            {selected && (
              <span className="absolute inset-x-0.5 bottom-0 z-10 h-[2px] rounded-full bg-gain shadow-[0_0_6px_rgba(220,38,38,0.35)]" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}

function ChartControlZone({
  label,
  children,
  bordered = false,
}: {
  label: string;
  children: ReactNode;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 sm:px-2.5 ${
        bordered ? "border-r border-line/70 bg-surface-dim/45" : "bg-white"
      }`}
    >
      <span className="inline-flex h-5 shrink-0 items-center justify-center rounded-full bg-ink/[0.06] px-2 text-[10px] font-semibold leading-none text-ink-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function ChartMetricStrip({
  items,
}: {
  items: { label: string; value: string; tone?: "neutral" | "gain" | "loss" }[];
}) {
  return (
    <div className="flex divide-x divide-line/70 border-b border-line/80 bg-gradient-to-b from-white via-white to-surface-dim/30">
      {items.map((item) => {
        const valColor =
          item.tone === "gain" ? "text-gain" : item.tone === "loss" ? "text-loss" : "text-ink";
        const cellBg =
          item.tone === "gain"
            ? "bg-gain-soft/25"
            : item.tone === "loss"
              ? "bg-loss-soft/25"
              : "bg-transparent";
        return (
          <div
            key={item.label}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center px-2 py-2.5 text-center sm:px-3 ${cellBg}`}
          >
            <span className="truncate text-[10px] font-medium tracking-wide text-ink-muted/90">{item.label}</span>
            <span className={`mt-0.5 truncate text-xs font-bold tabular-nums leading-snug sm:text-sm ${valColor}`}>
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ChartViewControls({
  interval,
  onIntervalChange,
  range,
  onRangeChange,
  rangeOptions,
}: {
  interval: HistoryInterval;
  onIntervalChange: (i: HistoryInterval) => void;
  range: HistoryRange;
  onRangeChange: (r: HistoryRange) => void;
  rangeOptions: HistoryRange[];
}) {
  const intervals: HistoryInterval[] = ["5m", "1d", "1wk"];

  return (
    <div
      className="inline-flex max-w-full items-center overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.03]"
      aria-label="차트 보기 설정"
    >
      <ChartControlZone label="봉" bordered>
        <ChartTabRow
          items={intervals}
          active={interval}
          onChange={(iv) => pickIntervalOnChange(iv, range, onIntervalChange, onRangeChange)}
          getLabel={(iv) => HISTORY_INTERVAL_LABEL[iv]}
          ariaLabel="봉 구간"
        />
      </ChartControlZone>
      <ChartControlZone label="기간">
        <ChartTabRow
          items={rangeOptions}
          active={range}
          onChange={onRangeChange}
          getLabel={(r) => HISTORY_RANGE_LABEL[r]}
          ariaLabel="조회 기간"
        />
      </ChartControlZone>
    </div>
  );
}

export function StockTrendChart({
  stockName,
  data,
  loading,
  error,
  range,
  onRangeChange,
  interval,
  onIntervalChange,
  avgCost,
  holdingQty,
  trades = [],
  fetchedAt,
}: {
  stockName: string;
  data: StockHistoryPayload | null;
  loading: boolean;
  error: string | null;
  range: HistoryRange;
  onRangeChange: (r: HistoryRange) => void;
  interval: HistoryInterval;
  onIntervalChange: (i: HistoryInterval) => void;
  avgCost?: number;
  holdingQty?: number;
  trades?: Trade[];
  fetchedAt?: Date | null;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const rangeOptions = rangeOptionsForInterval(interval);

  const chart = useMemo(() => {
    if (!data || data.points.length < 2) return null;

    const pts = data.points;
    const n = pts.length;
    const closes = pts.map((p) => p.close);
    const highs = pts.map((p) => p.high);
    const lows = pts.map((p) => p.low);

    let yMin = Math.min(...lows);
    let yMax = Math.max(...highs);
    if (avgCost != null && avgCost > 0 && holdingQty && holdingQty > 0) {
      yMin = Math.min(yMin, avgCost);
      yMax = Math.max(yMax, avgCost);
    }
    const pad = Math.max((yMax - yMin) * 0.06, yMax * 0.002);
    yMin -= pad;
    yMax += pad;

    const innerW = CHART.w - CHART.padL - CHART.padR;
    const innerH = CHART.h - CHART.padT - CHART.padB;
    const baseY = CHART.padT + innerH;
    const slotW = innerW / n;

    const xCenter = (i: number) => CHART.padL + slotW * i + slotW / 2;
    const yScale = (v: number) =>
      CHART.padT + innerH - ((v - yMin) / Math.max(yMax - yMin, 1)) * innerH;

    const accent = data.periodChangePct >= 0 ? MARKET.up : MARKET.down;
    const candleW = Math.max(
      Math.min(slotW * 0.55, interval === "1wk" ? 14 : interval === "5m" ? 4 : 7),
      interval === "5m" ? 1.5 : 2
    );

    const candles = pts.map((p, i) => {
      const up = p.close >= p.open;
      const cx = xCenter(i);
      return {
        i,
        cx,
        up,
        yHigh: yScale(p.high),
        yLow: yScale(p.low),
        yOpen: yScale(p.open),
        yClose: yScale(p.close),
        bodyTop: yScale(Math.max(p.open, p.close)),
        bodyBot: yScale(Math.min(p.open, p.close)),
        bodyH: Math.max(Math.abs(yScale(p.open) - yScale(p.close)), 1),
      };
    });

    const closeLine = closes.map((c, i) => ({ x: xCenter(i), y: yScale(c) }));
    const closePath = closeLine
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
    const areaPath =
      closeLine.length >= 2
        ? `${closePath} L ${closeLine[n - 1].x.toFixed(1)} ${baseY.toFixed(1)} L ${closeLine[0].x.toFixed(1)} ${baseY.toFixed(1)} Z`
        : "";

    const lineMode = interval === "5m" || data.source === "snapshot";
    const slotWForHover = slotW;

    const kospiEquiv: number[] = [];
    if (data.kospiIndex.length > 0 && closes[0] > 0) {
      const kMap = new Map(data.kospiIndex.map((k) => [k.date, k.index]));
      for (const p of pts) {
        const idx = kMap.get(p.date);
        kospiEquiv.push(idx != null ? (closes[0] * idx) / 100 : closes[0]);
      }
    }
    const kospiPath =
      kospiEquiv.length >= 2
        ? kospiEquiv
            .map((v, i) => `${i === 0 ? "M" : "L"} ${xCenter(i).toFixed(1)} ${yScale(v).toFixed(1)}`)
            .join(" ")
        : "";

    const yTicks = pickYTicks(6).map((t) => {
      const v = yMin + (yMax - yMin) * (1 - t);
      return { y: yScale(v), label: formatAxisPrice(v) };
    });

    const xTickIdx = pickDateTicks(n, interval === "5m" ? 4 : 4);
    const xTicks = xTickIdx.map((i) => ({
      x: xCenter(i),
      label: formatDateLabel(pts[i].date, interval, range),
    }));

    const highIdx = closes.indexOf(Math.max(...closes));
    const lowIdx = closes.indexOf(Math.min(...closes));
    const lastIdx = n - 1;

    const avgY =
      avgCost != null && avgCost > 0 && holdingQty && holdingQty > 0 && avgCost >= yMin && avgCost <= yMax
        ? yScale(avgCost)
        : null;

    const vsAvgPct =
      avgCost != null && avgCost > 0 && holdingQty && holdingQty > 0
        ? ((closes[lastIdx] - avgCost) / avgCost) * 100
        : null;

    const tradeMarkers = matchTradesToChart(trades, pts, interval).map((m) => ({
      ...m,
      cx: xCenter(m.index),
      cy: yScale(m.price),
    }));

    return {
      candles,
      closePath,
      areaPath,
      closeLine,
      lineMode,
      slotWForHover,
      kospiPath,
      candleW,
      accent,
      baseY,
      yTicks,
      xTicks,
      highIdx,
      lowIdx,
      lastIdx,
      highVal: highs[highIdx],
      lowVal: lows[lowIdx],
      lastPrice: closes[lastIdx],
      startPrice: closes[0],
      avgY,
      vsAvgPct,
      tradeMarkers,
      yMin,
      yMax,
      xCenter,
      yScale,
      kospiEquiv,
    };
  }, [data, avgCost, holdingQty, interval, range, trades]);

  const handlePointer = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      if (!chart || !data) return;
      setCursor({ x: clientX - rect.left, y: clientY - rect.top });

      const relX = ((clientX - rect.left) / rect.width) * CHART.w;
      const innerLeft = CHART.padL;
      const innerRight = CHART.w - CHART.padR;
      if (relX < innerLeft || relX > innerRight) {
        setHoverIdx(null);
        return;
      }
      const slotW = (innerRight - innerLeft) / data.points.length;
      const idx = Math.floor((relX - innerLeft) / slotW);
      setHoverIdx(clamp(idx, 0, data.points.length - 1));
    },
    [chart, data]
  );

  const clearPointer = useCallback(() => {
    setHoverIdx(null);
    setCursor(null);
  }, []);

  const hi = hoverIdx ?? chart?.lastIdx ?? null;
  const hoverBar = hi != null && data && chart ? data.points[hi] : null;

  const tooltipStyle = useMemo(() => {
    if (!cursor || !wrapRef.current) return null;
    const w = wrapRef.current.clientWidth;
    const h = wrapRef.current.clientHeight;
    const tw = 148;
    const th = 88;
    let left = cursor.x + 14;
    let top = cursor.y - 20;
    if (left + tw > w - 8) left = cursor.x - tw - 14;
    if (top + th > h - 8) top = h - th - 8;
    if (top < 4) top = 4;
    return { left, top };
  }, [cursor]);

  return (
    <section className={panelShell}>
      <div className={`${panelHeaderBar} !py-2`}>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0 shrink">
            <AreaSectionTitle as="h2">가격 추이</AreaSectionTitle>
            <AreaSectionSubtitle>
              {stockName}
              {data?.source === "yahoo"
                ? ` · Yahoo ${HISTORY_INTERVAL_LABEL[data.interval ?? interval]}`
                : data?.source === "snapshot"
                  ? " · 스냅샷"
                  : ""}
              {fetchedAt && (
                <>
                  {" · "}
                  {fetchedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 갱신
                </>
              )}
            </AreaSectionSubtitle>
          </div>

          <ChartViewControls
            interval={interval}
            onIntervalChange={onIntervalChange}
            range={range}
            onRangeChange={onRangeChange}
            rangeOptions={rangeOptions}
          />
        </div>
      </div>

      <div className="border-t border-line">
        {chart && data && (
          <ChartMetricStrip
            items={[
              {
                label: "기간",
                value: fmtPct(data.periodChangePct),
                tone: data.periodChangePct >= 0 ? "gain" : "loss",
              },
              { label: "현재", value: fmt(chart.lastPrice) },
              { label: "고", value: fmt(chart.highVal) },
              { label: "저", value: fmt(chart.lowVal) },
              ...(data.alpha != null
                ? [
                    {
                      label: "vs KOSPI",
                      value: `${data.alpha >= 0 ? "+" : ""}${data.alpha.toFixed(1)}%p`,
                      tone: (data.alpha >= 0 ? "gain" : "loss") as "gain" | "loss",
                    },
                  ]
                : []),
              ...(chart.vsAvgPct != null
                ? [
                    {
                      label: "vs 평단",
                      value: fmtPct(chart.vsAvgPct),
                      tone: (chart.vsAvgPct >= 0 ? "gain" : "loss") as "gain" | "loss",
                    },
                  ]
                : []),
            ]}
          />
        )}

        <div ref={wrapRef} className="relative">
          {loading && (
            <div
              className="flex w-full items-center justify-center bg-slate-50/40"
              style={{ aspectRatio: `${CHART.w} / ${CHART.h}` }}
            >
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink-muted/50" />
            </div>
          )}
          {error && !loading && <p className={`px-3 py-8 text-center ${UI.body} text-amber-800`}>{error}</p>}
          {!loading && !error && data && data.points.length < 2 && (
            <p className={`px-3 py-8 text-center ${UI.body}`}>
              {interval === "5m"
                ? "종목코드 등록 후 당일·5일 장중(5분) 데이터를 불러옵니다."
                : "종목코드 등록 후 일봉·주봉 데이터를 불러옵니다."}
            </p>
          )}

          {chart && !loading && (
            <>
              <svg
                viewBox={`0 0 ${CHART.w} ${CHART.h}`}
                className="block w-full touch-none select-none"
                role="img"
                aria-label={`${stockName} ${HISTORY_INTERVAL_LABEL[interval]} 차트`}
                onMouseMove={(e) => handlePointer(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
                onMouseLeave={clearPointer}
                onTouchMove={(e) => {
                  const t = e.touches[0];
                  if (t) handlePointer(t.clientX, t.clientY, e.currentTarget.getBoundingClientRect());
                }}
                onTouchEnd={clearPointer}
              >
                <defs>
                  <linearGradient id="chart-bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f8fafc" />
                    <stop offset="100%" stopColor="#f1f5f9" />
                  </linearGradient>
                  <linearGradient id="chart-area-up" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={MARKET.up} stopOpacity="0.14" />
                    <stop offset="55%" stopColor={MARKET.up} stopOpacity="0.04" />
                    <stop offset="100%" stopColor={MARKET.up} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="chart-area-down" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={MARKET.down} stopOpacity="0.13" />
                    <stop offset="55%" stopColor={MARKET.down} stopOpacity="0.035" />
                    <stop offset="100%" stopColor={MARKET.down} stopOpacity="0" />
                  </linearGradient>
                  <clipPath id="chart-plot-clip">
                    <rect
                      x={CHART.padL}
                      y={CHART.padT}
                      width={CHART.w - CHART.padL - CHART.padR}
                      height={CHART.h - CHART.padT - CHART.padB}
                    />
                  </clipPath>
                </defs>

                <rect x="0" y="0" width={CHART.w} height={CHART.h} fill="url(#chart-bg)" />

                <rect
                  x={CHART.padL}
                  y={CHART.padT}
                  width={CHART.w - CHART.padL - CHART.padR}
                  height={CHART.h - CHART.padT - CHART.padB}
                  fill="#ffffff"
                  stroke={CHART_THEME.plotEdge}
                  strokeWidth="0.35"
                  rx="0"
                />

                {chart.yTicks.map((t, i) => (
                  <g key={`${t.label}-${i}`}>
                    <line
                      x1={CHART.padL}
                      x2={CHART.w - CHART.padR}
                      y1={t.y}
                      y2={t.y}
                      stroke={CHART_THEME.grid}
                      strokeWidth="0.5"
                      strokeDasharray={GRID_DASH}
                      opacity="0.55"
                    />
                    <text
                      x={CHART.padL - 3}
                      y={yAxisLabelY(t.y, i, chart.yTicks.length)}
                      textAnchor="end"
                      fill={CHART_THEME.axis}
                      fontSize={AXIS_FONT}
                      fontWeight="500"
                      fontFamily="inherit"
                    >
                      {t.label}
                    </text>
                  </g>
                ))}

                {hoverIdx != null && chart.candles[hoverIdx] && (
                  <rect
                    x={chart.candles[hoverIdx].cx - chart.slotWForHover / 2}
                    y={CHART.padT}
                    width={chart.slotWForHover}
                    height={chart.baseY - CHART.padT}
                    fill={chart.accent}
                    opacity="0.04"
                    rx="1"
                  />
                )}

                {chart.kospiPath && (
                  <path
                    d={chart.kospiPath}
                    fill="none"
                    stroke={CHART_THEME.kospi}
                    strokeWidth="0.5"
                    strokeDasharray="2 3"
                    opacity="0.45"
                  />
                )}

                {chart.lineMode ? (
                  <g clipPath="url(#chart-plot-clip)">
                    {chart.areaPath && (
                      <path
                        d={chart.areaPath}
                        fill={`url(#chart-area-${chart.accent === MARKET.up ? "up" : "down"})`}
                      />
                    )}
                    <path
                      d={chart.closePath}
                      fill="none"
                      stroke={chart.accent}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.1"
                    />
                    <path
                      d={chart.closePath}
                      fill="none"
                      stroke={chart.accent}
                      strokeWidth="1.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.92"
                    />
                    {chart.closeLine[chart.lastIdx] && (
                      <>
                        <circle
                          cx={chart.closeLine[chart.lastIdx].x}
                          cy={chart.closeLine[chart.lastIdx].y}
                          r="3.25"
                          fill={chart.accent}
                          opacity="0.12"
                        />
                        <circle
                          cx={chart.closeLine[chart.lastIdx].x}
                          cy={chart.closeLine[chart.lastIdx].y}
                          r="1.75"
                          fill="white"
                          stroke={chart.accent}
                          strokeWidth="1"
                        />
                      </>
                    )}
                  </g>
                ) : (
                  chart.candles.map((c) => {
                    const color = c.up ? MARKET.up : MARKET.down;
                    const dimmed = hoverIdx != null && hoverIdx !== c.i;
                    return (
                      <g key={c.i} opacity={dimmed ? 0.35 : 0.78}>
                        <line
                          x1={c.cx}
                          x2={c.cx}
                          y1={c.yHigh}
                          y2={c.yLow}
                          stroke={color}
                          strokeWidth="0.5"
                          strokeLinecap="round"
                        />
                        <rect
                          x={c.cx - chart.candleW / 2}
                          y={c.bodyTop}
                          width={chart.candleW}
                          height={c.bodyH}
                          fill={color}
                          rx="0.5"
                        />
                      </g>
                    );
                  })
                )}

                {chart.avgY != null && (
                  <>
                    <line
                      x1={CHART.padL}
                      x2={CHART.w - CHART.padR}
                      y1={chart.avgY}
                      y2={chart.avgY}
                      stroke={CHART_THEME.avgCost}
                      strokeWidth="0.5"
                      strokeDasharray="2 3"
                      opacity="0.5"
                    />
                    <rect
                      x={CHART.w - CHART.padR - 17}
                      y={chart.avgY - 9}
                      width="16"
                      height="7"
                      rx="2"
                      fill="white"
                      fillOpacity="0.92"
                      stroke={CHART_THEME.avgCost}
                      strokeWidth="0.35"
                      strokeOpacity="0.45"
                    />
                    <text
                      x={CHART.w - CHART.padR - 9}
                      y={chart.avgY - 4.5}
                      textAnchor="middle"
                      fill={CHART_THEME.avgCost}
                      fontSize="6"
                      fontWeight="600"
                      fontFamily="inherit"
                      opacity="0.85"
                    >
                      평단
                    </text>
                  </>
                )}

                {hoverIdx != null && chart.candles[hoverIdx] && (
                  <line
                    x1={chart.candles[hoverIdx].cx}
                    x2={chart.candles[hoverIdx].cx}
                    y1={CHART.padT}
                    y2={chart.baseY}
                    stroke={CHART_THEME.crosshair}
                    strokeWidth="0.5"
                    opacity="0.22"
                  />
                )}

                {chart.tradeMarkers.map((m) => {
                  const color = m.type === "buy" ? MARKET.up : MARKET.down;
                  return (
                    <g key={m.tradeId} opacity="0.92">
                      <circle cx={m.cx} cy={m.cy} r="3.5" fill={color} opacity="0.15" />
                      <circle cx={m.cx} cy={m.cy} r="1.6" fill="white" stroke={color} strokeWidth="0.75" />
                    </g>
                  );
                })}

                {chart.xTicks.map((t) => (
                  <text
                    key={t.label + t.x}
                    x={t.x}
                    y={xAxisLabelY()}
                    textAnchor="middle"
                    fill={CHART_THEME.axis}
                    fontSize={AXIS_FONT}
                    fontWeight="500"
                    fontFamily="inherit"
                  >
                    {t.label}
                  </text>
                ))}
              </svg>

              {hoverBar && cursor && tooltipStyle && (
                <div
                  className="pointer-events-none absolute z-20 overflow-hidden rounded-xl border border-white/70 bg-white/72 shadow-[0_4px_20px_rgba(15,23,42,0.1)] ring-1 ring-line/20 backdrop-blur-md backdrop-saturate-150"
                  style={{ left: tooltipStyle.left, top: tooltipStyle.top, width: 160 }}
                >
                  <div className="px-3 py-2.5">
                    <p className="text-[10px] font-medium text-ink-muted">{formatTooltipDate(hoverBar.date, interval)}</p>
                    <p className={`mt-1 ${UI.metricCompact} text-ink`}>{fmt(hoverBar.close)}</p>
                    <div className="mt-2 space-y-1 text-[10px] tabular-nums text-ink-muted">
                      <p>
                        시 {fmt(hoverBar.open)} · 고 {fmt(hoverBar.high)} · 저 {fmt(hoverBar.low)}
                      </p>
                      {chart.startPrice > 0 && (
                        <p className={`font-semibold ${toneClass(((hoverBar.close - chart.startPrice) / chart.startPrice) * 100)}`}>
                          기간初 {fmtPct(((hoverBar.close - chart.startPrice) / chart.startPrice) * 100)}
                        </p>
                      )}
                      {avgCost != null && holdingQty != null && holdingQty > 0 && (
                        <p className={`font-semibold ${toneClass(((hoverBar.close - avgCost) / avgCost) * 100)}`}>
                          평단比 {fmtPct(((hoverBar.close - avgCost) / avgCost) * 100)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-line/40 bg-gradient-to-b from-surface-dim/10 to-white px-3 py-2 text-[10px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-gain/75 shadow-[0_0_0_1px_rgba(220,38,38,0.15)]" />
                  상승
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-loss/75 shadow-[0_0_0_1px_rgba(37,99,235,0.15)]" />
                  하락
                </span>
                {chart.kospiPath && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-0 w-3.5 border-t border-dashed border-slate-300/90" />
                    KOSPI
                  </span>
                )}
                {chart.avgY != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-0 w-3.5 border-t border-dashed border-amber-400/80" />
                    평단
                  </span>
                )}
                {chart.tradeMarkers.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex h-2 w-2 items-center justify-center rounded-full border border-gain/70 bg-white">
                      <span className="h-1 w-1 rounded-full bg-gain" />
                    </span>
                    체결
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
