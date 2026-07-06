"use client";

import { Fragment, type ReactNode } from "react";
import type { SideVerdict } from "@/lib/briefing/tradingVerdict";
import { fmt, fmtPct, fmtSigned } from "@/lib/calc";
import type { ReportSettings } from "@/lib/reportSettings";
import { formatFeePct, resolveReportSettings } from "@/lib/reportSettings";

function cellStyle(stance: SideVerdict["stance"], kind: "buy" | "sell") {
  if (stance === "skip") return "bg-surface-dim/40";
  if (stance === "yes") return kind === "buy" ? "bg-gain-soft/40" : "bg-loss-soft/40";
  return "bg-amber-50/60";
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
    <div className="flex h-full flex-col">
      <p className="shrink-0 text-[11px] font-medium text-ink-muted">{label}</p>
      <div className="relative mt-2 flex flex-1 flex-col justify-center px-2 pb-0 pt-3">
        <div className="absolute left-2 right-2 top-[calc(50%+4px)] h-px -translate-y-1/2 bg-slate-300" />
        <div
          className="absolute top-[calc(50%+4px)] -translate-x-1/2 -translate-y-1/2"
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
        <div className="mt-auto flex justify-between pt-6 text-[10px] tabular-nums text-ink-muted">
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

function PairRow({
  buy,
  sell,
  buyStance,
  sellStance,
  className = "",
}: {
  buy: ReactNode;
  sell: ReactNode;
  buyStance: SideVerdict["stance"];
  sellStance: SideVerdict["stance"];
  className?: string;
}) {
  return (
    <>
      <div className={`h-full px-4 ${cellStyle(buyStance, "buy")} ${className}`}>{buy}</div>
      <div className={`h-full px-4 ${cellStyle(sellStance, "sell")} ${className}`}>{sell}</div>
    </>
  );
}

function SideNotes({ kind, verdict }: { kind: "buy" | "sell"; verdict: SideVerdict }) {
  const lines: ReactNode[] = [];

  if (kind === "buy" && verdict.stance === "wait") {
    lines.push(
      <p key="wait" className="text-[11px] leading-snug text-amber-800">
        아직 목표보다 비쌉니다. 위 가격 이하로 내려올 때만 매수를 검토하세요.
      </p>
    );
  }
  if (kind === "sell" && verdict.stance === "wait" && !verdict.sellProfitPreview) {
    lines.push(
      <p key="wait" className="text-[11px] leading-snug text-amber-800">
        아직 목표 매도가보다 낮습니다. 손실이 나도 급하게 팔 필요는 없다는 뜻입니다.
      </p>
    );
  }
  if (verdict.stance === "wait" && kind === "sell" && verdict.sellProfitPreview) {
    lines.push(
      <p key="hold" className="text-[10px] text-ink-muted/80">
        지금 당장 팔라는 뜻이 아닙니다 · 데이터를 반영한 보유 판단
      </p>
    );
  }
  if (verdict.stance === "wait" && kind === "buy") {
    lines.push(
      <p key="hold" className="text-[10px] text-ink-muted/80">
        지금 당장 사라는 뜻이 아닙니다 · 데이터를 반영한 대기 판단
      </p>
    );
  }
  if (verdict.dataQuality < 0.5) {
    lines.push(
      <p key="quality" className="text-[10px] text-amber-700">
        시세·뉴스·매매기록을 더 불러오면 정확도가 올라갑니다
      </p>
    );
  }

  if (lines.length === 0) return <span className="block min-h-[1px]" aria-hidden />;

  return <div className="space-y-1">{lines}</div>;
}

function ProfitPreviewBox({
  preview,
  sellCostNote,
}: {
  preview: NonNullable<SideVerdict["sellProfitPreview"]>;
  sellCostNote: string;
}) {
  return (
    <div className="rounded-lg border border-line/80 bg-surface-dim/50 px-3 py-2.5 text-xs text-ink-muted">
      <p className="font-semibold text-ink">예상 실현 손익 (전량 · 세금·수수료 후)</p>
      <div className="mt-1.5 space-y-1">
        <ProfitLine label="지금 팔면" profit={preview.atNow.netProfit} pct={preview.atNow.netProfitPct} />
        {preview.atTarget && (
          <ProfitLine
            label={`목표 ${fmt(preview.atTarget.sellPrice)}에 팔면`}
            profit={preview.atTarget.netProfit}
            pct={preview.atTarget.netProfitPct}
          />
        )}
      </div>
      <p className="mt-1.5 text-[10px] leading-snug">{sellCostNote}</p>
    </div>
  );
}

/** 매수·매도 판단 — 행 단위 2열 그리드로 좌·우 라인 동기화 */
export function VerdictCardPair({
  buy,
  sell,
  stockName,
  feeSettings,
}: {
  buy: SideVerdict;
  sell: SideVerdict;
  stockName?: string;
  feeSettings?: Partial<ReportSettings>;
}) {
  const fees = resolveReportSettings(feeSettings);
  const sellCostNote = `매도 ${formatFeePct(fees.sellTotalFeePct!)} 수수료 · ${formatFeePct(fees.sellTransactionTaxPct!)} 증권거래세 참고`;
  const buyAccent = "text-gain";
  const sellAccent = "text-loss";
  const buyTargetLabel = buy.stance === "wait" ? "기다릴 가격" : "추천 매수가";
  const sellTargetLabel = "목표 매도가";
  const showProfitRow = sell.stance !== "skip" && !!sell.sellProfitPreview;
  const buyReasonCount = buy.stance === "skip" ? 0 : buy.reasons.length;
  const sellReasonCount = sell.stance === "skip" ? 0 : sell.reasons.length;
  const reasonRows = Math.max(buyReasonCount, sellReasonCount);
  const showDetail = buy.stance !== "skip" || sell.stance !== "skip";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x sm:divide-line">
        {/* 1. 종목 · 질문 */}
        <PairRow
          buyStance={buy.stance}
          sellStance={sell.stance}
          className="pt-4 pb-1"
          buy={
            <>
              {stockName && <p className="truncate text-lg font-bold text-ink sm:text-xl">{stockName}</p>}
              <p className="mt-0.5 text-xs font-medium text-ink-muted">지금 살까?</p>
            </>
          }
          sell={
            <>
              {stockName && <p className="truncate text-lg font-bold text-ink sm:text-xl">{stockName}</p>}
              <p className="mt-0.5 text-xs font-medium text-ink-muted">지금 팔까?</p>
            </>
          }
        />

        {/* 2. 판단 헤드라인 */}
        <PairRow
          buyStance={buy.stance}
          sellStance={sell.stance}
          className="pb-2"
          buy={
            buy.stance === "skip" ? (
              <p className="text-xs text-ink-muted">{buy.reasons[0]}</p>
            ) : (
              <p className="text-xl font-bold leading-snug text-ink sm:text-2xl">
                <span className={`mr-1 ${buyAccent}`}>{stanceIcon(buy.stance)}</span>
                {buy.headline}
              </p>
            )
          }
          sell={
            sell.stance === "skip" ? (
              <p className="text-xs text-ink-muted">{sell.reasons[0]}</p>
            ) : (
              <p className="text-xl font-bold leading-snug text-ink sm:text-2xl">
                <span className={`mr-1 ${sellAccent}`}>{stanceIcon(sell.stance)}</span>
                {sell.headline}
              </p>
            )
          }
        />

        {showDetail && (
          <>
            {/* 3. 목표가 · 범위 */}
            <PairRow
              buyStance={buy.stance}
              sellStance={sell.stance}
              className="pb-2"
              buy={
                buy.stance !== "skip" ? (
                  <>
                    <p className={`text-sm font-semibold ${buyAccent}`}>{buy.when}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-ink-muted">{buyTargetLabel}</p>
                    <p className="mt-0.5 text-2xl font-bold tabular-nums text-ink sm:text-3xl">{fmt(buy.targetPrice)}</p>
                    <p className="mt-1 text-sm tabular-nums text-ink-muted">
                      매수해도 되는 범위 {fmt(buy.priceRange.min)} ~ {fmt(buy.priceRange.max)}
                    </p>
                  </>
                ) : (
                  <span className="block min-h-[5.75rem]" aria-hidden />
                )
              }
              sell={
                sell.stance !== "skip" ? (
                  <>
                    <p className={`text-sm font-semibold ${sellAccent}`}>{sell.when}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-ink-muted">{sellTargetLabel}</p>
                    <p className="mt-0.5 text-2xl font-bold tabular-nums text-ink sm:text-3xl">{fmt(sell.targetPrice)}</p>
                    <p className="mt-1 text-sm tabular-nums text-ink-muted">
                      매도해도 되는 범위 {fmt(sell.priceRange.min)} ~ {fmt(sell.priceRange.max)}
                    </p>
                  </>
                ) : (
                  <span className="block min-h-[5.75rem]" aria-hidden />
                )
              }
            />

            {/* 4. 신호 강도 그래프 */}
            <PairRow
              buyStance={buy.stance}
              sellStance={sell.stance}
              className="h-[5.25rem] py-2"
              buy={
                buy.stance !== "skip" ? (
                  <div className="h-full">
                    <ConfidenceScale value={buy.confidence} stance={buy.stance} />
                  </div>
                ) : (
                  <span className="block h-full" aria-hidden />
                )
              }
              sell={
                sell.stance !== "skip" ? (
                  <div className="h-full">
                    <ConfidenceScale value={sell.confidence} stance={sell.stance} />
                  </div>
                ) : (
                  <span className="block h-full" aria-hidden />
                )
              }
            />

            {/* 5. 보조 안내 */}
            <PairRow
              buyStance={buy.stance}
              sellStance={sell.stance}
              className="py-2"
              buy={buy.stance !== "skip" ? <SideNotes kind="buy" verdict={buy} /> : <span className="block min-h-[1px]" aria-hidden />}
              sell={sell.stance !== "skip" ? <SideNotes kind="sell" verdict={sell} /> : <span className="block min-h-[1px]" aria-hidden />}
            />

            {/* 6+. 판단 근거 — 줄 번호별 좌·우 맞춤 */}
            {reasonRows === 0 ? (
              <PairRow
                buyStance={buy.stance}
                sellStance={sell.stance}
                className="border-t border-line/60 py-2"
                buy={<span className="text-xs text-ink-muted">{buy.stance === "skip" ? "" : "—"}</span>}
                sell={<span className="text-xs text-ink-muted">{sell.stance === "skip" ? "" : "—"}</span>}
              />
            ) : (
              Array.from({ length: reasonRows }, (_, i) => (
                <PairRow
                  key={`reason-${i}`}
                  buyStance={buy.stance}
                  sellStance={sell.stance}
                  className={`py-1 ${i === 0 ? "border-t border-line/60 pt-2" : ""}`}
                  buy={
                    buy.stance !== "skip" && buy.reasons[i] ? (
                      <p className="min-h-[1.25rem] text-xs leading-relaxed text-ink-muted">· {buy.reasons[i]}</p>
                    ) : (
                      <p className="min-h-[1.25rem] text-xs leading-relaxed" aria-hidden>
                        &nbsp;
                      </p>
                    )
                  }
                  sell={
                    sell.stance !== "skip" && sell.reasons[i] ? (
                      <p className="min-h-[1.25rem] text-xs leading-relaxed text-ink-muted">· {sell.reasons[i]}</p>
                    ) : (
                      <p className="min-h-[1.25rem] text-xs leading-relaxed" aria-hidden>
                        &nbsp;
                      </p>
                    )
                  }
                />
              ))
            )}

            {/* 마지막. 예상 실현 손익 */}
            {showProfitRow ? (
              <PairRow
                buyStance={buy.stance}
                sellStance={sell.stance}
                className="pb-4 pt-3"
                buy={<span aria-hidden className="block min-h-[1px]" />}
                sell={
                  sell.sellProfitPreview ? (
                    <ProfitPreviewBox preview={sell.sellProfitPreview} sellCostNote={sellCostNote} />
                  ) : null
                }
              />
            ) : (
              <PairRow buyStance={buy.stance} sellStance={sell.stance} className="pb-4 pt-1" buy={null} sell={null} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
