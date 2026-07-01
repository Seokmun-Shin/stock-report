"use client";

import { InitialCapitalSummary } from "@/lib/types";
import { fmt, fmtPct, fmtSigned } from "@/lib/calc";
import { INITIAL_CAPITAL_HINTS } from "@/lib/metricHints";
import { CollapsibleSection, SummaryChip } from "./CollapsibleSection";
import { HintTooltip, SectionTitle, StatCard } from "./StatCard";

function isFullySold(summary: InitialCapitalSummary): boolean {
  return summary.stillInvested === 0 && summary.holdingMarketValue === 0;
}

export function InitialCapitalPanel({ summary }: { summary: InitialCapitalSummary }) {
  if (summary.selectedCount === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-amber-300/90 bg-amber-50/40 px-4 py-4 sm:px-5 sm:py-5">
        <SectionTitle>초기 투자금 기준 수익</SectionTitle>
        <p className="mt-2 text-sm leading-relaxed text-amber-900/85">
          매매 내역 표에서 매수 건의 <strong>「기준」</strong>을 눌러 초기 투자금으로 지정하세요.
          <span className="mt-1 block text-sm text-amber-800/80">
            ★ 매수분을 전량 매도한 뒤, 투입 대비 회수·실현 수익을 확인하는 용도입니다.
          </span>
        </p>
      </section>
    );
  }

  const fullySold = isFullySold(summary);
  const tone = summary.totalPnl >= 0 ? "gain" : "loss";
  const mainLabel = fullySold ? "실현 손익" : "누적 손익";
  const mainValue = fmtSigned(fullySold ? summary.realizedPnl : summary.totalPnl);

  return (
    <CollapsibleSection
      accent="amber"
      title="초기 투자금 기준 수익"
      unit
      subtitle={fullySold ? "★ 매수분 전량 매도 · 청산 완료" : "★ 매수분 일부 보유 — 매도분만 회수·실현에 반영"}
      summary={
        <>
          <SummaryChip label={mainLabel} value={mainValue} tone={tone} />
          <SummaryChip label="수익률" value={fmtPct(summary.returnRate)} tone={tone} />
          <SummaryChip label="투입 원금" value={fmt(summary.initialCapital)} />
        </>
      }
    >
      <div className={`grid grid-cols-2 gap-2 ${fullySold ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
        <StatCard label="선택 건수" hint={INITIAL_CAPITAL_HINTS.selectedCount} value={`${summary.selectedCount}건`} />
        <StatCard label="투입 원금" hint={INITIAL_CAPITAL_HINTS.initialCapital} value={fmt(summary.initialCapital)} />
        <StatCard label="회수 현금" hint={INITIAL_CAPITAL_HINTS.recoveredCash} value={fmt(summary.recoveredCash)} />
        <StatCard
          label="실현"
          hint={INITIAL_CAPITAL_HINTS.realizedPnl}
          value={fmt(summary.realizedPnl)}
          tone={summary.realizedPnl >= 0 ? "gain" : "loss"}
        />
        <StatCard
          label="수익률"
          hint={INITIAL_CAPITAL_HINTS.returnRate}
          value={fmtPct(summary.returnRate)}
          tone={summary.returnRate >= 0 ? "gain" : "loss"}
        />
        {!fullySold && (
          <>
            <StatCard label="잔여 투자" hint={INITIAL_CAPITAL_HINTS.stillInvested} value={fmt(summary.stillInvested)} />
            <StatCard label="보유 시가" hint={INITIAL_CAPITAL_HINTS.holdingMarketValue} value={fmt(summary.holdingMarketValue)} />
            <StatCard
              label="미실현"
              hint={INITIAL_CAPITAL_HINTS.unrealizedPnl}
              value={fmtSigned(summary.unrealizedPnl)}
              tone={summary.unrealizedPnl >= 0 ? "gain" : "loss"}
            />
          </>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-600">
        {fullySold ? (
          <>
            회수 현금 {fmt(summary.recoveredCash)}
            <HintTooltip text={INITIAL_CAPITAL_HINTS.fullySoldNote} />
          </>
        ) : (
          <>
            현재 가치 {fmt(summary.currentValue)}
            <HintTooltip text={INITIAL_CAPITAL_HINTS.currentValue} />
          </>
        )}
      </p>
    </CollapsibleSection>
  );
}
