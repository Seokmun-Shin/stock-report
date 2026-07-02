"use client";

import type { SideVerdict } from "@/lib/briefing/tradingVerdict";
import { fmt, fmtPct, fmtSigned } from "@/lib/calc";
import type { ReportSettings } from "@/lib/reportSettings";
import { formatFeePct, resolveReportSettings } from "@/lib/reportSettings";

function stanceStyle(stance: SideVerdict["stance"], kind: "buy" | "sell") {
  if (stance === "skip") return "border-line bg-surface-dim/40";
  if (stance === "yes") return kind === "buy" ? "border-gain bg-gain-soft/40 ring-1 ring-gain/25" : "border-loss bg-loss-soft/40 ring-1 ring-loss/25";
  return "border-amber-200 bg-amber-50/60";
}

function stanceIcon(stance: SideVerdict["stance"]) {
  if (stance === "yes") return "●";
  if (stance === "skip") return "—";
  return "○";
}

function ConfidenceScale({ value, stance }: { value: number; stance: SideVerdict["stance"] }) {
  const markerColor = stance === "yes" ? "bg-gain" : "bg-amber-500";
  const label = stance === "yes" ? "신호 강도" : "판단 확실도";

  return (
    <div>
      <p className="text-[11px] font-medium text-ink-muted">{label}</p>
      <div className="relative mt-2 px-2 pb-1 pt-4">
        <div className="absolute left-2 right-2 top-1/2 h-px -translate-y-1/2 bg-slate-300" />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${Math.min(100, Math.max(0, value))}%` }}
        >
          <span className="absolute bottom-[calc(100%+2px)] left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold leading-none tabular-nums text-ink">
            {value}%
          </span>
          <div
            className={`h-3 w-3 rounded-full border-2 border-white shadow-sm ${markerColor}`}
            aria-hidden
          />
        </div>
        <div className="mt-5 flex justify-between text-[10px] tabular-nums text-ink-muted">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

function profitTone(n: number) {
  return n >= 0 ? "text-gain" : "text-loss";
}

function ProfitLine({ label, profit, pct }: { label: string; profit: number; pct: number }) {
  return (
    <p className="leading-relaxed">
      {label}{" "}
      <span className={`font-semibold tabular-nums ${profitTone(profit)}`}>
        {fmtSigned(profit)} ({fmtPct(pct)})
      </span>
    </p>
  );
}

export function VerdictCard({
  kind,
  verdict,
  stockName,
  feeSettings,
}: {
  kind: "buy" | "sell";
  verdict: SideVerdict;
  stockName?: string;
  feeSettings?: Partial<ReportSettings>;
}) {
  const question = kind === "buy" ? "지금 살까?" : "지금 팔까?";
  const accent = kind === "buy" ? "text-gain" : "text-loss";
  const targetLabel = kind === "buy" ? (verdict.stance === "wait" ? "기다릴 가격" : "추천 매수가") : "목표 매도가";
  const rangeLabel = kind === "buy" ? "매수해도 되는 범위" : "매도해도 되는 범위";
  const fees = resolveReportSettings(feeSettings);
  const sellCostNote = `매도 ${formatFeePct(fees.sellTotalFeePct!)} 수수료 · ${formatFeePct(fees.sellTransactionTaxPct!)} 증권거래세 참고`;

  return (
    <div className={`flex h-full min-h-0 flex-col rounded-2xl border p-4 ${stanceStyle(verdict.stance, kind)}`}>
      {stockName && (
        <p className="truncate text-lg font-bold text-ink sm:text-xl">{stockName}</p>
      )}
      <p className="mt-0.5 text-xs font-medium text-ink-muted">{question}</p>

      <p
        className={`mt-2 min-h-[3.25rem] text-xl font-bold leading-snug sm:min-h-[3.5rem] sm:text-2xl ${
          verdict.stance === "skip" ? "text-ink-muted" : "text-ink"
        }`}
      >
        <span className={`mr-1 ${accent}`}>{stanceIcon(verdict.stance)}</span>
        {verdict.headline}
      </p>

      {verdict.stance !== "skip" && (
        <>
          <p className={`mt-2 text-sm font-semibold ${accent}`}>{verdict.when}</p>
          <p className="mt-0.5 text-[11px] font-medium text-ink-muted">{targetLabel}</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-ink sm:text-3xl">{fmt(verdict.targetPrice)}</p>
          <p className="mt-1 text-sm tabular-nums text-ink-muted">
            {rangeLabel} {fmt(verdict.priceRange.min)} ~ {fmt(verdict.priceRange.max)}
          </p>

          <div className="mt-2">
            <ConfidenceScale value={verdict.confidence} stance={verdict.stance} />
          </div>

          <div className="mt-3 min-h-[7.75rem]">
            {kind === "buy" && verdict.stance === "wait" && (
              <p className="text-[11px] leading-snug text-amber-800">
                아직 목표보다 비쌉니다. 위 가격 이하로 내려올 때만 매수를 검토하세요.
              </p>
            )}
            {kind === "sell" && verdict.sellProfitPreview && (
              <div className="rounded-lg border border-line/80 bg-surface-dim/50 px-3 py-2.5 text-xs text-ink-muted">
                <p className="font-semibold text-ink">예상 실현 손익 (전량 · 세금·수수료 후)</p>
                <div className="mt-1.5 space-y-1">
                  <ProfitLine
                    label="지금 팔면"
                    profit={verdict.sellProfitPreview.atNow.netProfit}
                    pct={verdict.sellProfitPreview.atNow.netProfitPct}
                  />
                  {verdict.sellProfitPreview.atTarget && (
                    <ProfitLine
                      label={`목표 ${fmt(verdict.sellProfitPreview.atTarget.sellPrice)}에 팔면`}
                      profit={verdict.sellProfitPreview.atTarget.netProfit}
                      pct={verdict.sellProfitPreview.atTarget.netProfitPct}
                    />
                  )}
                </div>
                <p className="mt-1.5 text-[10px] leading-snug">{sellCostNote}</p>
              </div>
            )}
            {kind === "sell" && verdict.stance === "wait" && !verdict.sellProfitPreview && (
              <p className="text-[11px] leading-snug text-amber-800">
                아직 목표 매도가보다 낮습니다. 손실이 나도 급하게 팔 필요는 없다는 뜻입니다.
              </p>
            )}
          </div>

          <div className="mt-1 flex flex-1 flex-col">
            {verdict.stance === "wait" && kind === "sell" && verdict.sellProfitPreview && (
              <p className="text-[10px] text-ink-muted/80">
                지금 당장 팔라는 뜻이 아닙니다 · 데이터를 반영한 보유 판단
              </p>
            )}
            {verdict.stance === "wait" && kind === "buy" && (
              <p className="text-[10px] text-ink-muted/80">
                지금 당장 사라는 뜻이 아닙니다 · 데이터를 반영한 대기 판단
              </p>
            )}
            {verdict.dataQuality < 0.5 && (
              <p className="mt-1 text-[10px] text-amber-700">시세·뉴스·매매기록을 더 불러오면 정확도가 올라갑니다</p>
            )}
            <ul className="mt-3 space-y-1 border-t border-line/60 pt-2">
              {verdict.reasons.map((r, i) => (
                <li key={i} className="text-xs leading-relaxed text-ink-muted">
                  · {r}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      {verdict.stance === "skip" && (
        <p className="mt-2 text-xs text-ink-muted">{verdict.reasons[0]}</p>
      )}
    </div>
  );
}
