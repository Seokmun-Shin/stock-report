"use client";

import { useMemo } from "react";
import { fmtPct } from "@/lib/calc";
import type { DailySnapshot } from "@/lib/types";
import { usePortfolioBenchmark } from "@/hooks/usePortfolioBenchmark";
import { panelHeaderBar, panelShell, AreaSectionSubtitle, AreaSectionTitle } from "@/components/ui/PanelCard";

const CHART = { w: 640, h: 160, padL: 28, padR: 4, padT: 10, padB: 20 };
const AXIS_FONT = 8;

function yAxisLabelY(y: number, index: number, total: number): number {
  if (index === total - 1) return y - 4;
  if (index === 0) return y + 4;
  return y + 2.5;
}

function xAxisLabelY(): number {
  return CHART.h - (CHART.padB - AXIS_FONT) / 2 - 1;
}

function formatDateLabel(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${m}/${d}`;
}

function pickTicks(n: number, max = 5): number[] {
  if (n <= max) return Array.from({ length: n }, (_, i) => i);
  const step = (n - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => Math.round(i * step));
}

export function PortfolioBenchmarkChart({ dailySnapshots }: { dailySnapshots?: DailySnapshot[] }) {
  const { data, loading, error } = usePortfolioBenchmark(dailySnapshots);
  const snapCount = dailySnapshots?.length ?? 0;

  const chart = useMemo(() => {
    if (!data || data.portfolioIndex.length < 2) return null;

    const pts = data.portfolioIndex;
    const kMap = new Map(data.kospiIndex.map((k) => [k.date, k.index]));
    const n = pts.length;
    const values = pts.flatMap((p) => [p.index, kMap.get(p.date) ?? p.index]);
    let yMin = Math.min(...values);
    let yMax = Math.max(...values);
    const pad = Math.max((yMax - yMin) * 0.08, 0.5);
    yMin -= pad;
    yMax += pad;

    const innerW = CHART.w - CHART.padL - CHART.padR;
    const innerH = CHART.h - CHART.padT - CHART.padB;
    const baseY = CHART.padT + innerH;
    const slotW = innerW / Math.max(n - 1, 1);
    const xAt = (i: number) => CHART.padL + slotW * i;
    const yScale = (v: number) => CHART.padT + innerH - ((v - yMin) / Math.max(yMax - yMin, 0.01)) * innerH;

    const portfolioPath = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yScale(p.index).toFixed(1)}`)
      .join(" ");

    const kospiSegments: string[] = [];
    for (let i = 0; i < pts.length; i++) {
      const k = kMap.get(pts[i].date);
      if (k == null) continue;
      kospiSegments.push(`${kospiSegments.length === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yScale(k).toFixed(1)}`);
    }
    const kospiPath = kospiSegments.join(" ");

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const v = yMin + (yMax - yMin) * (1 - t);
      return { y: yScale(v), label: v.toFixed(0) };
    });

    const xTickIdx = pickTicks(n, 5);
    const xTicks = xTickIdx.map((i) => ({ x: xAt(i), label: formatDateLabel(pts[i].date) }));

    return { portfolioPath, kospiPath, yTicks, xTicks, baseY, hasKospi: data.kospiIndex.length >= 2 };
  }, [data]);

  return (
    <section className={panelShell}>
      <div className={panelHeaderBar}>
        <AreaSectionTitle as="h2">포트폴리오 vs KOSPI</AreaSectionTitle>
        <AreaSectionSubtitle>
          일별 스냅샷 기준 누적 수익률(지수 100) · 최대 90일
          {data?.fetchedAt && (
            <>
              {" · "}
              {new Date(data.fetchedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 갱신
            </>
          )}
        </AreaSectionSubtitle>

        {data && data.portfolioIndex.length >= 2 && (
          <div className="mt-2 flex flex-wrap gap-3 text-xs tabular-nums">
            <span className="font-semibold text-gain">내 수익 {fmtPct(data.portfolioChangePct)}</span>
            {chart?.hasKospi && (
              <span className="font-semibold text-ink-muted">KOSPI {fmtPct(data.kospiChangePct)}</span>
            )}
            {data.alpha != null && (
              <span className={`font-bold ${data.alpha >= 0 ? "text-gain" : "text-loss"}`}>
                α {data.alpha >= 0 ? "+" : ""}
                {data.alpha.toFixed(2)}%p
              </span>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-line">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink-muted/50" />
          </div>
        )}

        {error && !loading && (
          <p className="px-3 py-8 text-center text-xs text-amber-800">
            {error}
            {snapCount >= 2 && (
              <span className="mt-1 block text-ink-muted">
                KOSPI 외부 조회 실패 시 스냅샷 데이터만으로 표시됩니다. ① 판단 탭에서 시세를 새로고침해 주세요.
              </span>
            )}
          </p>
        )}

        {!loading && snapCount < 2 && (
          <p className="px-3 py-8 text-center text-xs text-ink-muted">
            앱을 2일 이상 사용하면 일별 스냅샷이 쌓여 비교 차트가 표시됩니다. (현재 {snapCount}일)
          </p>
        )}

        {!loading && snapCount >= 2 && chart && (
          <>
            <svg viewBox={`0 0 ${CHART.w} ${CHART.h}`} className="block w-full touch-none select-none" role="img" aria-label="포트폴리오 KOSPI 비교 차트">
              <rect x="0" y="0" width={CHART.w} height={CHART.h} fill="#f8fafc" />
              <rect
                x={CHART.padL}
                y={CHART.padT}
                width={CHART.w - CHART.padL - CHART.padR}
                height={CHART.h - CHART.padT - CHART.padB}
                fill="#ffffff"
                stroke="#e8edf2"
                strokeWidth="0.35"
              />

              {chart.yTicks.map((t, i) => (
                <g key={t.label}>
                  <line
                    x1={CHART.padL}
                    x2={CHART.w - CHART.padR}
                    y1={t.y}
                    y2={t.y}
                    stroke="#eef2f6"
                    strokeWidth="0.5"
                    strokeDasharray="1.5 4"
                    opacity="0.7"
                  />
                  <text
                    x={CHART.padL - 3}
                    y={yAxisLabelY(t.y, i, chart.yTicks.length)}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize={AXIS_FONT}
                    fontWeight="500"
                  >
                    {t.label}
                  </text>
                </g>
              ))}

              {chart.hasKospi && chart.kospiPath && (
                <path d={chart.kospiPath} fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" opacity="0.75" />
              )}

              <path
                d={chart.portfolioPath}
                fill="none"
                stroke="#dc2626"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />

              {chart.xTicks.map((t) => (
                <text key={t.label + t.x} x={t.x} y={xAxisLabelY()} textAnchor="middle" fill="#64748b" fontSize={AXIS_FONT} fontWeight="500">
                  {t.label}
                </text>
              ))}
            </svg>

            <div className="flex flex-wrap items-center justify-center gap-x-4 border-t border-line/40 px-3 py-2 text-[10px] text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-0 w-4 border-t-2 border-gain" />
                내 포트폴리오
              </span>
              {chart.hasKospi && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-0 w-4 border-t border-dashed border-slate-400" />
                  KOSPI
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
