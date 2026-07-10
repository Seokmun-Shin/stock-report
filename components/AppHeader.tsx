import type { ReactNode } from "react";
import type { AppTab } from "@/lib/appTabs";
import { APP_TAB_HEADER } from "@/lib/appTabs";
import { AppBrand } from "@/components/AppBrand";
import { BRAND_HEADER } from "@/lib/brandGuide";

/** @deprecated APP_TAB_HEADER.title 사용 */
export const HEADER_TITLE: Record<AppTab, string> = Object.fromEntries(
  Object.entries(APP_TAB_HEADER).map(([k, v]) => [k, v.title])
) as Record<AppTab, string>;

/** @deprecated APP_TAB_HEADER.desc 사용 */
export const HEADER_DESC: Record<AppTab, string> = Object.fromEntries(
  Object.entries(APP_TAB_HEADER).map(([k, v]) => [k, v.desc])
) as Record<AppTab, string>;

/** pipe | 좌·우 동일 간격 (px) — 가이드 BRAND_HEADER.segmentGapPx */
export const HEADER_PIPE_MARGIN = BRAND_HEADER.segmentGapPx;

/**
 * BI + thin pipe + 섹션 타이틀
 * 간격·타이포 클래스는 이 파일에 리터럴로 둠 (Tailwind purge 방지)
 */
export function AppHeaderLead({ tab }: { tab: AppTab }) {
  const { title } = APP_TAB_HEADER[tab];
  return (
    <div className="flex min-w-0 max-w-full items-center">
      <AppBrand />
      <span
        className="mx-2 inline-block shrink-0 text-center text-[12px] font-extralight leading-none text-zinc-600 sm:mx-[10.8px]"
        aria-hidden
      >
        |
      </span>
      <h1 className="ui-fg-primary min-w-0 truncate text-base font-bold tracking-[-0.04em] sm:text-[18px] sm:whitespace-nowrap">
        {title}
      </h1>
    </div>
  );
}

/** 헤더 — 1행: BI·탭 타이틀 + meta / 2행: 탭 설명 (겹침 방지) */
export function AppHeaderBlock({
  tab,
  meta,
  desc,
}: {
  tab: AppTab;
  meta?: ReactNode;
  desc?: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <AppHeaderLead tab={tab} />
        {meta ? <div className="shrink-0">{meta}</div> : null}
      </div>
      {desc ? <p className="ui-fg-muted text-xs leading-relaxed sm:text-sm">{desc}</p> : null}
    </div>
  );
}