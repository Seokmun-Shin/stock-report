"use client";

import { InitialCapitalSummary } from "@/lib/types";
import { fmt, fmtPct, fmtSigned } from "@/lib/calc";
import { INITIAL_CAPITAL_HINTS } from "@/lib/metricHints";
import { HeroMetric, HintTooltip, SectionTitle, StatCard } from "./StatCard";

/** ★ 매수분 잔여 보유 없음 = 전량 매도(청산) */
function isFullySold(summary: InitialCapitalSummary): boolean {
  return summary.stillInvested === 0 && summary.holdingMarketValue === 0;
}

export function InitialCapitalPanel({ summary }: { summary: InitialCapitalSummary }) {
  if (summary.selectedCount === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-5">
        <SectionTitle>초기 투자금 기준 수익</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-amber-900/80">
          매매 내역 표에서 매수 건의 <strong>「기준」</strong>을 눌러 초기 투자금으로 지정하세요.
          <br />
          <span className="mt-1 inline-block text-xs">★ 매수분을 전량 매도한 뒤, 투입 대비 회수·실현 수익을 확인하는 용도입니다.</span>
        </p>
      </section>
    );
  }

  const fullySold = isFullySold(summary);
  const tone = summary.totalPnl >= 0 ? "gain" : "loss";

  return (
    <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <SectionTitle unit>초기 투자금 기준 수익</SectionTitle>
          <p className="mt-1 text-xs text-ink-muted">
            {fullySold ? "★ 매수분 전량 매도 · 청산 완료" : "★ 매수분 일부 보유 — 매도분만 회수·실현에 반영"}
          </p>
        </div>
        <HeroMetric
          label={fullySold ? "실현 손익" : "누적 손익"}
          hint={fullySold ? INITIAL_CAPITAL_HINTS.realizedPnl : INITIAL_CAPITAL_HINTS.totalPnl}
          value={fmtSigned(fullySold ? summary.realizedPnl : summary.totalPnl)}
          sub={fmtPct(summary.returnRate)}
          tone={tone}
        />
      </div>

      <div className={`mt-4 grid grid-cols-2 gap-2 ${fullySold ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
        <StatCard label="선택 건수" hint={INITIAL_CAPITAL_HINTS.selectedCount} value={`${summary.selectedCount}건`} />
        <StatCard label="투입 원금" hint={INITIAL_CAPITAL_HINTS.initialCapital} value={fmt(summary.initialCapital)} />
        <StatCard label="회수 현금" hint={INITIAL_CAPITAL_HINTS.recoveredCash} value={fmt(summary.recoveredCash)} />
        <StatCard label="실현" hint={INITIAL_CAPITAL_HINTS.realizedPnl} value={fmt(summary.realizedPnl)} tone={summary.realizedPnl >= 0 ? "gain" : "loss"} />
        <StatCard label="수익률" hint={INITIAL_CAPITAL_HINTS.returnRate} value={fmtPct(summary.returnRate)} tone={summary.returnRate >= 0 ? "gain" : "loss"} />
        {!fullySold && (
          <>
            <StatCard label="잔여 투자" hint={INITIAL_CAPITAL_HINTS.stillInvested} value={fmt(summary.stillInvested)} />
            <StatCard label="보유 시가" hint={INITIAL_CAPITAL_HINTS.holdingMarketValue} value={fmt(summary.holdingMarketValue)} />
            <StatCard label="미실현" hint={INITIAL_CAPITAL_HINTS.unrealizedPnl} value={fmtSigned(summary.unrealizedPnl)} tone={summary.unrealizedPnl >= 0 ? "gain" : "loss"} />
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-600">
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
    </section>
  );
}
