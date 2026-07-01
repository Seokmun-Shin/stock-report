"use client";

import { useMemo, useState } from "react";
import type { AppData } from "@/lib/types";
import { fmt, fmtSigned } from "@/lib/calc";
import { buildPeriodReport, summarizePeriodTotals, type PeriodKind } from "@/lib/periodReport";
import { CollapsibleSection, SummaryChip } from "./CollapsibleSection";

export function PeriodReportPanel({ data }: { data: AppData }) {
  const [kind, setKind] = useState<PeriodKind>("month");
  const buckets = useMemo(() => buildPeriodReport(data, kind), [data, kind]);
  const totals = summarizePeriodTotals(buckets);
  const tone = totals.totalRealized >= 0 ? "gain" : "loss";

  return (
    <CollapsibleSection
      title="기간별 실현손익"
      unit
      summary={
        <>
          <SummaryChip label="실현 합계" value={fmtSigned(totals.totalRealized)} tone={tone} />
          <SummaryChip label="매도" value={`${totals.totalSells}건`} />
        </>
      }
    >
      <div className="mb-3 flex gap-2">
        {(["month", "year"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              kind === k ? "bg-ink text-white" : "border border-line text-ink-muted hover:bg-surface-dim"
            }`}
          >
            {k === "month" ? "월별" : "연별"}
          </button>
        ))}
      </div>

      {buckets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
          매매 내역이 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-surface-dim text-xs text-ink-muted">
              <tr>
                <th className="px-3 py-2.5 text-left">기간</th>
                <th className="px-3 py-2.5 text-right">매수</th>
                <th className="px-3 py-2.5 text-right">매도</th>
                <th className="px-3 py-2.5 text-right">실현손익</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((b) => (
                <tr key={b.key} className="border-t border-line">
                  <td className="px-3 py-2.5 font-semibold text-ink">{b.label}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink-muted">{b.buyCount}건</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink-muted">{b.sellCount}건</td>
                  <td
                    className={`px-3 py-2.5 text-right tabular-nums font-bold ${b.realizedPnl >= 0 ? "text-gain" : "text-loss"}`}
                  >
                    {fmtSigned(b.realizedPnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs text-ink-muted">FIFO 기준 매도 건별 실현손익 합계 · 배당은 별도 이벤트로 기록</p>
    </CollapsibleSection>
  );
}
