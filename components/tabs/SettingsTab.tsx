"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { AppData, BuyTimingSignal, PortfolioSummary, SellTimingSignal, StockSummary } from "@/lib/types";
import { buildDailyReport, formatDailyReportText } from "@/lib/dailyReport";
import { buildMarketBrief, formatMarketBriefText } from "@/lib/briefing/marketBrief";
import type { MarketBriefingContext } from "@/lib/briefing/types";
import type { ReportSettings } from "@/lib/reportSettings";
import { PanelCard, PageSectionTitle, BtnPrimary, BtnSecondary } from "@/components/ui/PanelCard";
import { APP_VERSION } from "@/lib/appVersion";
import { StrategySettingsForm } from "@/components/StrategySettingsForm";
import { SetupStatusPanel } from "@/components/SetupStatusPanel";
import { DataReadinessPanel } from "@/components/DataReadinessPanel";
import type { ReadinessItem } from "@/lib/dataReadiness";
import { CsvImportPanel } from "@/components/CsvImportPanel";
import type { ParsedTradeRow } from "@/lib/import/tradeCsv";

export function SettingsTab({
  data,
  portfolio,
  summaries,
  buySignals,
  sellSignals,
  marketContext,
  briefingLoading,
  briefingError,
  onBriefingRefresh,
  onSettingsChange,
  onImportCsv,
  user,
  signOut,
  onResetDemo,
  cloudEnabled,
  syncing,
  readinessItems = [],
}: {
  data: AppData;
  portfolio: PortfolioSummary;
  summaries: Record<string, StockSummary>;
  buySignals: Record<string, BuyTimingSignal>;
  sellSignals: Record<string, SellTimingSignal>;
  marketContext: MarketBriefingContext | null;
  briefingLoading: boolean;
  briefingError: string | null;
  onBriefingRefresh: () => void;
  onSettingsChange: (s: ReportSettings) => void;
  onImportCsv: (rows: ParsedTradeRow[]) => void;
  user: User | null;
  signOut: () => void;
  onResetDemo: () => void;
  cloudEnabled: boolean;
  syncing: boolean;
  readinessItems?: ReadinessItem[];
}) {
  const [copied, setCopied] = useState(false);

  const report = useMemo(
    () => buildDailyReport(data, portfolio, summaries, buySignals, sellSignals),
    [data, portfolio, summaries, buySignals, sellSignals]
  );

  const marketBrief = useMemo(
    () => buildMarketBrief(data, portfolio, summaries, buySignals, sellSignals),
    [data, portfolio, summaries, buySignals, sellSignals]
  );

  async function copyReport() {
    await navigator.clipboard.writeText(formatDailyReportText(report) + formatMarketBriefText(marketBrief));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <StrategySettingsForm settings={data.reportSettings} onSave={onSettingsChange} />

      <SetupStatusPanel />

      <DataReadinessPanel items={readinessItems} />

      <PanelCard>
        <PageSectionTitle>매매 데이터</PageSectionTitle>
        <p className="mt-1 text-xs text-ink-muted">③ 기록 — 증권사 체결 CSV 가져오기 · 일일 리포트 복사</p>
        <div className="mt-3 space-y-3">
          <CsvImportPanel stocks={data.stocks} trades={data.trades} onImport={onImportCsv} />
          <button type="button" onClick={copyReport} className="text-xs font-bold text-gain hover:underline">
            {copied ? "리포트 텍스트 복사됨" : "일일 리포트 텍스트 복사"}
          </button>
        </div>
      </PanelCard>

      <PanelCard>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PageSectionTitle>시장·뉴스 (① 보조)</PageSectionTitle>
          <BtnSecondary onClick={onBriefingRefresh} disabled={briefingLoading}>
            {briefingLoading ? "불러오는 중…" : "뉴스 새로고침"}
          </BtnSecondary>
        </div>
        {briefingError && <p className="mt-2 text-xs text-amber-800">{briefingError}</p>}

        {marketContext?.globalIndices.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {marketContext.globalIndices.map((idx) => (
              <span
                key={idx.symbol}
                className={`rounded-lg bg-surface-dim/50 px-2 py-1 text-xs tabular-nums ${
                  idx.changeRate >= 0 ? "text-gain" : "text-loss"
                }`}
              >
                {idx.label} {idx.changeRate >= 0 ? "+" : ""}
                {idx.changeRate.toFixed(1)}%
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">뉴스 새로고침을 눌러 시장 정보를 불러오세요.</p>
        )}

        {marketContext?.marketNews.length ? (
          <ul className="mt-3 space-y-2">
            {marketContext.marketNews.slice(0, 8).map((n, i) => (
              <li key={`news-${i}`}>
                <a
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ink-muted hover:text-gain"
                >
                  {n.title}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </PanelCard>

      <div className="rounded-lg border border-dashed border-line bg-surface-dim/40 px-3 py-2.5">
        <Link href="/brand-preview" className="text-xs font-bold text-gain hover:underline">
          M tock Brand Guidelines →
        </Link>
      </div>

      <PanelCard>
        <PageSectionTitle>계정 · 동기화</PageSectionTitle>
        <div className="mt-2 space-y-2 text-sm text-ink-muted">
          {cloudEnabled && user ? (
            <>
              <p className="truncate" title={user.email ?? ""}>
                {user.email}
              </p>
              <p className="text-xs text-gain">클라우드 {syncing ? "저장 중…" : "동기화"}</p>
            </>
          ) : (
            <p className="text-xs">로컬 저장 · .env 설정 시 클라우드 동기화</p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {user && (
            <BtnSecondary onClick={signOut}>로그아웃</BtnSecondary>
          )}
          <BtnSecondary onClick={onResetDemo} className="text-ink-muted">
            샘플 초기화
          </BtnSecondary>
        </div>
      </PanelCard>
      <p className="text-center text-[10px] text-ink-muted/70">
        mtock v{APP_VERSION} · 로컬 실행 중이면 START.bat 재실행 · Vercel은 git push 후 2~3분
      </p>
    </div>
  );
}
