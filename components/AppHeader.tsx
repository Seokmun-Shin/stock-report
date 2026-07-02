import type { AppTab } from "@/components/AppTabNav";
import { AppBrand } from "@/components/AppBrand";
import { BRAND_HEADER } from "@/lib/brandGuide";

/** 탭별 헤더 타이틀 · BI tock tail 톤 */
export const HEADER_TITLE: Record<AppTab, string> = {
  verdict: "판단",
  sources: "원천",
  records: "기록",
  report: "성과",
  settings: "설정",
};

export const HEADER_DESC: Record<AppTab, string> = {
  verdict: "① 원천 수집 → 시점·금액 판단",
  sources: "① 판단 입력값 검증",
  records: "③ 체결 후 내역 입력",
  report: "④ 손익·수익률 → ① 보조",
  settings: "⑤ 전략·연동·데이터",
};

/** pipe | 좌·우 동일 간격 (px) — 가이드 BRAND_HEADER.segmentGapPx */
export const HEADER_PIPE_MARGIN = BRAND_HEADER.segmentGapPx;

/**
 * BI + thin pipe + 섹션 타이틀
 * 간격·타이포 클래스는 이 파일에 리터럴로 둠 (Tailwind purge 방지)
 */
export function AppHeaderLead({ tab }: { tab: AppTab }) {
  return (
    <div className="flex shrink-0 items-center">
      <AppBrand />
      <span
        className="mx-[9.6px] inline-block shrink-0 text-center text-[12px] font-extralight leading-none text-ink/25 sm:mx-[10.8px]"
        aria-hidden
      >
        |
      </span>
      <h1 className="shrink-0 whitespace-nowrap text-[16.8px] font-bold tracking-[-0.04em] text-ink/70 sm:text-[18px]">
        {HEADER_TITLE[tab]}
      </h1>
    </div>
  );
}

/** 헤더 — 좌: BI·타이틀 / 우: 설명 + meta (동기화 등) */
export function AppHeaderBlock({
  tab,
  meta,
  desc,
}: {
  tab: AppTab;
  meta?: React.ReactNode;
  desc?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 sm:gap-4">
      <AppHeaderLead tab={tab} />
      {desc || meta ? (
        <div className="flex min-w-0 shrink flex-col items-end gap-1.5 text-right sm:flex-row sm:items-center sm:gap-2">
          {desc ? (
            <p className="min-w-0 truncate text-xs leading-snug text-ink-muted sm:max-w-none sm:text-sm">
              {desc}
            </p>
          ) : null}
          {meta ? <div className="flex shrink-0 items-center">{meta}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
