"use client";

import { useMemo } from "react";
import type { AppData } from "@/lib/types";
import { runTimingBacktest } from "@/lib/backtest/timingBacktest";
import { PanelCard, AreaCardHeader } from "@/components/ui/PanelCard";

function pct(n: number, total: number): string {
  if (total <= 0) return "—";
  return `${Math.round((n / total) * 100)}%`;
}

export function TimingBacktestPanel({ data }: { data: AppData }) {
  const result = useMemo(() => runTimingBacktest(data), [data]);

  if (result.buyTotal + result.sellTotal === 0) {
    return (
      <PanelCard>
        <AreaCardHeader
          title="타이밍 규칙 점검"
          subtitle="체결 기록이 쌓이면 설정한 % 구간 대비 준수율을 보여줍니다."
        />
      </PanelCard>
    );
  }

  return (
    <PanelCard>
      <AreaCardHeader
        title="타이밍 규칙 점검"
        subtitle="내 체결가가 당시 매수·매도 타이밍선(1·2단계) 안에 있었는지 — 규칙 튜닝 참고용"
      />
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="ui-inner-block py-2">
          <p className="text-[10px] text-zinc-300">매수 구간 준수</p>
          <p className="text-lg font-bold tabular-nums text-gain">
            {result.buyInZone}/{result.buyTotal}
          </p>
          <p className="text-[10px] text-zinc-300">{pct(result.buyInZone, result.buyTotal)}</p>
        </div>
        <div className="ui-inner-block py-2">
          <p className="text-[10px] text-zinc-300">매도 구간 준수</p>
          <p className="text-lg font-bold tabular-nums text-loss">
            {result.sellInZone}/{result.sellTotal}
          </p>
          <p className="text-[10px] text-zinc-300">{pct(result.sellInZone, result.sellTotal)}</p>
        </div>
      </div>
      {result.rows.length > 0 && (
        <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-white/10 text-xs">
          <table className="w-full">
            <thead className="bg-white/10 text-zinc-300">
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
                <tr key={i} className="border-t border-white/10">
                  <td className="px-2 py-1 tabular-nums">{r.date}</td>
                  <td className="px-2 py-1">{r.stockName}</td>
                  <td className="px-2 py-1 text-center">{r.type === "buy" ? "매수" : "매도"}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{r.price.toLocaleString()}</td>
                  <td className={`px-2 py-1 text-center font-semibold ${r.inZone ? "text-gain" : "text-zinc-300"}`}>
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
