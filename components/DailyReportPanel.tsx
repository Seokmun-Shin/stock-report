"use client";

import { useMemo, useState } from "react";
import type { AppData } from "@/lib/types";
import type { PortfolioSummary } from "@/lib/types";
import type { BuyTimingSignal, SellTimingSignal, StockSummary } from "@/lib/types";
import { fmt, fmtPct, fmtSigned } from "@/lib/calc";
import { buildDailyReport, formatDailyReportText } from "@/lib/dailyReport";
import { buildMarketBrief, formatMarketBriefText } from "@/lib/briefing/marketBrief";
import type { MarketBriefingContext, TradeRecommendation } from "@/lib/briefing/types";
import type { ReportSettings } from "@/lib/reportSettings";
import { CollapsibleSection, SummaryChip } from "./CollapsibleSection";
import { StrategySettingsForm } from "./StrategySettingsForm";
import { TimingZonesBriefRow, TimingZonesPanel } from "./TimingZonesPanel";

function AlertBadge({ kind }: { kind: "buy" | "sell" | "watch" }) {
  if (kind === "buy") {
    return (
      <span className="rounded-md bg-red-500/12 px-2 py-0.5 text-xs font-semibold text-gain">매수</span>
    );
  }
  if (kind === "sell") {
    return (
      <span className="rounded-md bg-blue-500/12 px-2 py-0.5 text-xs font-semibold text-loss">매도</span>
    );
  }
  return (
    <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-zinc-300">관망</span>
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
  marketContext,
  recommendations = [],
}: {
  data: AppData;
  portfolio: PortfolioSummary;
  summaries: Record<string, StockSummary>;
  buySignals: Record<string, BuyTimingSignal>;
  sellSignals: Record<string, SellTimingSignal>;
  onSettingsChange: (settings: ReportSettings) => void;
  onOpenStock: (stockId: string) => void;
  marketContext?: MarketBriefingContext | null;
  recommendations?: TradeRecommendation[];
}) {
  const report = useMemo(
    () => buildDailyReport(data, portfolio, summaries, buySignals, sellSignals),
    [data, portfolio, summaries, buySignals, sellSignals]
  );

  const marketBrief = useMemo(
    () => buildMarketBrief(data, portfolio, summaries, buySignals, sellSignals),
    [data, portfolio, summaries, buySignals, sellSignals]
  );

  const planByStock = useMemo(
    () => new Map(marketBrief.stockPlans.map((p) => [p.stockId, p])),
    [marketBrief]
  );

  const recByStock = useMemo(
    () => new Map(recommendations.map((r) => [r.stockId, r])),
    [recommendations]
  );

  const [copied, setCopied] = useState(false);
  const settings = report.settings;

  const pnlTone = portfolio.totalPnl >= 0 ? "gain" : "loss";
  const alertCount = report.headlineAlerts.length;

  async function copyReport() {
    await navigator.clipboard.writeText(formatDailyReportText(report) + formatMarketBriefText(marketBrief));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function saveSettings(next: ReportSettings) {
    onSettingsChange(next);
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
        <div className="ui-inner-block">
          <p className="text-sm font-semibold text-white">시장·데이터 원천</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-300">{marketBrief.marketSummary.join(" · ")}</p>
          <p className="mt-2 text-[11px] text-zinc-300">
            자동: {marketBrief.sources.map((s) => s.label).join(", ")}
            {marketContext?.sources && (
              <> · 외부 {marketContext.sources.filter((s) => s.ok).length}/{marketContext.sources.length} 원천</>
            )}
          </p>
        </div>

        {report.headlineAlerts.length > 0 ? (
          <div className="rounded-xl border border-gain/20 bg-red-500/12 p-3">
            <p className="text-sm font-semibold text-white">오늘의 시그널</p>
            <ul className="mt-2 space-y-2">
              {report.headlineAlerts.map((a, i) => {
                const name = report.rows.find((r) => r.stock.id === a.stockId)?.stock.name ?? "";
                return (
                  <li key={`${a.stockId}-${i}`} className="flex flex-wrap items-start gap-2 text-sm">
                    <AlertBadge kind={a.kind} />
                    <span className="font-semibold text-white">{name}</span>
                    <span className="text-zinc-300">
                      {a.title} — {a.detail}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="ui-inner-block border border-dashed border-white/10 px-4 py-3 text-sm text-zinc-300">
            설정 시그널·타이밍선 구간에 해당하는 종목이 없습니다. 관망 구간입니다.
          </p>
        )}

        <div className="min-w-0 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-white/10 text-xs text-zinc-300">
              <tr>
                <th className="px-3 py-2.5 text-left">종목</th>
                <th className="px-3 py-2.5 text-right">현재가</th>
                <th className="px-3 py-2.5 text-right">전일比</th>
                <th className="px-3 py-2.5 text-right">고점比</th>
                <th className="px-3 py-2.5 text-right">평단比</th>
                <th className="px-3 py-2.5 text-right">평가손익</th>
                <th className="px-3 py-2.5 text-center">매매 구간</th>
                <th className="px-3 py-2.5 text-center">추천</th>
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
                    className="cursor-pointer border-t border-white/10 hover:bg-white/10"
                    onClick={() => onOpenStock(stock.id)}
                  >
                    <td className="px-3 py-2.5 font-semibold text-white">{stock.name}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(summary.currentPrice)}</td>
                    <td
                      className={`px-3 py-2.5 text-right tabular-nums ${
                        priceChangePctFromPrev != null
                          ? priceChangePctFromPrev >= 0
                            ? "text-gain"
                            : "text-loss"
                          : "text-zinc-300"
                      }`}
                    >
                      {priceChangePctFromPrev != null ? fmtPct(priceChangePctFromPrev) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-zinc-300">
                      {dropFromPeakPct != null ? `−${dropFromPeakPct.toFixed(1)}%` : "—"}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right tabular-nums ${
                        gainFromAvgPct != null ? (gainFromAvgPct >= 0 ? "text-gain" : "text-loss") : "text-zinc-300"
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
                    <td className="px-3 py-2.5 text-center text-xs text-white">
                      {planByStock.get(stock.id) ? (
                        <TimingZonesBriefRow plan={planByStock.get(stock.id)!} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs">
                      {(() => {
                        const rec = recByStock.get(stock.id);
                        if (!rec) return "—";
                        const label = rec.action === "buy" ? "매수" : rec.action === "sell" ? "매도" : "관망";
                        const tone =
                          rec.action === "buy" ? "text-gain" : rec.action === "sell" ? "text-loss" : "text-zinc-300";
                        return (
                          <span className={tone}>
                            {label} · {fmt(rec.suggestedPrice)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs">
                      <span className="text-gain">{buySignal.label}</span>
                      <span className="text-zinc-300"> / </span>
                      <span className="text-slate-600">{sellSignal.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {marketBrief.stockPlans.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">종목별 매매 타이밍·구간</p>
            {marketBrief.stockPlans.map((plan) => (
              <div key={plan.stockId} className="rounded-xl border border-white/10 p-3">
                <button
                  type="button"
                  className="mb-2 text-left font-semibold text-gain hover:underline"
                  onClick={() => onOpenStock(plan.stockId)}
                >
                  {plan.stockName}
                </button>
                <TimingZonesPanel plan={plan} compact />
              </div>
            ))}
          </div>
        )}

        <StrategySettingsForm settings={settings} onSave={saveSettings} />

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={copyReport}
            className="ui-btn-secondary text-sm px-4 py-2"
          >
            {copied ? "복사됨" : "리포트 텍스트 복사"}
          </button>
        </div>
      </div>
    </CollapsibleSection>
  );
}
