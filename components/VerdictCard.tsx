"use client";

import { type ReactNode } from "react";
import type { SideVerdict } from "@/lib/briefing/tradingVerdict";
import { innerBlock, AreaCardHeader } from "@/components/ui/PanelCard";
import { formatStockCodeLabel } from "@/lib/stockCodes";
import { fmt, fmtPct, fmtSigned } from "@/lib/calc";
import type { ReportSettings } from "@/lib/reportSettings";
import { formatFeePct, resolveReportSettings } from "@/lib/reportSettings";

function cellStyle(stance: SideVerdict["stance"], kind: "buy" | "sell") {
  if (stance === "skip") return "";
  if (stance === "yes") return kind === "buy" ? "bg-red-500/10" : "bg-blue-500/10";
  return "bg-amber-500/10";
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
      <p className="shrink-0 text-[11px] font-medium text-zinc-300">{label}</p>
      <div className="relative mt-2 flex flex-1 flex-col justify-center px-2 pb-0 pt-3">
        <div className="absolute left-2 right-2 top-[calc(50%+4px)] h-px -translate-y-1/2 bg-white/15" />
        <div
          className="absolute top-[calc(50%+4px)] -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${Math.min(100, Math.max(0, value))}%` }}
        >
          <span className="absolute bottom-[calc(100%+2px)] left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold leading-none tabular-nums text-white">
            {value}%
          </span>
          <div
            className={`h-3 w-3 rounded-full border-2 border-white shadow-sm ${markerColor}`}
            aria-hidden
          />
        </div>
        <div className="mt-auto flex justify-between pt-6 text-[10px] tabular-nums text-zinc-300">
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
      <p key="wait" className="text-[11px] leading-snug text-amber-200">
        아직 목표보다 비쌉니다. 위 가격 이하로 내려올 때만 매수를 검토하세요.
      </p>
    );
  }
  if (kind === "sell" && verdict.stance === "wait" && !verdict.sellProfitPreview) {
    lines.push(
      <p key="wait" className="text-[11px] leading-snug text-amber-200">
        아직 목표 매도가보다 낮습니다. 손실이 나도 급하게 팔 필요는 없다는 뜻입니다.
      </p>
    );
  }
  if (verdict.stance === "wait" && kind === "sell" && verdict.sellProfitPreview) {
    lines.push(
      <p key="hold" className="text-[10px] text-zinc-300/80">
        지금 당장 팔라는 뜻이 아닙니다 · 데이터를 반영한 보유 판단
      </p>
    );
  }
  if (verdict.stance === "wait" && kind === "buy") {
    lines.push(
      <p key="hold" className="text-[10px] text-zinc-300/80">
        지금 당장 사라는 뜻이 아닙니다 · 데이터를 반영한 대기 판단
      </p>
    );
  }
  if (verdict.dataQuality < 0.5) {
    lines.push(
      <p key="quality" className="text-[10px] text-amber-300">
        시세·뉴스·매매기록을 더 불러오면 정확도가 올라갑니다
      </p>
    );
  }

  if (lines.length === 0) return null;

  return <div className="space-y-1">{lines}</div>;
}

/** 순차 2열 — 길이와 관계없이 동일 그리드 */
function VerdictReasonsList({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
      {reasons.map((reason, i) => (
        <li key={i} className="min-w-0 text-xs leading-snug text-zinc-300">
          · {reason}
        </li>
      ))}
    </ul>
  );
}

function SideColumnFooter({ kind, verdict }: { kind: "buy" | "sell"; verdict: SideVerdict }) {
  if (verdict.stance === "skip") return null;
  return (
    <>
      <SideNotes kind={kind} verdict={verdict} />
      {verdict.reasons.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-medium text-zinc-500">판단 요약</p>
          <div className="mt-1">
            <VerdictReasonsList reasons={verdict.reasons} />
          </div>
        </div>
      )}
    </>
  );
}

function ProfitPreviewBox({
  preview,
  sellCostNote,
}: {
  preview: NonNullable<SideVerdict["sellProfitPreview"]>;
  sellCostNote: string;
}) {
  return (
    <div className={`${innerBlock} text-xs text-zinc-300`}>
      <p className="font-semibold text-white">예상 실현 손익 (전량 · 세금·수수료 후)</p>
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

function stockHeaderMeta(code?: string | null): ReactNode {
  const label = formatStockCodeLabel(code);
  if (label) return label;
  return <span className="text-amber-200">종목코드 미등록</span>;
}

function VerdictSideBlock({
  kind,
  verdict,
  stockName,
  stockCode,
  sellCostNote,
  showProfit,
}: {
  kind: "buy" | "sell";
  verdict: SideVerdict;
  stockName?: string;
  stockCode?: string | null;
  sellCostNote?: string;
  showProfit?: boolean;
}) {
  const accent = kind === "buy" ? "text-gain" : "text-loss";
  const targetLabel =
    kind === "buy" ? (verdict.stance === "wait" ? "기다릴 가격" : "추천 매수가") : "목표 매도가";
  const question = kind === "buy" ? "지금 살까?" : "지금 팔까?";

  return (
    <div className={`px-3 py-4 sm:px-4 ${cellStyle(verdict.stance, kind)}`}>
      {stockName && (
        <AreaCardHeader
          as="h3"
          title={stockName}
          meta={stockHeaderMeta(stockCode)}
          subtitle={question}
        />
      )}

      {verdict.stance === "skip" ? (
        <p className="mt-3 text-xs leading-relaxed text-zinc-300">{verdict.reasons[0]}</p>
      ) : (
        <>
          <p className="mt-3 text-base font-bold leading-snug text-white">
            <span className={`mr-1 ${accent}`}>{stanceIcon(verdict.stance)}</span>
            {verdict.headline}
          </p>

          <div className="mt-3">
            <p className={`text-sm font-semibold ${accent}`}>{verdict.when}</p>
            <p className="mt-0.5 text-[11px] font-medium text-zinc-300">{targetLabel}</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-white">{fmt(verdict.targetPrice)}</p>
            <p className="mt-1 text-sm tabular-nums text-zinc-300">
              {kind === "buy" ? "매수해도 되는 범위" : "매도해도 되는 범위"}{" "}
              {fmt(verdict.priceRange.min)} ~ {fmt(verdict.priceRange.max)}
            </p>
          </div>

          <div className="mt-3 h-[5.25rem]">
            <ConfidenceScale value={verdict.confidence} stance={verdict.stance} />
          </div>

          <SideColumnFooter kind={kind} verdict={verdict} />

          {showProfit && verdict.sellProfitPreview && sellCostNote && (
            <div className="mt-3">
              <ProfitPreviewBox preview={verdict.sellProfitPreview} sellCostNote={sellCostNote} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** 매수·매도 판단 — 모바일: 세로 카드 / lg+: 2열 동기화 그리드 */
export function VerdictCardPair({
  buy,
  sell,
  stockName,
  stockCode,
  feeSettings,
}: {
  buy: SideVerdict;
  sell: SideVerdict;
  stockName?: string;
  stockCode?: string | null;
  feeSettings?: Partial<ReportSettings>;
}) {
  const fees = resolveReportSettings(feeSettings);
  const sellCostNote = `매도 ${formatFeePct(fees.sellTotalFeePct!)} 수수료 · ${formatFeePct(fees.sellTransactionTaxPct!)} 증권거래세 참고`;
  const buyAccent = "text-gain";
  const sellAccent = "text-loss";
  const buyTargetLabel = buy.stance === "wait" ? "기다릴 가격" : "추천 매수가";
  const sellTargetLabel = "목표 매도가";
  const showProfitRow = sell.stance !== "skip" && !!sell.sellProfitPreview;
  const showDetail = buy.stance !== "skip" || sell.stance !== "skip";

  return (
    <>
      {/* 모바일: 매수 카드 → 매도 카드 (행 섞임 없음) */}
      <div className="mt-3 divide-y divide-white/10 lg:hidden">
        <VerdictSideBlock kind="buy" verdict={buy} stockName={stockName} stockCode={stockCode} />
        <VerdictSideBlock
          kind="sell"
          verdict={sell}
          stockName={stockName}
          stockCode={stockCode}
          sellCostNote={sellCostNote}
          showProfit={showProfitRow}
        />
      </div>

      {/* lg+: 좌·우 행 동기화 2열 (배경색으로 구분, 가운데 세로선 없음) */}
      <div className="mt-3 hidden grid-cols-2 lg:grid">
        <PairRow
          buyStance={buy.stance}
          sellStance={sell.stance}
          className="pt-4 pb-1"
          buy={
            stockName ? (
              <AreaCardHeader
                as="h3"
                title={stockName}
                meta={stockHeaderMeta(stockCode)}
                subtitle="지금 살까?"
              />
            ) : null
          }
          sell={
            stockName ? (
              <AreaCardHeader
                as="h3"
                title={stockName}
                meta={stockHeaderMeta(stockCode)}
                subtitle="지금 팔까?"
              />
            ) : null
          }
        />

        <PairRow
          buyStance={buy.stance}
          sellStance={sell.stance}
          className="pb-2"
          buy={
            buy.stance === "skip" ? (
              <p className="text-xs text-zinc-300">{buy.reasons[0]}</p>
            ) : (
              <p className="text-base font-bold leading-snug text-white lg:text-lg">
                <span className={`mr-1 ${buyAccent}`}>{stanceIcon(buy.stance)}</span>
                {buy.headline}
              </p>
            )
          }
          sell={
            sell.stance === "skip" ? (
              <p className="text-xs text-zinc-300">{sell.reasons[0]}</p>
            ) : (
              <p className="text-base font-bold leading-snug text-white lg:text-lg">
                <span className={`mr-1 ${sellAccent}`}>{stanceIcon(sell.stance)}</span>
                {sell.headline}
              </p>
            )
          }
        />

        {showDetail && (
          <>
            <PairRow
              buyStance={buy.stance}
              sellStance={sell.stance}
              className="pb-2"
              buy={
                buy.stance !== "skip" ? (
                  <>
                    <p className={`text-sm font-semibold ${buyAccent}`}>{buy.when}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-zinc-300">{buyTargetLabel}</p>
                    <p className="mt-0.5 text-2xl font-bold tabular-nums text-white lg:text-3xl">{fmt(buy.targetPrice)}</p>
                    <p className="mt-1 text-sm tabular-nums text-zinc-300">
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
                    <p className="mt-0.5 text-[11px] font-medium text-zinc-300">{sellTargetLabel}</p>
                    <p className="mt-0.5 text-2xl font-bold tabular-nums text-white lg:text-3xl">{fmt(sell.targetPrice)}</p>
                    <p className="mt-1 text-sm tabular-nums text-zinc-300">
                      매도해도 되는 범위 {fmt(sell.priceRange.min)} ~ {fmt(sell.priceRange.max)}
                    </p>
                  </>
                ) : (
                  <span className="block min-h-[5.75rem]" aria-hidden />
                )
              }
            />

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

            <PairRow
              buyStance={buy.stance}
              sellStance={sell.stance}
              className="py-2"
              buy={
                buy.stance !== "skip" ? (
                  <SideColumnFooter kind="buy" verdict={buy} />
                ) : (
                  <span className="block min-h-[1px]" aria-hidden />
                )
              }
              sell={
                sell.stance !== "skip" ? (
                  <SideColumnFooter kind="sell" verdict={sell} />
                ) : (
                  <span className="block min-h-[1px]" aria-hidden />
                )
              }
            />

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
    </>
  );
}
