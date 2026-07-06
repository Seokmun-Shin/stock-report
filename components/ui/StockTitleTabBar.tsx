"use client";

import { Fragment, type ReactNode } from "react";

export type StockTabBadge = "buy" | "sell" | null;

/** 판단 탭 기준 — 패널 상단 타이틀·종목 탭 행 */
export function StockPanelTitleRow({
  children,
  trailing,
}: {
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="border-b border-line px-3 pb-0 pt-4 sm:px-5 sm:pt-5">
      <div className="flex min-w-0 items-end justify-between gap-4">
        <div className="min-w-0 flex-1">{children}</div>
        {trailing}
      </div>
    </div>
  );
}

/** 판단 탭 기준 — 종목 전환 (활성: 대형·밑줄 / 비활성: 플랫 텍스트 탭) */
export function StockTitleTabs({
  stocks,
  activeId,
  onSelect,
  badgeById,
  titleId = "stock-page-title",
  panelId,
  ariaLabel = "종목 탭",
}: {
  stocks: { id: string; name: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  badgeById?: Map<string, StockTabBadge> | Record<string, StockTabBadge>;
  titleId?: string;
  panelId?: string;
  ariaLabel?: string;
}) {
  function badgeFor(id: string): StockTabBadge {
    if (!badgeById) return null;
    return badgeById instanceof Map ? (badgeById.get(id) ?? null) : (badgeById[id] ?? null);
  }

  return (
    <div
      className="flex min-w-0 flex-wrap items-end gap-x-5 gap-y-3 sm:gap-x-6"
      role="tablist"
      aria-label={ariaLabel}
    >
      {stocks.map((s, i) => {
        const active = s.id === activeId;
        const action = badgeFor(s.id);

        return (
          <Fragment key={s.id}>
            {i > 0 && (
              <span
                className="mb-3 shrink-0 text-[10px] font-extralight leading-none text-ink/25 sm:mb-3.5 sm:text-xs"
                aria-hidden
              >
                |
              </span>
            )}

            {active ? (
              <div className="relative shrink-0 pb-3 sm:pb-3.5">
                <h2
                  id={titleId}
                  role="tab"
                  aria-selected
                  tabIndex={0}
                  className="max-w-[min(100vw-2rem,20rem)] truncate text-xl font-bold tracking-tight text-ink sm:max-w-none sm:text-2xl"
                >
                  {s.name}
                </h2>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gain" aria-hidden />
              </div>
            ) : (
              <button
                type="button"
                role="tab"
                aria-selected={false}
                aria-controls={panelId}
                id={`stock-tab-${s.id}`}
                onClick={() => onSelect(s.id)}
                className="group relative inline-flex max-w-full shrink-0 items-center gap-1.5 pb-3 text-base font-medium text-ink-muted transition hover:text-ink sm:pb-3.5 sm:text-lg"
              >
                <span className="truncate">{s.name}</span>
                {action === "buy" && (
                  <span className="shrink-0 rounded bg-gain px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    매수
                  </span>
                )}
                {action === "sell" && (
                  <span className="shrink-0 rounded bg-loss px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    매도
                  </span>
                )}
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-line opacity-0 transition group-hover:opacity-100"
                  aria-hidden
                />
              </button>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/** 판단 탭 기준 — 일반 텍스트 탭 (원천 취합/종목/공통 등) */
export function UnderlineTabBar<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
  className = "",
}: {
  tabs: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      className={`border-b border-line px-3 pb-0 pt-3 sm:px-5 sm:pt-4 ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      <div className="flex min-w-0 flex-wrap items-end gap-x-5 gap-y-3 sm:gap-x-6">
        {tabs.map((tab, i) => {
          const selected = active === tab.id;
          return (
            <Fragment key={tab.id}>
              {i > 0 && (
                <span
                  className="mb-3 shrink-0 text-[10px] font-extralight leading-none text-ink/25 sm:mb-3.5 sm:text-xs"
                  aria-hidden
                >
                  |
                </span>
              )}
              {selected ? (
                <div className="relative shrink-0 pb-3 sm:pb-3.5">
                  <span
                    role="tab"
                    aria-selected
                    className="text-base font-bold tracking-tight text-ink sm:text-lg"
                  >
                    {tab.label}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gain" aria-hidden />
                </div>
              ) : (
                <button
                  type="button"
                  role="tab"
                  aria-selected={false}
                  onClick={() => onChange(tab.id)}
                  className="group relative shrink-0 pb-3 text-sm font-medium text-ink-muted transition hover:text-ink sm:pb-3.5 sm:text-base"
                >
                  {tab.label}
                  <span
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-line opacity-0 transition group-hover:opacity-100"
                    aria-hidden
                  />
                </button>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
