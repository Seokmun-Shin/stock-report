"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { TimingSourceReport, TimingSourceSection, TimingUseTag } from "@/lib/briefing/timingSources";
import { TabIntroBanner, PanelCard, BtnPrimary, panelShell } from "@/components/ui/PanelCard";
import { StockPills } from "@/components/ui/StockPills";

const STOCK_GROUP_LABEL: Record<string, string> = {
  kis: "KIS Open API",
  portfolio: "매매 기록 · 스냅샷",
  news: "종목 뉴스 · 공시",
  config: "전략 설정",
};

const COMMON_GROUP_LABEL: Record<string, string> = {
  domestic: "국내 시장",
  global: "글로벌 · 거시",
  news: "뉴스 · 정책",
  meta: "수집 상태",
};

function UseTags({ tags }: { tags: TimingUseTag[] }) {
  const showBuy = tags.includes("buy") || tags.includes("both");
  const showSell = tags.includes("sell") || tags.includes("both");
  return (
    <span className="flex shrink-0 gap-1">
      {showBuy && (
        <span className="rounded bg-gain-soft px-1.5 py-0.5 text-[9px] font-bold text-gain">매수</span>
      )}
      {showSell && (
        <span className="rounded bg-loss-soft px-1.5 py-0.5 text-[9px] font-bold text-loss">매도</span>
      )}
    </span>
  );
}

function SourceSectionCard({
  section,
  variant = "default",
  defaultOpen = true,
}: {
  section: TimingSourceSection;
  variant?: "default" | "summary" | "compact";
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const missingInSection = section.rows.filter((r) => r.missing).length;

  const borderClass =
    variant === "summary"
      ? "border-gain/25 ring-1 ring-gain/15"
      : "border-slate-200/90";

  const headerClass =
    variant === "summary"
      ? "border-line bg-gain-soft/40"
      : "border-line bg-surface-dim/40";

  return (
    <section className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${borderClass}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full flex-wrap items-start justify-between gap-2 border-b px-3 py-3 text-left sm:px-4 ${headerClass}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`font-bold text-ink ${variant === "summary" ? "text-sm sm:text-base" : "text-sm"}`}
            >
              {section.title}
            </h3>
            <UseTags tags={section.usedFor} />
            {missingInSection > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-800">
                미수집 {missingInSection}
              </span>
            )}
          </div>
          {section.subtitle && <p className="mt-0.5 text-xs text-ink-muted">{section.subtitle}</p>}
        </div>
        <span className="shrink-0 text-xs text-ink-muted">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <>
          <div className={`divide-y divide-line/60 ${variant === "compact" ? "text-xs" : ""}`}>
            {section.rows.map((r, i) => (
              <div
                key={`${r.label}-${i}`}
                className={`flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-4 ${
                  r.missing ? "bg-amber-50/40" : ""
                }`}
              >
                <div className="min-w-0 shrink-0 sm:w-[42%]">
                  <p className="text-xs font-medium text-ink-muted">{r.label}</p>
                  {r.hint && <p className="mt-0.5 text-[10px] leading-snug text-ink-muted/80">{r.hint}</p>}
                </div>
                <p
                  className={`min-w-0 break-all font-semibold tabular-nums sm:text-right ${
                    variant === "compact" ? "text-xs" : "text-sm"
                  } ${r.missing ? "text-amber-800" : "text-ink"}`}
                >
                  {r.value}
                </p>
              </div>
            ))}
          </div>
          {section.listItems && section.listItems.length > 0 && (
            <ul className="max-h-64 divide-y divide-line/60 overflow-y-auto border-t border-line bg-surface-dim/20">
              {section.listItems.map((item, i) => (
                <li key={`${item.title.slice(0, 24)}-${i}`} className="px-3 py-2 sm:px-4">
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs leading-relaxed text-ink hover:text-gain hover:underline"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <p className="text-xs leading-relaxed text-ink">{item.title}</p>
                  )}
                  {item.meta && <p className="mt-0.5 text-[10px] text-ink-muted">{item.meta}</p>}
                </li>
              ))}
            </ul>
          )}
          {section.listItems && section.listItems.length === 0 && section.id.includes("news") && (
            <p className="border-t border-line px-3 py-3 text-xs text-ink-muted sm:px-4">
              항목 없음 — 데이터 새로고침하세요
            </p>
          )}
        </>
      )}
    </section>
  );
}

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-8 w-1 shrink-0 rounded-full bg-gain/40" />
        <div>
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function GroupedSections({
  sections,
  groupLabels,
  variant = "default",
  defaultOpen = true,
}: {
  sections: TimingSourceSection[];
  groupLabels: Record<string, string>;
  variant?: "default" | "summary" | "compact";
  defaultOpen?: boolean;
}) {
  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, TimingSourceSection[]>();
    for (const s of sections) {
      const g = s.group ?? "other";
      if (!map.has(g)) {
        map.set(g, []);
        order.push(g);
      }
      map.get(g)!.push(s);
    }
    return order.map((g) => ({ id: g, label: groupLabels[g] ?? g, items: map.get(g)! }));
  }, [sections, groupLabels]);

  if (groups.length <= 1 && groups[0]?.items.length) {
    return (
      <div className="space-y-3">
        {groups[0].items.map((sec) => (
          <SourceSectionCard
            key={sec.id}
            section={sec}
            variant={sec.id === "summary-overview" ? "summary" : variant}
            defaultOpen={defaultOpen}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.id} className="space-y-2">
          <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">{g.label}</p>
          <div className="space-y-3">
            {g.items.map((sec) => (
              <SourceSectionCard key={sec.id} section={sec} variant={variant} defaultOpen={defaultOpen} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimingSourcesTab({
  report,
  onRefresh,
  refreshing,
  stocks,
  activeId,
  onSelectStock,
}: {
  report: TimingSourceReport | null;
  onRefresh: () => void;
  refreshing: boolean;
  stocks: { id: string; name: string }[];
  activeId: string;
  onSelectStock: (id: string) => void;
}) {
  if (!report) {
    return (
      <PanelCard className="text-center text-sm text-ink-muted">
        종목을 선택하세요
      </PanelCard>
    );
  }

  const fetchedLabel = report.fetchedAt
    ? new Date(report.fetchedAt).toLocaleString("ko-KR")
    : null;

  return (
    <div className="space-y-3">
      <TabIntroBanner
        title="① 원천 검증"
        description="「판단」과 같은 입력값을 확인합니다. 판단 자체는 「판단」 탭에서 봅니다."
      />

      <StockPills stocks={stocks} activeId={activeId} onSelect={onSelectStock} />

      <div className={`flex flex-wrap items-center justify-between gap-3 ${panelShell} p-3 sm:p-5`}>
        <div>
          <p className="text-sm font-bold text-ink">{report.stockName}</p>
          <p className="text-xs text-ink-muted">
            {report.stockCode ? `코드 ${report.stockCode}` : "종목코드 미등록"}
            {fetchedLabel && <> · 브리핑 {fetchedLabel}</>}
          </p>
          {report.missingCount > 0 && (
            <p className="mt-1 text-[11px] text-amber-800">
              미수집 필드 {report.missingCount}개 — KIS 새로고침 · 데이터 새로고침을 확인하세요
            </p>
          )}
        </div>
        <BtnPrimary onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "갱신 중…" : "전체 새로고침"}
        </BtnPrimary>
      </div>

      <SectionBlock
        title="1. 종목별 취합 결과"
        description="아래 원천 데이터를 종합해 산출한 판단·신호·요약"
      >
        <GroupedSections
          sections={report.summarySections}
          groupLabels={{ overview: "종합" }}
          variant="summary"
          defaultOpen
        />
      </SectionBlock>

      <SectionBlock
        title="2. 종목별 원천 데이터"
        description="선택 종목에만 해당 — KIS 시세·수급, 내 매매 기록, 종목 뉴스"
      >
        <GroupedSections
          sections={report.stockSections}
          groupLabels={STOCK_GROUP_LABEL}
          defaultOpen
        />
      </SectionBlock>

      <SectionBlock
        title="3. 공통 원천 데이터"
        description="모든 종목 판단에 공통 적용 — KOSPI·글로벌·거시·뉴스"
      >
        <GroupedSections
          sections={report.commonSections}
          groupLabels={COMMON_GROUP_LABEL}
          defaultOpen={false}
        />
      </SectionBlock>
    </div>
  );
}
