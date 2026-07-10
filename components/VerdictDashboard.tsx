"use client";

import { useMemo, type ReactNode } from "react";
import type { AlertItem } from "@/lib/alerts";
import type { StockTradingVerdict } from "@/lib/briefing/tradingVerdict";
import {
  VERDICT_COMPARE_ROWS,
  type AdviceTone,
  type VerdictPanelCopy,
  type VerdictPanelFact,
} from "@/lib/briefing/verdictDisplay";
import type { PortfolioSummary, StockQuote, StockSummary } from "@/lib/types";
import { fmt, fmtPct, fmtSigned } from "@/lib/calc";
import { tabLabel } from "@/lib/appTabs";
import {
  BtnCreate,
  BtnApply,
  RefreshButtonGroup,
  TabSectionHeader,
  boxGrid,
  boxList,
  stockCard,
  boxItem,
  pickCard,
  panelBody,
  panelShell,
  gainText,
  lossText,
  insetCard,
  UI,
} from "./ui/PanelCard";

/** 페이지 캔버스 — 카드는 ui-card-a 로 통일 */
const surfaceCard = panelShell;
const labelCaps = "ui-label-caps";
const textPrimary = "ui-fg-primary";
const textSecondary = "ui-fg-secondary";
const textMuted = "ui-fg-muted";
const textSubtle = "ui-fg-muted";
const canvasTitle = "ui-fg-primary text-lg font-semibold tracking-tight";
const canvasMuted = "ui-fg-secondary text-sm";
const canvasSubtle = "ui-fg-muted text-xs leading-relaxed sm:text-sm";
const canvasLabel = "ui-label-caps";
const gainBright = gainText;
const lossBright = lossText;

const ALERT_KIND: Record<AlertItem["kind"], { label: string; text: string }> = {
  buy: { label: "매수", text: gainBright },
  sell: { label: "매도", text: lossBright },
  target: { label: "목표", text: "ui-fg-primary" },
};

function formatKospiLabel(raw?: string): string {
  if (!raw) return "—";
  return raw.replace(/^KOSPI/i, "코스피");
}

function shortAlertMessage(message: string, stockName: string): string {
  const trimmed = message.replace(stockName, "").trim();
  return trimmed.replace(/^[\s·\-]+/, "") || message;
}

function groupAlertsByStock(alerts: AlertItem[]): Map<string, AlertItem[]> {
  const map = new Map<string, AlertItem[]>();
  for (const a of alerts) {
    const list = map.get(a.stockId) ?? [];
    list.push(a);
    map.set(a.stockId, list);
  }
  return map;
}

function SummaryCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={boxItem}>
      <p className={labelCaps}>{label}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function StatCell({
  label,
  value,
  tone = "ui-fg-primary",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0 tabular-nums">
      <p className={labelCaps}>{label}</p>
      <p className={`mt-2 truncate text-xl font-bold leading-tight tracking-tight tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: AdviceTone; children: ReactNode }) {
  const cls =
    tone === "buy"
      ? "ui-verdict-status ui-verdict-status-buy"
      : tone === "sell"
        ? "ui-verdict-status ui-verdict-status-sell"
        : tone === "hold"
          ? "ui-verdict-status ui-verdict-status-hold"
          : "ui-verdict-status ui-fg-muted bg-black/[0.04]";
  return <span className={cls}>{children}</span>;
}

function pctTone(suffix?: string | null): string {
  if (!suffix) return textMuted;
  if (suffix.includes("+")) return gainBright;
  if (suffix.includes("-")) return lossBright;
  return textMuted;
}

function CompareRow({ fact }: { fact: VerdictPanelFact }) {
  if (!fact.label || !fact.value) {
    return <div className="min-h-5" aria-hidden />;
  }

  return (
    <div className="flex min-w-0 items-baseline gap-2 text-xs leading-snug">
      <span className="ui-fg-muted min-w-0 flex-1 truncate">{fact.label}</span>
      <div className="flex shrink-0 items-baseline justify-end gap-1.5 tabular-nums text-right">
        <span className="ui-fg-primary whitespace-nowrap font-semibold">{fact.value}</span>
        {fact.suffix ? (
          <span className={`whitespace-nowrap font-medium ${pctTone(fact.suffix)}`}>{fact.suffix}</span>
        ) : null}
      </div>
    </div>
  );
}

function holdingValue(
  v: StockTradingVerdict,
  summaries: Record<string, StockSummary>
): number {
  const s = summaries[v.stockId];
  const qty = s?.holdingQty ?? 0;
  const price = s?.currentPrice ?? v.currentPrice;
  return qty > 0 ? qty * price : price;
}

function sortVerdicts(
  verdicts: StockTradingVerdict[],
  alertsByStock: Map<string, AlertItem[]>,
  summaries: Record<string, StockSummary>
): StockTradingVerdict[] {
  return [...verdicts].sort((a, b) => {
    const score = (v: StockTradingVerdict) => {
      let s = 0;
      if (v.buy.stance === "yes") s += 4;
      if (v.sell.stance === "yes") s += 4;
      if ((alertsByStock.get(v.stockId)?.length ?? 0) > 0) s += 2;
      return s;
    };
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    const valueDiff = holdingValue(b, summaries) - holdingValue(a, summaries);
    if (valueDiff !== 0) return valueDiff;
    return a.stockName.localeCompare(b.stockName, "ko");
  });
}

function StanceBadge({ stance, side }: { stance: "yes" | "wait" | "skip"; side: "buy" | "sell" }) {
  if (stance === "skip") return null;

  let label: string;
  if (side === "buy") {
    label = stance === "yes" ? "매수 권장" : "매수 대기";
  } else {
    label = stance === "yes" ? "매도 권장" : "매도 대기";
  }

  const cls =
    side === "buy" && stance === "yes"
      ? gainBright
      : side === "sell" && stance === "yes"
        ? lossBright
        : textMuted;

  return <span className={`text-[11px] font-medium ${cls}`}>{label}</span>;
}

function VerdictBlock({
  side,
  title,
  panel,
}: {
  side: "buy" | "sell";
  title: string;
  panel?: VerdictPanelCopy;
}) {
  const status = panel?.status ?? "—";
  const hero = panel?.hero;
  const adviceTone = panel?.adviceTone ?? "neutral";
  const heroText = side === "buy" ? gainBright : lossBright;
  const facts = panel?.facts ?? [];
  const compareRows = Array.from({ length: VERDICT_COMPARE_ROWS }, (_, i) =>
    facts[i] ?? { key: `empty-${i}`, label: null, value: null, tone: "muted" as const }
  );
  const panelCls = side === "buy" ? "ui-verdict-panel ui-verdict-panel-buy" : "ui-verdict-panel ui-verdict-panel-sell";

  return (
    <div className={panelCls}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="ui-fg-primary shrink-0 text-base font-bold tracking-tight">{title}</p>
        <StatusBadge tone={adviceTone}>{status}</StatusBadge>
      </div>

      <div className="mt-4 flex min-w-0 items-end justify-between gap-3">
        <p className={labelCaps}>{hero?.label ?? "권장가"}</p>
        <p
          className={`overflow-hidden text-right text-2xl font-bold leading-tight tracking-tight tabular-nums @[20rem]:text-3xl ${
            hero ? heroText : textSubtle
          }`}
        >
          {hero?.value ?? "—"}
        </p>
      </div>

      <div className="ui-verdict-compare">
        <p className={labelCaps}>기준가 비교</p>
        <div className="mt-2.5 space-y-2">
          {compareRows.map((f) => (
            <CompareRow key={f.key} fact={f} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StockAlertBlock({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className={`mt-6 min-w-0 ${insetCard}`}>
      <p className={`text-xs font-semibold ${textMuted}`}>알림 {alerts.length}</p>
      <ul className="mt-2 space-y-1.5">
        {alerts.map((a, i) => {
          const meta = ALERT_KIND[a.kind];
          const msg = shortAlertMessage(a.message, a.stockName);
          return (
            <li key={`${a.kind}-${i}`} className="flex min-w-0 items-start gap-2 text-xs leading-relaxed">
              <span className={`shrink-0 font-semibold ${meta.text}`}>{meta.label}</span>
              <span className={`min-w-0 flex-1 break-keep ${textSecondary}`}>{msg}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StockVerdictCard({
  verdict,
  summary,
  quote,
  alerts,
  onOpenDetail,
}: {
  verdict: StockTradingVerdict;
  summary: StockSummary | undefined;
  quote?: StockQuote;
  alerts: AlertItem[];
  onOpenDetail: () => void;
}) {
  const price = summary?.currentPrice ?? verdict.currentPrice;
  const change = quote?.changeRate;
  const hasAlerts = alerts.length > 0;

  return (
    <article className={stockCard}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            {hasAlerts ? (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
                title="구간 알림"
                aria-hidden
              />
            ) : null}
            <h3 className="ui-fg-primary min-w-0 break-keep text-lg font-bold tracking-tight sm:text-xl">
              {verdict.stockName}
            </h3>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <StanceBadge stance={verdict.buy.stance} side="buy" />
            <span className="ui-fg-muted" aria-hidden>
              ·
            </span>
            <StanceBadge stance={verdict.sell.stance} side="sell" />
          </div>
        </div>
        <BtnApply type="button" onClick={onOpenDetail} className="shrink-0 rounded-full px-4 py-2">
          상세
        </BtnApply>
      </div>

      <div className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
        <StatCell label="현재가" value={fmt(price)} />
        <StatCell
          label="전일"
          value={change != null ? fmtPct(change) : "—"}
          tone={change == null ? textMuted : change >= 0 ? gainBright : lossBright}
        />
        <StatCell
          label="보유"
          value={summary && summary.holdingQty > 0 ? `${summary.holdingQty}주` : "—"}
        />
      </div>

      <div className="ui-verdict-pair">
        <VerdictBlock side="buy" title="살까?" panel={verdict.buy.panel} />
        <VerdictBlock side="sell" title="팔까?" panel={verdict.sell.panel} />
      </div>

      <StockAlertBlock alerts={alerts} />
    </article>
  );
}

export function VerdictDashboard({
  portfolio,
  allVerdicts,
  summaries,
  stockQuotes,
  portfolioAlerts,
  kospiLabel,
  onOpenDetail,
  onKisRefresh,
  onBriefingRefresh,
  onAddStock,
  kisLoading,
  briefingLoading,
}: {
  portfolio: PortfolioSummary;
  allVerdicts: StockTradingVerdict[];
  summaries: Record<string, StockSummary>;
  stockQuotes?: Record<string, StockQuote>;
  portfolioAlerts: AlertItem[];
  kospiLabel?: string;
  onOpenDetail: (stockId: string) => void;
  onKisRefresh: () => void;
  onBriefingRefresh: () => void;
  onAddStock: () => void;
  kisLoading: boolean;
  briefingLoading: boolean;
}) {
  const pnlTone = portfolio.totalPnl >= 0 ? gainBright : lossBright;
  const alertsByStock = useMemo(() => groupAlertsByStock(portfolioAlerts), [portfolioAlerts]);
  const sortedVerdicts = useMemo(
    () => sortVerdicts(allVerdicts, alertsByStock, summaries),
    [allVerdicts, alertsByStock, summaries]
  );
  const actionCount = allVerdicts.filter(
    (v) => v.buy.stance === "yes" || v.sell.stance === "yes"
  ).length;

  return (
    <>
        <TabSectionHeader
          eyebrow={tabLabel("verdict")}
          title="오늘 한눈에"
          actions={
            <>
              <RefreshButtonGroup
                onKisRefresh={onKisRefresh}
                onBriefingRefresh={onBriefingRefresh}
                kisLoading={kisLoading}
                briefingLoading={briefingLoading}
              />
              <BtnCreate onClick={onAddStock}>종목 추가</BtnCreate>
            </>
          }
        />

      <div className={`${boxGrid} gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4`}>
          <SummaryCard label="총 손익">
            <p className={`truncate text-2xl font-bold tabular-nums tracking-tight ${pnlTone}`}>
              {fmtSigned(portfolio.totalPnl)}
            </p>
            <p className={`mt-1 text-sm font-medium tabular-nums ${pnlTone}`}>
              {fmtPct(portfolio.totalReturnRate)}
            </p>
          </SummaryCard>
          <SummaryCard label="판단 신호">
            <p className={`truncate text-2xl font-bold tabular-nums tracking-tight ${textPrimary}`}>
              {actionCount}건
            </p>
            <p className={`mt-1 text-sm font-medium tabular-nums ${textSecondary}`}>
              {allVerdicts.length}종 · 알림 {portfolioAlerts.length}
            </p>
          </SummaryCard>
          <SummaryCard label="코스피">
            <p className={`truncate text-2xl font-bold tabular-nums tracking-tight ${textPrimary}`}>
              {formatKospiLabel(kospiLabel)}
            </p>
          </SummaryCard>
          <SummaryCard label="체결">
            <p className={`text-sm font-semibold ${textPrimary}`}>{tabLabel("records")}</p>
            <p className={`mt-2 text-xs leading-relaxed ${textMuted}`}>하단 탭 · 체결 · CSV</p>
          </SummaryCard>
      </div>

      <section className="min-w-0 space-y-5">
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className={`text-lg font-semibold tracking-tight ${canvasTitle}`}>보유·관심 종목</h2>
              <p className={`mt-1 text-sm ${canvasMuted}`}>신호·알림 우선 · 보유 평가액 큰 순</p>
            </div>
            <span className={`${surfaceCard} shrink-0 px-3 py-1.5 text-[11px] font-semibold ${textSecondary}`}>
              {allVerdicts.length}종목
            </span>
          </div>

          {sortedVerdicts.length === 0 ? (
            <div className={`${surfaceCard} py-20 text-center`}>
              <p className={`text-base font-semibold ${textPrimary}`}>등록된 종목이 없습니다</p>
              <p className={`mt-2 text-sm ${textMuted}`}>종목 추가 후 「KIS 시세」「뉴스·거시」 갱신</p>
              <BtnCreate onClick={onAddStock} className="mt-5 rounded-full px-5 py-2.5">
                종목 추가
              </BtnCreate>
            </div>
          ) : (
            <div className={`${boxList} lg:grid lg:grid-cols-2 lg:gap-5`}>
              {sortedVerdicts.map((v) => (
                <StockVerdictCard
                  key={v.stockId}
                  verdict={v}
                  summary={summaries[v.stockId]}
                  quote={stockQuotes?.[v.stockId]}
                  alerts={alertsByStock.get(v.stockId) ?? []}
                  onOpenDetail={() => onOpenDetail(v.stockId)}
                />
              ))}
            </div>
          )}
        </section>

      <p className={`text-center text-xs leading-relaxed sm:text-sm ${canvasSubtle}`}>
        차트 · 타이밍선 · 판단 근거 → 종목 「상세」
      </p>
    </>
  );
}
