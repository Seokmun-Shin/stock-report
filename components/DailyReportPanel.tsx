"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppData } from "@/lib/types";
import type { PortfolioSummary } from "@/lib/types";
import type { BuyTimingSignal, SellTimingSignal, StockSummary } from "@/lib/types";
import { fmt, fmtPct, fmtSigned } from "@/lib/calc";
import { buildDailyReport, formatDailyReportText } from "@/lib/dailyReport";
import { DEFAULT_REPORT_SETTINGS } from "@/lib/reportSettings";
import { CollapsibleSection, SummaryChip } from "./CollapsibleSection";
import { SectionTitle } from "./StatCard";

function AlertBadge({ kind }: { kind: "buy" | "sell" | "watch" }) {
  if (kind === "buy") {
    return (
      <span className="rounded-md bg-gain-soft px-2 py-0.5 text-xs font-semibold text-gain">매수</span>
    );
  }
  if (kind === "sell") {
    return (
      <span className="rounded-md bg-loss-soft px-2 py-0.5 text-xs font-semibold text-loss">매도</span>
    );
  }
  return (
    <span className="rounded-md bg-surface-dim px-2 py-0.5 text-xs font-semibold text-ink-muted">관망</span>
  );
}

export function DailyReportPanel({
  data,
  portfolio,
  summaries,
  buySignals,
  sellSignals,
  onSettingsChange,
  onOpenStock,
}: {
  data: AppData;
  portfolio: PortfolioSummary;
  summaries: Record<string, StockSummary>;
  buySignals: Record<string, BuyTimingSignal>;
  sellSignals: Record<string, SellTimingSignal>;
  onSettingsChange: (buyDrop: number, sellGain: number) => void;
  onOpenStock: (stockId: string) => void;
}) {
  const report = useMemo(
    () => buildDailyReport(data, portfolio, summaries, buySignals, sellSignals),
    [data, portfolio, summaries, buySignals, sellSignals]
  );

  const [copied, setCopied] = useState(false);
  const settings = report.settings;
  const [buyDrop, setBuyDrop] = useState(settings.buyDropFromPeakPct);
  const [sellGain, setSellGain] = useState(settings.sellGainFromAvgPct);

  useEffect(() => {
    setBuyDrop(settings.buyDropFromPeakPct);
    setSellGain(settings.sellGainFromAvgPct);
  }, [settings.buyDropFromPeakPct, settings.sellGainFromAvgPct]);

  const pnlTone = portfolio.totalPnl >= 0 ? "gain" : "loss";
  const alertCount = report.headlineAlerts.length;

  async function copyReport() {
    await navigator.clipboard.writeText(formatDailyReportText(report));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function saveSettings() {
    onSettingsChange(buyDrop, sellGain);
  }

  return (
    <CollapsibleSection
      title="일일 브리핑"
      unit
      defaultOpen
      subtitle={
        report.previousSnapshotDate
          ? `${report.reportDate} · 전일(${report.previousSnapshotDate}) 대비`
          : `${report.reportDate} · 내일부터 전일 대비 표시`
      }
      summary={
        <>
          <SummaryChip label="누적 손익" value={fmtSigned(portfolio.totalPnl)} tone={pnlTone} />
          {report.portfolioPnlChange != null && (
            <SummaryChip
              label="전일比"
              value={fmtSigned(report.portfolioPnlChange)}
              tone={report.portfolioPnlChange >= 0 ? "gain" : "loss"}
            />
          )}
          {alertCount > 0 && (
            <SummaryChip label="시그널" value={`${alertCount}건`} tone={alertCount > 0 ? "gain" : undefined} />
          )}
        </>
      }
    >
      <div className="space-y-4">
        {report.headlineAlerts.length > 0 ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
            <p className="text-sm font-semibold text-ink">오늘의 시그널</p>
            <ul className="mt-2 space-y-2">
              {report.headlineAlerts.map((a, i) => {
                const name = report.rows.find((r) => r.stock.id === a.stockId)?.stock.name ?? "";
                return (
                  <li key={`${a.stockId}-${i}`} className="flex flex-wrap items-start gap-2 text-sm">
                    <AlertBadge kind={a.kind} />
                    <span className="font-semibold text-ink">{name}</span>
                    <span className="text-ink-muted">
                      {a.title} — {a.detail}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-line bg-surface-dim/40 px-4 py-3 text-sm text-ink-muted">
            설정 시그널·타이밍선 구간에 해당하는 종목이 없습니다. 관망 구간입니다.
          </p>
        )}

        <div className="min-w-0 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-surface-dim text-xs text-ink-muted">
              <tr>
                <th className="px-3 py-2.5 text-left">종목</th>
                <th className="px-3 py-2.5 text-right">현재가</th>
                <th className="px-3 py-2.5 text-right">전일比</th>
                <th className="px-3 py-2.5 text-right">고점比</th>
                <th className="px-3 py-2.5 text-right">평단比</th>
                <th className="px-3 py-2.5 text-right">평가손익</th>
                <th className="px-3 py-2.5 text-center">타이밍</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => {
                const { stock, summary, priceChangePctFromPrev, dropFromPeakPct, gainFromAvgPct, buySignal, sellSignal } =
                  row;
                const evalTone = summary.unrealizedPnlWithCost >= 0 ? "text-gain" : "text-loss";
                return (
                  <tr
                    key={stock.id}
                    className="cursor-pointer border-t border-line hover:bg-surface-dim/60"
                    onClick={() => onOpenStock(stock.id)}
                  >
                    <td className="px-3 py-2.5 font-semibold text-ink">{stock.name}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(summary.currentPrice)}</td>
                    <td
                      className={`px-3 py-2.5 text-right tabular-nums ${
                        priceChangePctFromPrev != null
                          ? priceChangePctFromPrev >= 0
                            ? "text-gain"
                            : "text-loss"
                          : "text-ink-muted"
                      }`}
                    >
                      {priceChangePctFromPrev != null ? fmtPct(priceChangePctFromPrev) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-muted">
                      {dropFromPeakPct != null ? `−${dropFromPeakPct.toFixed(1)}%` : "—"}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right tabular-nums ${
                        gainFromAvgPct != null ? (gainFromAvgPct >= 0 ? "text-gain" : "text-loss") : "text-ink-muted"
                      }`}
                    >
                      {gainFromAvgPct != null ? fmtPct(gainFromAvgPct) : "—"}
                    </td>
                    <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${evalTone}`}>
                      {summary.holdingQty > 0 ? (
                        <>
                          {fmtSigned(summary.unrealizedPnlWithCost)}
                          <span className="ml-1 text-xs">({fmtPct(summary.unrealizedPnlPct)})</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs">
                      <span className="text-gain">{buySignal.label}</span>
                      <span className="text-ink-muted"> / </span>
                      <span className="text-slate-600">{sellSignal.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-line bg-surface-dim/30 p-3">
          <SectionTitle>시그널 설정</SectionTitle>
          <p className="mt-1 text-xs text-ink-muted">
            고점·평단은 앱에 기록된 데이터 기준 · 타이밍선(±10/20%)과 함께 판단
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-xs text-ink-muted">
              고점 대비 매수 (−%)
              <input
                type="number"
                min={1}
                max={50}
                className="mt-1 w-24 rounded-lg border border-line px-2 py-1.5 text-right tabular-nums"
                value={buyDrop}
                onChange={(e) => setBuyDrop(Number(e.target.value))}
              />
            </label>
            <label className="text-xs text-ink-muted">
              평단 대비 매도 (+%)
              <input
                type="number"
                min={1}
                max={100}
                className="mt-1 w-24 rounded-lg border border-line px-2 py-1.5 text-right tabular-nums"
                value={sellGain}
                onChange={(e) => setSellGain(Number(e.target.value))}
              />
            </label>
            <button
              type="button"
              onClick={saveSettings}
              className="rounded-lg bg-gain px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              적용
            </button>
            <button
              type="button"
              onClick={() => {
                setBuyDrop(DEFAULT_REPORT_SETTINGS.buyDropFromPeakPct);
                setSellGain(DEFAULT_REPORT_SETTINGS.sellGainFromAvgPct);
              }}
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-muted hover:bg-white"
            >
              기본값
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={copyReport}
            className="rounded-lg border border-line bg-white px-4 py-2 text-sm text-ink-muted hover:bg-surface-dim"
          >
            {copied ? "복사됨" : "리포트 텍스트 복사"}
          </button>
        </div>
      </div>
    </CollapsibleSection>
  );
}
