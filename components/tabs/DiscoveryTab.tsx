"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  DiscoveryPick,
  DiscoveryReasonDetail,
  DiscoveryReasonImpact,
  StockDiscoveryReport,
} from "@/lib/briefing/stockDiscovery";
import { buildDiscoveryVerdictHint } from "@/lib/briefing/discoveryVerdict";
import { computeDiscoveryTrackStats, trackDiscoveryPicks } from "@/lib/discoveryTracking";
import { fmt, fmtPct } from "@/lib/calc";
import {
  BtnSecondary,
  HeaderActionButton,
  InsetCard,
  PanelHeaderActions,
  TabIntroBanner,
  UI,
  panelShell,
  AreaSectionHeader,
  AreaSectionSubtitle,
  AreaSectionTitle,
} from "@/components/ui/PanelCard";
import { UnderlineTabBar } from "@/components/ui/StockTitleTabBar";
import { WatchlistPanel } from "@/components/WatchlistPanel";
import type { WatchlistItem } from "@/lib/types";

const MARKET_TABS = [
  { id: "KSP" as const, label: "코스피" },
  { id: "KSQ" as const, label: "코스닥" },
];

const SIGNAL_LABEL = {
  volume: "거래대금",
  gainer: "등락률",
  foreign_buy: "외국인",
} as const;

const REASON_CATEGORY_LABEL: Record<DiscoveryReasonDetail["category"], string> = {
  signal: "순위 신호",
  price: "당일 시세",
  combo: "복합 신호",
  market: "시장·수급",
  score: "점수",
  caution: "주의",
};

const IMPACT_BORDER: Record<DiscoveryReasonImpact, string> = {
  positive: "border-gain/20 bg-gain-soft/30",
  neutral: "border-line bg-surface-dim/40",
  negative: "border-loss/20 bg-loss-soft/30",
};

function ReasonBlock({ detail }: { detail: DiscoveryReasonDetail }) {
  return (
    <div className={`rounded-lg border px-2.5 py-2 ${IMPACT_BORDER[detail.impact]}`}>
      <p className={`${UI.metricLabel}`}>{REASON_CATEGORY_LABEL[detail.category]}</p>
      <p className="mt-0.5 text-xs font-semibold text-ink">{detail.title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{detail.body}</p>
    </div>
  );
}

function PickRow({
  pick,
  report,
  onAdd,
  onAddWatchlist,
  inWatchlist,
}: {
  pick: DiscoveryPick;
  report: StockDiscoveryReport | null;
  onAdd?: (code: string, name: string) => void;
  onAddWatchlist?: (code: string, name: string) => void;
  inWatchlist?: boolean;
}) {
  const tone = pick.changeRate >= 0 ? "text-gain" : "text-loss";
  const hint = buildDiscoveryVerdictHint(pick, report);
  const hintTone =
    hint.tone === "gain" ? "text-gain" : hint.tone === "loss" ? "text-loss" : "text-ink-muted";

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex items-start justify-between gap-3 px-3 py-3 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold tabular-nums text-ink-muted">#{pick.rank}</span>
            <AreaSectionTitle as="h3" size="sub" className="truncate">
              {pick.stockName}
            </AreaSectionTitle>
            <span className="text-xs tabular-nums text-ink-muted">{pick.stockCode}</span>
            {pick.inPortfolio && (
              <span className="rounded bg-surface-dim px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted">
                보유
              </span>
            )}
            {!pick.inPortfolio && inWatchlist && (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                관심
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className={`text-base font-bold tabular-nums ${tone}`}>{fmt(pick.price)}</span>
            <span className={`text-xs font-semibold tabular-nums ${tone}`}>{fmtPct(pick.changeRate)}</span>
            <span className="text-[10px] text-ink-muted">종합 {pick.score.toFixed(1)}점</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {pick.signals.map((s) => (
              <span
                key={s}
                className="rounded bg-gain-soft px-1.5 py-0.5 text-[10px] font-bold text-gain"
              >
                {SIGNAL_LABEL[s]}
              </span>
            ))}
            <span className={`rounded border border-line bg-white px-1.5 py-0.5 text-[10px] font-semibold ${hintTone}`}>
              {hint.label} · {hint.headline}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-1 sm:flex-row sm:items-center">
        {onAddWatchlist && !pick.inPortfolio && !inWatchlist && (
          <HeaderActionButton
            onClick={() => onAddWatchlist(pick.stockCode, pick.stockName)}
            className="shrink-0"
            title="관심종목에 등록"
          >
            ★ 관심
          </HeaderActionButton>
        )}
        {onAdd && !pick.inPortfolio && (
          <HeaderActionButton
            onClick={() => onAdd(pick.stockCode, pick.stockName)}
            className="shrink-0"
            title="포트폴리오에 추가"
          >
            + 보유
          </HeaderActionButton>
        )}
        </div>
      </div>

      <div className="border-t border-line bg-surface-dim/25 px-3 py-3 sm:px-4">
        <p className="text-xs font-semibold leading-snug text-ink">{pick.summary}</p>

        <div className="mt-3 space-y-2">
          {pick.reasonDetails.map((detail, i) => (
            <ReasonBlock key={`${detail.category}-${detail.title}-${i}`} detail={detail} />
          ))}
        </div>
      </div>
    </article>
  );
}

export function DiscoveryTab({
  report,
  loading,
  error,
  lastFetched,
  onRefresh,
  onAddStock,
  onAddWatchlist,
  watchlistCodes,
  watchlist,
  onRemoveWatchlist,
  onPromoteWatchlist,
}: {
  report: StockDiscoveryReport | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  onRefresh: () => void;
  onAddStock: (code: string, name: string) => void;
  onAddWatchlist?: (code: string, name: string) => void;
  watchlistCodes?: Set<string>;
  watchlist?: WatchlistItem[];
  onRemoveWatchlist?: (id: string) => void;
  onPromoteWatchlist?: (code: string, name: string) => void;
}) {
  const [marketTab, setMarketTab] = useState<"KSP" | "KSQ">("KSP");
  const [minScore, setMinScore] = useState(0);
  const [hidePortfolio, setHidePortfolio] = useState(false);

  const rawPicks = marketTab === "KSP" ? report?.kospi ?? [] : report?.kosdaq ?? [];
  const picks = useMemo(() => {
    return rawPicks.filter((p) => {
      if (p.score < minScore) return false;
      if (hidePortfolio && p.inPortfolio) return false;
      return true;
    });
  }, [rawPicks, minScore, hidePortfolio]);

  const allPicks = useMemo(() => [...(report?.kospi ?? []), ...(report?.kosdaq ?? [])], [report]);

  useEffect(() => {
    if (report && allPicks.length > 0) trackDiscoveryPicks(allPicks);
  }, [report, allPicks]);

  const trackStats = useMemo(() => computeDiscoveryTrackStats(allPicks), [allPicks]);

  return (
    <div className="space-y-3">
      <TabIntroBanner
        title="② 종목 발굴"
        description="KIS 거래대금·등락률·외국인 순매수 순위와 시장·거시 데이터를 종합한 관심 종목 Top 10 (투자 조언 아님)"
      />

      {watchlist && watchlist.length > 0 && onRemoveWatchlist && onPromoteWatchlist && (
        <WatchlistPanel items={watchlist} onRemove={onRemoveWatchlist} onAddToPortfolio={onPromoteWatchlist} />
      )}

      <section className={panelShell}>
        <AreaSectionHeader className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <AreaSectionTitle>오늘의 관심 종목</AreaSectionTitle>
            {lastFetched && (
              <AreaSectionSubtitle>
                갱신 {lastFetched.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
              </AreaSectionSubtitle>
            )}
          </div>
          <PanelHeaderActions>
            <BtnSecondary onClick={onRefresh} disabled={loading}>
              {loading ? "갱신 중…" : "새로고침"}
            </BtnSecondary>
          </PanelHeaderActions>
        </AreaSectionHeader>

        {report?.gate && (
          <div
            className={`mx-3 mt-3 rounded-lg border px-3 py-2.5 text-xs sm:mx-5 ${
              report.gate.caution
                ? "border-amber-200 bg-amber-50/80 text-amber-900"
                : "border-gain/25 bg-gain-soft/40 text-ink"
            }`}
          >
            <p className="font-semibold">
              시장 환경 {report.gate.caution ? "주의" : "양호"} · 점수 {report.gate.score.toFixed(2)}
            </p>
            <p className="mt-0.5 leading-relaxed text-ink-muted">{report.gate.note}</p>
          </div>
        )}

        <UnderlineTabBar tabs={MARKET_TABS} active={marketTab} onChange={setMarketTab} ariaLabel="시장 구분" />

        <div className="mx-3 flex flex-wrap items-center gap-3 border-b border-line px-1 py-2 text-xs sm:mx-5">
          <label className="flex items-center gap-1.5 text-ink-muted">
            최소 점수
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="rounded border border-line bg-white px-2 py-1 text-ink"
            >
              <option value={0}>전체</option>
              <option value={5}>5+</option>
              <option value={6}>6+</option>
              <option value={7}>7+</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-ink-muted">
            <input type="checkbox" checked={hidePortfolio} onChange={(e) => setHidePortfolio(e.target.checked)} />
            보유 종목 숨기기
          </label>
        </div>

        {trackStats.length > 0 && (
          <div className="mx-3 rounded-lg border border-line bg-surface-dim/40 px-3 py-2.5 sm:mx-5">
            <p className="text-[11px] font-semibold text-ink-muted">발굴 신호 사후 추적 (참고)</p>
            <ul className="mt-1.5 space-y-1 text-[11px]">
              {trackStats.map((s) => (
                <li key={s.code} className="flex justify-between gap-2 tabular-nums">
                  <span className="truncate text-ink">{s.name}</span>
                  <span className={s.changePct >= 0 ? "text-gain" : "text-loss"}>
                    {s.daysHeld}일 {fmtPct(s.changePct)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-3 p-3 sm:p-5">
          {error && <p className="text-xs text-amber-800">{error}</p>}

          {!report && !loading && (
            <p className="py-8 text-center text-sm text-ink-muted">새로고침으로 순위 데이터를 불러오세요.</p>
          )}

          {report && !report.rankings && (
            <p className="py-6 text-center text-sm text-amber-800">
              KIS API 키가 필요합니다. 설정 탭에서 KIS_APP_KEY를 확인하세요.
            </p>
          )}

          {report?.rankings && rawPicks.length > 0 && picks.length === 0 && !loading && (
            <p className="py-6 text-center text-sm text-ink-muted">필터 조건에 맞는 종목이 없습니다.</p>
          )}

          {report?.rankings && rawPicks.length === 0 && !loading && (
            <p className="py-6 text-center text-sm text-ink-muted">
              {marketTab === "KSP" ? "코스피" : "코스닥"} 후보가 없습니다. 시장 환경이 약세일 수 있습니다.
            </p>
          )}

          {picks.map((pick) => (
            <PickRow
              key={`${pick.market}-${pick.stockCode}`}
              pick={pick}
              report={report}
              onAdd={onAddStock}
              onAddWatchlist={onAddWatchlist}
              inWatchlist={watchlistCodes?.has(pick.stockCode.replace(/\D/g, "").padStart(6, "0"))}
            />
          ))}

          <InsetCard className="text-center text-[10px] leading-relaxed">
            KIS 순위(각 30건) + 시장·거시·수급 데이터 기반 참고용 목록입니다. 매매는 HTS·MTS에서 직접 하세요.
          </InsetCard>
        </div>
      </section>
    </div>
  );
}
