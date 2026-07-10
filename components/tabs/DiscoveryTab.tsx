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
import { tabLabel } from "@/lib/appTabs";
import {
  BtnCreate,
  RefreshButton,
  InsetCard,
  TabIntroBanner,
  TabSectionHeader,
  UI,
  panelShell,
  warnBanner,
  warnChip,
  warnInline,
  listDivide,
  boxList,
  stockCard,
  pickCard,
  pickDetailZone,
  chip,
  AreaCardHeader,
  DetailZoneLabel,
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

const IMPACT_LABEL: Record<DiscoveryReasonImpact, string> = {
  positive: "text-gain",
  neutral: "ui-fg-muted",
  negative: "text-loss",
};

function ReasonBlock({ detail }: { detail: DiscoveryReasonDetail }) {
  return (
    <div className="py-2.5">
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${IMPACT_LABEL[detail.impact]}`}>
        {REASON_CATEGORY_LABEL[detail.category]}
      </p>
      <p className="ui-fg-primary mt-0.5 text-xs font-semibold">{detail.title}</p>
      <p className="ui-fg-muted mt-1 text-[11px] leading-relaxed">{detail.body}</p>
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
    hint.tone === "gain" ? "text-gain" : hint.tone === "loss" ? "text-loss" : "ui-fg-secondary";

  return (
    <article className={stockCard}>
      <AreaCardHeader
        as="h3"
        eyebrow={<span className="ui-area-header-eyebrow">#{pick.rank}</span>}
        badges={
          <>
            {pick.inPortfolio && (
              <span className={`${chip} px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300`}>보유</span>
            )}
            {!pick.inPortfolio && inWatchlist && (
              <span className={`${warnChip} px-1.5 py-0.5`}>
                관심
              </span>
            )}
          </>
        }
        title={pick.stockName}
        meta={
          <>
            {pick.stockCode}
            <span className="mx-1.5 text-zinc-600">·</span>
            종합 {pick.score.toFixed(1)}점
          </>
        }
        trailing={
          <div className="flex shrink-0 flex-row flex-nowrap items-center gap-1.5">
            {onAddWatchlist && !pick.inPortfolio && !inWatchlist && (
              <BtnCreate
                onClick={() => onAddWatchlist(pick.stockCode, pick.stockName)}
                className="shrink-0"
                title="관심종목에 등록"
              >
                ★ 관심
              </BtnCreate>
            )}
            {onAdd && !pick.inPortfolio && (
              <BtnCreate
                onClick={() => onAdd(pick.stockCode, pick.stockName)}
                className="shrink-0"
                title="포트폴리오에 추가"
              >
                + 보유
              </BtnCreate>
            )}
          </div>
        }
      />

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={`text-2xl font-bold tabular-nums sm:text-3xl ${tone}`}>{fmt(pick.price)}</span>
        <span className={`text-lg font-bold tabular-nums sm:text-xl ${tone}`}>{fmtPct(pick.changeRate)}</span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1">
        {pick.signals.map((s) => (
          <span
            key={s}
            className="rounded bg-red-500/12 px-1.5 py-0.5 text-[10px] font-bold text-gain"
          >
            {SIGNAL_LABEL[s]}
          </span>
        ))}
        <span className={`${chip} px-1.5 py-0.5 text-[10px] font-semibold ${hintTone}`}>
          {hint.label} · {hint.headline}
        </span>
      </div>

      <p className="ui-fg-primary mt-3 text-sm font-semibold leading-snug">{pick.summary}</p>

      {pick.reasonDetails.length > 0 && (
        <section className={pickDetailZone} aria-label="근거 상세">
          <DetailZoneLabel>근거 상세</DetailZoneLabel>
          <div className={listDivide}>
            {pick.reasonDetails.map((detail, i) => (
              <ReasonBlock key={`${detail.category}-${detail.title}-${i}`} detail={detail} />
            ))}
          </div>
        </section>
      )}
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
    <>
      <TabIntroBanner
        title={tabLabel("discover")}
        description="KIS 거래대금·등락률·외국인 순매수 순위와 시장·거시 데이터를 종합한 관심 종목 Top 10 (투자 조언 아님)"
      />

      {watchlist && watchlist.length > 0 && onRemoveWatchlist && onPromoteWatchlist && (
        <WatchlistPanel items={watchlist} onRemove={onRemoveWatchlist} onAddToPortfolio={onPromoteWatchlist} />
      )}

      <TabSectionHeader
        eyebrow={tabLabel("discover")}
        title="오늘의 관심 종목"
        subtitle={
          lastFetched
            ? `갱신 ${lastFetched.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`
            : undefined
        }
        actions={<RefreshButton kind="discovery" loading={loading} onClick={onRefresh} disabled={loading} />}
      />

      <section className={panelShell}>

        {report?.gate && (
          <div className={`mx-3 mt-3 sm:mx-5 ${warnBanner}`}>
            <p className="font-semibold">
              시장 환경 {report.gate.caution ? "주의" : "양호"} · 점수 {report.gate.score.toFixed(2)}
            </p>
            <p className="ui-warn-body mt-0.5 leading-relaxed">{report.gate.note}</p>
          </div>
        )}

        <UnderlineTabBar tabs={MARKET_TABS} active={marketTab} onChange={setMarketTab} ariaLabel="시장 구분" />

        <div className="mx-3 flex flex-wrap items-center gap-3 px-1 py-2 text-xs sm:mx-5">
          <label className="ui-fg-secondary flex items-center gap-1.5">
            최소 점수
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className={`${UI.input} !mt-0 w-auto py-1`}
            >
              <option value={0}>전체</option>
              <option value={5}>5+</option>
              <option value={6}>6+</option>
              <option value={7}>7+</option>
            </select>
          </label>
          <label className="ui-fg-secondary flex items-center gap-1.5">
            <input type="checkbox" checked={hidePortfolio} onChange={(e) => setHidePortfolio(e.target.checked)} />
            보유 종목 숨기기
          </label>
        </div>

        <div className="space-y-0 p-3 sm:p-5">
          {error && <p className={`text-xs ${warnInline}`}>{error}</p>}

          {!report && !loading && (
            <p className="py-8 text-center text-sm text-zinc-300">「발굴 순위」로 KIS 순위 데이터를 불러오세요.</p>
          )}

          {report && !report.rankings && (
            <div className="py-6 text-center text-sm text-zinc-300">
              <p className={warnInline}>KIS API가 없어 실시간 순위 발굴을 사용할 수 없습니다.</p>
              <p className="mt-2 text-xs text-zinc-400">
                설정 탭에서 KIS 키를 입력하면 「강추!!」 탭이 활성화됩니다. API 없이도 「살까?팔까?」「기록해!」「얼마벌어?」는
                정상 사용 가능합니다.
              </p>
            </div>
          )}

          {report?.rankings && rawPicks.length > 0 && picks.length === 0 && !loading && (
            <p className="py-6 text-center text-sm text-zinc-300">필터 조건에 맞는 종목이 없습니다.</p>
          )}

          {report?.rankings && rawPicks.length === 0 && !loading && (
            <p className="py-6 text-center text-sm text-zinc-300">
              {marketTab === "KSP" ? "코스피" : "코스닥"} 후보가 없습니다. 시장 환경이 약세일 수 있습니다.
            </p>
          )}

          <div className={boxList}>
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
          </div>

          {trackStats.length > 0 && (
            <InsetCard className="mt-4">
              <p className="text-[11px] font-semibold text-zinc-300">발굴 신호 사후 추적 (참고)</p>
              <ul className="mt-1.5 space-y-1 text-[11px]">
                {trackStats.map((s) => (
                  <li key={s.code} className="flex justify-between gap-2 tabular-nums">
                    <span className="truncate text-white">{s.name}</span>
                    <span className={s.changePct >= 0 ? "text-gain" : "text-loss"}>
                      {s.daysHeld}일 {fmtPct(s.changePct)}
                    </span>
                  </li>
                ))}
              </ul>
            </InsetCard>
          )}

          <InsetCard className="mt-4 text-center text-[10px] leading-relaxed">
            KIS 순위(각 30건) + 시장·거시·수급 데이터 기반 참고용 목록입니다. 매매는 HTS·MTS에서 직접 하세요.
          </InsetCard>
        </div>
      </section>
    </>
  );
}
