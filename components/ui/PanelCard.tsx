"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/** 판단 탭 기준 — 외곽 패널 */
export const panelShell = "min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm";
export const panelBody = "p-3 sm:p-5";
/** 판단 · 원천 탭 SourceSectionCard 기준 — 영역 헤더 바 */
export const areaHeaderBar = "border-b border-line bg-surface-dim/40 px-3 py-3 sm:px-4";
export const panelHeaderBar = areaHeaderBar;

/** 판단 탭 기준 — 안쪽 정보 블록 */
export const insetCard = "rounded-lg border border-line/80 bg-surface-dim/50 px-3 py-2.5 text-xs text-ink-muted";

/** 위치별 타이포·컨트롤 (판단 탭 · 원천 탭 SourceSectionCard 기준) */
export const UI = {
  /** 카드 영역 헤더 — 원천 「한눈에 보기」 (14px → sm 16px) */
  areaTitle: "text-sm font-bold tracking-[-0.04em] text-ink sm:text-base",
  /** 카드 내부 소구역 — 실현/평가 블록 등 */
  areaSubheading: "text-xs font-bold text-ink",
  /** 원천 그룹 라벨 — KIS Open API 등 */
  areaGroupLabel: "text-xs font-semibold tracking-wide text-ink-muted",
  areaSubtitle: "mt-0.5 text-xs leading-snug text-ink-muted",
  sectionTitle: "text-sm font-bold tracking-[-0.04em] text-ink sm:text-base",
  subsectionTitle: "text-xs font-bold text-ink",
  body: "text-xs leading-relaxed text-ink-muted",
  micro: "text-[10px] text-ink-muted",
  metricLabel: "text-xs font-medium text-ink-muted",
  metricHero: "text-xl font-bold tabular-nums sm:text-2xl",
  metricValue: "text-base font-bold tabular-nums",
  /** 카드·표 안쪽 숫자 (과대 방지) */
  metricCompact: "text-sm font-bold tabular-nums leading-snug sm:text-base",
  dataTableWrap: "min-w-0 overflow-x-auto rounded-xl border border-line",
  dataTable: "w-full text-sm",
  dataTh: "whitespace-nowrap px-2.5 py-2 font-medium",
  dataTd: "whitespace-nowrap px-2.5 py-2 tabular-nums",
  btnPrimary:
    "rounded-lg bg-gain px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-gain/90 disabled:opacity-50",
  btnSecondary:
    "rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-sm hover:bg-surface-dim disabled:opacity-50",
  /** 영역 헤더 우측 액션 (라운드 박스) */
  headerBtn:
    "rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink-muted shadow-sm hover:bg-surface-dim hover:text-ink disabled:opacity-50",
  headerBtnDanger:
    "rounded-lg border border-loss/25 bg-white px-2.5 py-1 text-xs font-semibold text-loss shadow-sm hover:bg-loss-soft disabled:opacity-50",
  input:
    "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm tabular-nums text-ink outline-none focus:ring-2 focus:ring-gain/25",
  inputHero:
    "mt-1.5 w-full rounded-lg border border-line bg-surface-dim px-3 py-2.5 text-right text-lg font-bold tabular-nums text-ink outline-none focus:ring-2 focus:ring-gain/25",
} as const;

/** 원천 탭 SourceSectionCard 기준 — 영역 헤더 타이틀 */
export function AreaSectionTitle({
  children,
  size = "area",
  unit,
  as: Tag = "h2",
  className = "",
}: {
  children: ReactNode;
  /** area=카드 헤더 · sub=카드 내부 · group=그룹 라벨 */
  size?: "area" | "sub" | "group";
  unit?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
}) {
  const sizeClass =
    size === "sub" ? UI.areaSubheading : size === "group" ? UI.areaGroupLabel : UI.areaTitle;
  const cls = `${sizeClass} ${className}`.trim();
  return (
    <Tag className={cls}>
      {children}
      {unit && size === "area" && (
        <span className="ml-1 text-xs font-normal text-ink-muted">(단위 : 원)</span>
      )}
    </Tag>
  );
}

/** 영역 헤더 행 — 원천 SourceSectionCard 헤더와 동일 패딩·배경 */
export function AreaSectionHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${areaHeaderBar} ${className}`.trim()}>{children}</div>;
}

/** 원천 탭 SourceSectionCard 기준 — 영역 헤더 부제 */
export function AreaSectionSubtitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`${UI.areaSubtitle} ${className}`.trim()}>{children}</p>;
}

export function PanelCard({
  children,
  className = "",
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return <section className={`${panelShell} ${padding ? panelBody : ""} ${className}`.trim()}>{children}</section>;
}

export function TabIntroBanner({ title, description }: { title: string; description: string }) {
  return (
    <div className={`${insetCard} leading-relaxed`}>
      <strong className="font-semibold text-ink">{title}</strong>
      {" — "}
      {description}
    </div>
  );
}

export function PageSectionTitle({ children, unit }: { children: ReactNode; unit?: boolean }) {
  return <AreaSectionTitle unit={unit}>{children}</AreaSectionTitle>;
}

export function InsetCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${insetCard} ${className}`.trim()}>{children}</div>;
}

export function BtnPrimary({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${UI.btnPrimary} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${UI.btnSecondary} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

/** 영역 헤더 우측 버튼 묶음 */
export function PanelHeaderActions({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex shrink-0 items-center gap-1.5 ${className}`.trim()}>{children}</div>;
}

export function HeaderActionButton({
  variant = "default",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "danger" }) {
  const style = variant === "danger" ? UI.headerBtnDanger : UI.headerBtn;
  return (
    <button type="button" className={`${style} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
