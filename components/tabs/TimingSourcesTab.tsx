"use client";

import { useMemo, useState } from "react";
import type { TimingSourceReport, TimingSourceSection, TimingUseTag } from "@/lib/briefing/timingSources";
import { TabIntroBanner, PanelCard, BtnSecondary, panelShell, AreaSectionSubtitle, AreaSectionTitle } from "@/components/ui/PanelCard";
import { SectionCollapseToggle } from "@/components/CollapsibleSection";
import { StockPanelTitleRow, StockTitleTabs, UnderlineTabBar } from "@/components/ui/StockTitleTabBar";

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
        className={`flex w-full items-start gap-3 border-b px-3 py-3 text-left sm:items-center sm:px-4 ${headerClass}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <AreaSectionTitle as="h3" size="area">
              {section.title}
            </AreaSectionTitle>
            <UseTags tags={section.usedFor} />
            {missingInSection > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-800">
                미수집 {missingInSection}
              </span>
            )}
          </div>
          {section.subtitle && <AreaSectionSubtitle>{section.subtitle}</AreaSectionSubtitle>}
        </div>
        <SectionCollapseToggle open={open} className="self-start sm:self-center" />
      </button>

      {open && (
        <>
          <div className="divide-y divide-line/60">
            {section.rows.map((r, i) => (
              <div
                key={`${r.label}-${i}`}
                className={`grid gap-1 px-3 py-2 sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-baseline sm:gap-3 sm:px-4 ${
                  r.missing ? "bg-amber-50/40" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink-muted">{r.label}</p>
                  {r.hint && <p className="mt-0.5 text-[10px] leading-snug text-ink-muted/80">{r.hint}</p>}
                </div>
                <p
                  className={`min-w-0 text-sm font-semibold tabular-nums sm:text-right ${
                    r.missing ? "text-amber-800" : "text-ink"
                  }`}
                >
                  {r.value}
                </p>
              </div>
            ))}
          </div>
          {section.listItems && section.listItems.length > 0 && (
            <ul className="divide-y divide-line/60 border-t border-line bg-surface-dim/20">
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

const SOURCE_VIEW_TABS = [
  { id: "summary" as const, label: "취합 결과", description: "아래 원천 데이터를 종합해 산출한 판단·신호·요약" },
  { id: "stock" as const, label: "종목 원천", description: "선택 종목에만 해당 — KIS 시세·수급, 내 매매 기록, 종목 뉴스" },
  { id: "common" as const, label: "공통 원천", description: "모든 종목 판단에 공통 적용 — KOSPI·글로벌·거시·뉴스" },
];

type SourceViewTab = (typeof SOURCE_VIEW_TABS)[number]["id"];

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
          <AreaSectionTitle as="p" size="group" className="px-1">
            {g.label}
          </AreaSectionTitle>
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
  const [viewTab, setViewTab] = useState<SourceViewTab>("summary");

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

  const activeView = SOURCE_VIEW_TABS.find((t) => t.id === viewTab)!;

  return (
    <div className="space-y-3">
      <TabIntroBanner
        title="① 원천 검증"
        description="「판단」과 같은 입력값을 확인합니다. 판단 자체는 「판단」 탭에서 봅니다."
      />

      <div className={`min-w-0 ${panelShell}`}>
        <StockPanelTitleRow
          trailing={
            <BtnSecondary onClick={onRefresh} disabled={refreshing} className="mb-3 sm:mb-3.5">
              {refreshing ? "갱신 중…" : "전체 새로고침"}
            </BtnSecondary>
          }
        >
          <StockTitleTabs stocks={stocks} activeId={activeId} onSelect={onSelectStock} />
        </StockPanelTitleRow>

        <div className="border-b border-line px-3 py-3 sm:px-5">
          <p className="text-xs text-ink-muted">
            {report.stockCode ? `코드 ${report.stockCode}` : "종목코드 미등록"}
            {fetchedLabel && <> · 브리핑 {fetchedLabel}</>}
          </p>
          {report.missingCount > 0 && (
            <p className="mt-1 text-[11px] text-amber-800">
              {report.actionableMissingCount > 0 ? (
                <>
                  미수집 필드 {report.actionableMissingCount}개 (
                  {report.missingFields
                    .filter((f) => !f.optional)
                    .map((f) => f.label)
                    .join(", ")}
                  ) — KIS · 데이터 새로고침 확인
                </>
              ) : (
                <>
                  선택·미입력 {report.missingCount}개 (
                  {report.missingFields
                    .map((f) => f.label)
                    .join(", ")}
                  ) — <span className="text-ink-muted">판단 탭에는 영향 없음</span>
                </>
              )}
            </p>
          )}
        </div>

        <UnderlineTabBar
          tabs={SOURCE_VIEW_TABS}
          active={viewTab}
          onChange={setViewTab}
          ariaLabel="원천 데이터 구분"
        />

        <div className="p-3 sm:p-5" role="tabpanel">
          <p className="mb-4 text-xs leading-relaxed text-ink-muted">{activeView.description}</p>

          {viewTab === "summary" && (
            <GroupedSections
              sections={report.summarySections}
              groupLabels={{ overview: "종합" }}
              variant="summary"
              defaultOpen
            />
          )}

          {viewTab === "stock" && (
            <GroupedSections
              sections={report.stockSections}
              groupLabels={STOCK_GROUP_LABEL}
              defaultOpen
            />
          )}

          {viewTab === "common" && (
            <GroupedSections
              sections={report.commonSections}
              groupLabels={COMMON_GROUP_LABEL}
              defaultOpen
            />
          )}
        </div>
      </div>
    </div>
  );
}
