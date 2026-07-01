"use client";

import type { AppData, PortfolioSummary, StockSummary } from "@/lib/types";
import { fmt, fmtPct, fmtSigned } from "@/lib/calc";
import { compareToKospi, computePortfolioDayChange } from "@/lib/benchmark";
import { CollapsibleSection, SummaryChip } from "./CollapsibleSection";

export function BenchmarkPanel({
  data,
  portfolio,
  summaries,
}: {
  data: AppData;
  portfolio: PortfolioSummary;
  summaries: Record<string, StockSummary>;
}) {
  const portfolioDay = computePortfolioDayChange(data.stocks, summaries, data.stockQuotes);
  const cmp = compareToKospi(portfolioDay, data.kospiBenchmark);
  const kospi = data.kospiBenchmark;

  if (!kospi && portfolioDay == null) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-surface-dim/40 px-4 py-3 text-sm text-ink-muted">
        KOSPI 비교: 종목코드 등록 후 「현재가 새로고침」을 실행하세요.
      </p>
    );
  }

  const alphaTone = cmp.alpha != null ? (cmp.alpha >= 0 ? "gain" : "loss") : undefined;

  return (
    <CollapsibleSection
      title="KOSPI 벤치마크"
      summary={
        <>
          {kospi && (
            <SummaryChip
              label="KOSPI"
              value={fmtPct(kospi.changeRate)}
              tone={kospi.changeRate >= 0 ? "gain" : "loss"}
            />
          )}
          {cmp.portfolio != null && (
            <SummaryChip
              label="보유 전일比"
              value={fmtPct(cmp.portfolio)}
              tone={cmp.portfolio >= 0 ? "gain" : "loss"}
            />
          )}
          {cmp.alpha != null && (
            <SummaryChip label="초과(α)" value={fmtPct(cmp.alpha)} tone={alphaTone} />
          )}
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {kospi && (
          <>
            <div className="rounded-lg border border-line bg-surface-dim/40 p-3">
              <p className="text-xs text-ink-muted">KOSPI 지수</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{kospi.price.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-line bg-surface-dim/40 p-3">
              <p className="text-xs text-ink-muted">KOSPI 전일比</p>
              <p
                className={`mt-1 text-lg font-bold tabular-nums ${kospi.changeRate >= 0 ? "text-gain" : "text-loss"}`}
              >
                {fmtPct(kospi.changeRate)}
              </p>
            </div>
          </>
        )}
        {cmp.portfolio != null && (
          <div className="rounded-lg border border-line bg-surface-dim/40 p-3">
            <p className="text-xs text-ink-muted">보유 종목 가중 전일比</p>
            <p className={`mt-1 text-lg font-bold tabular-nums ${cmp.portfolio >= 0 ? "text-gain" : "text-loss"}`}>
              {fmtPct(cmp.portfolio)}
            </p>
          </div>
        )}
        {cmp.alpha != null && (
          <div className="rounded-lg border border-line bg-surface-dim/40 p-3">
            <p className="text-xs text-ink-muted">KOSPI 대비 초과</p>
            <p className={`mt-1 text-lg font-bold tabular-nums ${cmp.alpha >= 0 ? "text-gain" : "text-loss"}`}>
              {fmtPct(cmp.alpha)}
            </p>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        보유 전일比 = 보유 수량 가중 (현재가−전일가) / 전일가. KIS 갱신 시점 기준 · 미보유 종목 제외.
        <br />
        누적 손익 {fmtSigned(portfolio.totalPnl)} · 수익률 {fmtPct(portfolio.totalReturnRate)}
      </p>
    </CollapsibleSection>
  );
}
