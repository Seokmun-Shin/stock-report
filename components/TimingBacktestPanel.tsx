"use client";

import { useMemo } from "react";
import type { AppData } from "@/lib/types";
import { runTimingBacktest } from "@/lib/backtest/timingBacktest";
import { PanelCard, PageSectionTitle } from "@/components/ui/PanelCard";

function pct(n: number, total: number): string {
  if (total <= 0) return "—";
  return `${Math.round((n / total) * 100)}%`;
}

export function TimingBacktestPanel({ data }: { data: AppData }) {
  const result = useMemo(() => runTimingBacktest(data), [data]);

  if (result.buyTotal + result.sellTotal === 0) {
    return (
      <PanelCard>
        <PageSectionTitle>타이밍 규칙 점검</PageSectionTitle>
        <p className="mt-2 text-xs text-ink-muted">체결 기록이 쌓이면 설정한 % 구간 대비 준수율을 보여줍니다.</p>
      </PanelCard>
    );
  }

  return (
    <PanelCard>
      <PageSectionTitle>타이밍 규칙 점검</PageSectionTitle>
      <p className="mt-1 text-xs text-ink-muted">
        내 체결가가 당시 매수·매도 타이밍선(1·2단계) 안에 있었는지 — 규칙 튜닝 참고용
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface-dim/40 px-3 py-2">
          <p className="text-[10px] text-ink-muted">매수 구간 준수</p>
          <p className="text-lg font-bold tabular-nums text-gain">
            {result.buyInZone}/{result.buyTotal}
          </p>
          <p className="text-[10px] text-ink-muted">{pct(result.buyInZone, result.buyTotal)}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface-dim/40 px-3 py-2">
          <p className="text-[10px] text-ink-muted">매도 구간 준수</p>
          <p className="text-lg font-bold tabular-nums text-loss">
            {result.sellInZone}/{result.sellTotal}
          </p>
          <p className="text-[10px] text-ink-muted">{pct(result.sellInZone, result.sellTotal)}</p>
        </div>
      </div>
      {result.rows.length > 0 && (
        <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-line text-xs">
          <table className="w-full">
            <thead className="bg-surface-dim text-ink-muted">
              <tr>
                <th className="px-2 py-1 text-left">일자</th>
                <th className="px-2 py-1 text-left">종목</th>
                <th className="px-2 py-1">구분</th>
                <th className="px-2 py-1 text-right">체결가</th>
                <th className="px-2 py-1">구간</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="px-2 py-1 tabular-nums">{r.date}</td>
                  <td className="px-2 py-1">{r.stockName}</td>
                  <td className="px-2 py-1 text-center">{r.type === "buy" ? "매수" : "매도"}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{r.price.toLocaleString()}</td>
                  <td className={`px-2 py-1 text-center font-semibold ${r.inZone ? "text-gain" : "text-ink-muted"}`}>
                    {r.inZone ? "✓" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelCard>
  );
}
