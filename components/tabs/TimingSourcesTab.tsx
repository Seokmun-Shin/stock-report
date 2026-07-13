"use client";

import { useMemo, useState } from "react";
import type {
  TimingSourceReport,
  TimingSourceRow,
  TimingSourceSection,
  TimingUseTag,
} from "@/lib/briefing/timingSources";
import {
  TabIntroBanner,
  PanelCard,
  TabSectionHeader,
  panelShell,
  pickCard,
  boxList,
  AreaCardHeader,
  AreaSectionTitle,
  warnChip,
} from "@/components/ui/PanelCard";
import { tabLabel } from "@/lib/appTabs";
import { sanitizeExternalUrl } from "@/lib/safeUrl";
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
        <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-gain">매수</span>
      )}
      {showSell && (
        <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-loss">매도</span>
      )}
    </span>
  );
}

/** 지표 타일 — 순차 2열 그리드, 라벨·값은 한 줄 */
function SourceRow({ row }: { row: TimingSourceRow }) {
  return (
    <div
      className={`min-w-0 py-2 ${row.missing ? "rounded-lg bg-amber-500/10 px-2 -mx-0.5" : ""}`}
    >
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <p className="shrink-0 text-xs font-medium text-zinc-400">{row.label}</p>
        <p
          className={`min-w-0 text-right text-sm font-semibold leading-snug tabular-nums ${
            row.missing ? "ui-warn-inline" : "text-white"
          }`}
        >
          {row.value}
        </p>
      </div>
      {row.hint && <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">{row.hint}</p>}
    </div>
  );
}

function SourceRowList({ rows }: { rows: TimingSourceRow[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-0 sm:gap-x-10 md:gap-x-12">
      {rows.map((r, i) => (
        <SourceRow key={`${r.label}-${i}`} row={r} />
      ))}
    </div>
  );
}

function SourceListItems({ section }: { section: TimingSourceSection }) {
  if (!section.listItems) return null;

  if (section.listItems.length === 0 && section.id.includes("news")) {
    return <p className="mt-3 text-xs text-zinc-400">항목 없음 — 「뉴스·거시」 갱신하세요</p>;
  }

  if (section.listItems.length === 0) return null;

  return (
    <ul className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 sm:gap-x-10 md:gap-x-12">
      {section.listItems.map((item, i) => {
        const safeHref = sanitizeExternalUrl(item.link);
        return (
          <li key={`${item.title.slice(0, 24)}-${i}`} className="min-w-0">
            {safeHref ? (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs leading-snug text-zinc-100 hover:text-gain hover:underline"
              >
                {item.title}
              </a>
            ) : (
              <p className="text-xs leading-snug text-zinc-100">{item.title}</p>
            )}
            {item.meta && <p className="mt-0.5 text-[10px] text-zinc-400">{item.meta}</p>}
          </li>
        );
      })}
    </ul>
  );
}

function SourceSectionCard({
  section,
  defaultOpen = true,
}: {
  section: TimingSourceSection;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const missingInSection = section.rows.filter((r) => r.missing).length;

  return (
    <article className={pickCard}>
      <header>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full text-left"
        >
          <AreaCardHeader
            as="h3"
            title={section.title}
            subtitle={section.subtitle}
            badges={
              <>
                <UseTags tags={section.usedFor} />
                {missingInSection > 0 && (
                  <span className={`${warnChip} rounded-full px-2 py-0.5 text-[9px]`}>
                    미수집 {missingInSection}
                  </span>
                )}
              </>
            }
            trailing={<SectionCollapseToggle open={open} className="self-start sm:self-center" />}
          />
        </button>
      </header>

      {open && (
        <>
          <SourceRowList rows={section.rows} />
          <SourceListItems section={section} />
        </>
      )}
    </article>
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
  defaultOpen = true,
}: {
  sections: TimingSourceSection[];
  groupLabels: Record<string, string>;
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
      <div className={boxList}>
        {groups[0].items.map((sec) => (
          <SourceSectionCard key={sec.id} section={sec} defaultOpen={defaultOpen} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.id} className="space-y-3">
          <AreaSectionTitle as="p" size="group" className="px-1">
            {g.label}
          </AreaSectionTitle>
          <div className={boxList}>
            {g.items.map((sec) => (
              <SourceSectionCard key={sec.id} section={sec} defaultOpen={defaultOpen} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimingSourcesTab({
  report,
  stocks,
  activeId,
  onSelectStock,
}: {
  report: TimingSourceReport | null;
  stocks: { id: string; name: string; code?: string | null }[];
  activeId: string;
  onSelectStock: (id: string) => void;
}) {
  const [viewTab, setViewTab] = useState<SourceViewTab>("summary");

  if (!report) {
    return (
      <>
        <TabIntroBanner
          title={tabLabel("sources")}
          description={`「${tabLabel("verdict")}」「${tabLabel("discover")}」에 쓰인 시세·뉴스·수급 데이터를 검증합니다.`}
        />
        <PanelCard className="text-center text-sm text-zinc-300">
          <p>종목을 선택하세요.</p>
          <p className="mt-2 text-xs text-zinc-400">
            「{tabLabel("records")}」 탭에서 종목·체결을 먼저 등록하면 원천 데이터를 확인할 수 있습니다.
          </p>
        </PanelCard>
      </>
    );
  }

  const fetchedLabel = report.fetchedAt
    ? new Date(report.fetchedAt).toLocaleString("ko-KR")
    : null;

  const activeView = SOURCE_VIEW_TABS.find((t) => t.id === viewTab)!;

  return (
    <>
      <TabIntroBanner
        title={tabLabel("sources")}
        description={`「${tabLabel("verdict")}」「${tabLabel("discover")}」에 쓰인 시세·뉴스·수급 데이터를 검증합니다.`}
      />

      <TabSectionHeader
        eyebrow={tabLabel("sources")}
        title="원천 데이터"
        subtitle={fetchedLabel ? `브리핑 ${fetchedLabel}` : undefined}
      />

      <div className={`min-w-0 ${panelShell}`}>
        <StockPanelTitleRow>
          <StockTitleTabs stocks={stocks} activeId={activeId} onSelect={onSelectStock} />
        </StockPanelTitleRow>

        {report.missingCount > 0 && (
        <div className="border-b border-white/10 px-3 py-3 sm:px-5">
            <p className="text-[11px] text-amber-200">
              {report.actionableMissingCount > 0 ? (
                <>
                  미수집 필드 {report.actionableMissingCount}개 (
                  {report.missingFields
                    .filter((f) => !f.optional)
                    .map((f) => f.label)
                    .join(", ")}
                  ) — 「KIS 시세」「뉴스·거시」 확인
                </>
              ) : (
                <>
                  선택·미입력 {report.missingCount}개 (
                  {report.missingFields
                    .map((f) => f.label)
                    .join(", ")}
                  ) — <span className="text-zinc-300">{tabLabel("verdict")} 탭에는 영향 없음</span>
                </>
              )}
            </p>
        </div>
        )}

        <UnderlineTabBar
          tabs={SOURCE_VIEW_TABS}
          active={viewTab}
          onChange={setViewTab}
          ariaLabel="원천 데이터 구분"
        />

        <div className="p-3 sm:p-5" role="tabpanel">
          <p className="mb-4 text-xs leading-relaxed text-zinc-300">{activeView.description}</p>

          {viewTab === "summary" && (
            <GroupedSections
              sections={report.summarySections}
              groupLabels={{ overview: "종합" }}
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
    </>
  );
}
