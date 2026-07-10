"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { AppData, BuyTimingSignal, PortfolioSummary, SellTimingSignal, StockSummary } from "@/lib/types";
import { buildDailyReport, formatDailyReportText } from "@/lib/dailyReport";
import { buildMarketBrief, formatMarketBriefText } from "@/lib/briefing/marketBrief";
import type { MarketBriefingContext } from "@/lib/briefing/types";
import type { ReportSettings } from "@/lib/reportSettings";
import type { ParsedTradeRow } from "@/lib/import/tradeCsv";
import { PanelCard, AreaCardHeader, RefreshButton, BtnCancel, BtnCreate, BtnTextAction, BtnReset, TabIntroBanner, TabSectionHeader } from "@/components/ui/PanelCard";
import { APP_VERSION } from "@/lib/appVersion";
import { StrategySettingsForm } from "@/components/StrategySettingsForm";
import { DataReadinessPanel } from "@/components/DataReadinessPanel";
import { AppPreferencesPanel } from "@/components/AppPreferencesPanel";
import { DataBackupPanel } from "@/components/DataBackupPanel";
import { ApiKeysPanel } from "@/components/ApiKeysPanel";
import type { ReadinessItem } from "@/lib/dataReadiness";
import { CsvImportPanel } from "@/components/CsvImportPanel";
import { tabLabel } from "@/lib/appTabs";
import { sanitizeExternalUrl } from "@/lib/safeUrl";
import { AccountSwitcherPanel } from "@/components/AccountSwitcherPanel";

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
  onRestoreBackup,
  onPersist,
  cloudEnabled,
  standalone = false,
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
  onRestoreBackup: (next: AppData) => void;
  onPersist: (next: AppData) => void;
  cloudEnabled: boolean;
  standalone?: boolean;
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
    <>
      <TabIntroBanner
        title={tabLabel("settings")}
        description="필수 확인 · 매매 전략 · API(선택) · 백업. 탭 이동은 하단 메뉴를 사용하세요."
      />

      <DataReadinessPanel items={readinessItems} />

      <AppPreferencesPanel />

      <StrategySettingsForm settings={data.reportSettings} onSave={onSettingsChange} />

      <AccountSwitcherPanel data={data} onPersist={onPersist} />

      <ApiKeysPanel standalone={standalone} cloudEnabled={cloudEnabled} user={user} />

      <PanelCard>
        <AreaCardHeader
          title="매매 데이터"
          subtitle={`「${tabLabel("records")}」 — 증권사 체결 CSV · 일일 리포트 복사`}
        />
        <div className="mt-3 space-y-3">
          <CsvImportPanel stocks={data.stocks} trades={data.trades} onImport={onImportCsv} />
          <BtnTextAction type="button" onClick={copyReport} className="text-xs font-bold">
            {copied ? "리포트 텍스트 복사됨" : "일일 리포트 텍스트 복사"}
          </BtnTextAction>
        </div>
      </PanelCard>

      {standalone ? <DataBackupPanel data={data} onRestore={onRestoreBackup} /> : null}

      <PanelCard>
        <TabSectionHeader
          title="시장·뉴스 (보조)"
          actions={
            <RefreshButton kind="briefing" loading={briefingLoading} onClick={onBriefingRefresh} disabled={briefingLoading} />
          }
        />
        {briefingError && <p className="mt-2 text-xs text-amber-200">{briefingError}</p>}

        {marketContext?.globalIndices.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {marketContext.globalIndices.map((idx) => (
              <span
                key={idx.symbol}
                className={`rounded-lg bg-white/10 px-2 py-1 text-xs tabular-nums ${
                  idx.changeRate >= 0 ? "text-gain" : "text-loss"
                }`}
              >
                {idx.label} {idx.changeRate >= 0 ? "+" : ""}
                {idx.changeRate.toFixed(1)}%
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-300">「뉴스·거시」로 시장·뉴스 정보를 불러오세요.</p>
        )}

        {marketContext?.marketNews.length ? (
          <ul className="mt-3 space-y-2">
            {marketContext.marketNews.slice(0, 8).map((n, i) => {
              const safeHref = sanitizeExternalUrl(n.link);
              return (
              <li key={`news-${i}`}>
                {safeHref ? (
                <a
                  href={safeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-300 hover:text-gain"
                >
                  {n.title}
                </a>
                ) : (
                  <span className="text-sm text-zinc-300">{n.title}</span>
                )}
              </li>
              );
            })}
          </ul>
        ) : null}
      </PanelCard>

      {!standalone && (
        <div className="ui-inner-block border border-dashed border-white/10 px-3 py-2.5">
          <Link href="/brand-preview" className="text-xs font-bold text-gain hover:underline">
            M tock Brand Guidelines →
          </Link>
        </div>
      )}

      {!standalone && (
        <PanelCard>
          <AreaCardHeader title="계정 · 동기화" />
          <div className="mt-2 space-y-2 text-sm text-zinc-300">
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
            {user && <BtnCancel onClick={signOut}>로그아웃</BtnCancel>}
            <BtnReset onClick={onResetDemo} className="text-zinc-300">
              샘플 초기화
            </BtnReset>
          </div>
        </PanelCard>
      )}

      {standalone && (
        <PanelCard>
          <AreaCardHeader title="내 데이터" />
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
            기록은 이 기기에만 저장됩니다. 다른 PC·모바일에서 쓰려면 위 「다른 기기로 데이터
            옮기기」를 이용하세요.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <BtnCreate onClick={onResetDemo}>샘플 데이터 불러오기</BtnCreate>
          </div>
        </PanelCard>
      )}

      <p className="text-center text-[10px] text-zinc-300">
        {standalone
          ? `mtock v${APP_VERSION} · 로컬 전용 · 외부 클라우드 없음 · START.bat`
          : `mtock v${APP_VERSION} · 개발/웹 빌드`}
      </p>
    </>
  );
}
