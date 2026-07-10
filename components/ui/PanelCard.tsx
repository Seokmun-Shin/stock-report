"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * 공통 UI 클래스 — 정의는 app/globals.css @layer components
 * 화면별로 border/bg 조합을 새로 만들지 말 것
 */
export const panelShell = "ui-glass-panel";
/** 앱 본문 최대 너비 — Dashboard · AppTabNav 와 동일 */
export const appLayoutMax = "max-w-7xl";
export const appShell = "ui-app-shell";
export const appHeader = "ui-app-header";
export const appChrome = "ui-app-chrome";
export const metaPill = "ui-meta-pill";
export const glassSurface = "ui-glass-panel";
export const panelBody = "p-3 sm:p-5";
/** 탭 본문 패널 — AppFlowBanner · PanelCard 와 동일 shell+padding */
export const tabPanel = `${panelShell} ${panelBody}`;
/** 탭 본문 — 세로 간격 */
export const tabPageCanvas = "ui-tab-page-stack min-w-0";
export const tabPageStack = "ui-tab-page-stack min-w-0";
/** 카드 나열 — 간격만 (면색은 ui-card-a 로 통일) */
export const boxList = "ui-box-list";
export const boxGrid = "ui-box-grid";
export const boxItem = "ui-box-item";
/** 종목 단위 카드 — ui-card-a 면 (살까?팔까?·강추!!) */
export const stockCard = "ui-stock-card";
export const tabIntroBanner = "ui-tab-intro-banner";
export const sectionHeader = "ui-section-header";
export const areaHeaderBar = "ui-area-header-bar";
export const panelHeaderBar = areaHeaderBar;
export const areaHeaderTitle = "ui-area-header-title";
export const areaHeaderEyebrow = "ui-area-header-eyebrow";
export const areaHeaderMeta = "ui-area-header-meta";
export const areaHeaderSubtitle = "ui-area-header-subtitle";
export const detailZoneLabel = "ui-detail-zone-label";
export const insetCard = "ui-glass-inset px-3 py-2.5 text-xs ui-fg-secondary";
export const insetRow = "ui-glass-inset-row";
export const listDivide = "ui-list-divide";
export const segmentTab = "ui-segment-tab";
export const segmentTabActive = "ui-segment-tab-active";
export const segmentTabLg = "ui-segment-tab-lg";
export const segmentTabLgActive = "ui-segment-tab-lg-active";
export const actionBlock = "ui-action-block";
export const guidePanel = "ui-guide-panel";
export const previewPanel = "ui-preview-panel";
export const linkAccent = "ui-link-accent";
export const chip = "ui-chip";
export const innerBlock = "ui-inner-block";
export const pickCard = "ui-pick-card";
export const pickDetailZone = "ui-pick-detail-zone";
export const warnBanner = "ui-warn-banner";
export const warnSurface = "ui-warn-surface";
export const warnInline = "ui-warn-inline";
export const warnChip = "ui-warn-chip";
export const amberInset = "ui-warn-banner rounded-lg px-3 py-2";

export const gainText = "text-gain";
export const lossText = "text-loss";
export const gainChip = "ui-gain-chip rounded px-1.5 py-0.5 text-[10px] font-bold";
export const lossChip = "ui-loss-chip rounded px-1.5 py-0.5 text-[10px] font-bold";
export const gainBlock = "ui-gain-chip rounded-2xl ring-1";
export const lossBlock = "ui-loss-chip rounded-2xl ring-1";

export const UI = {
  areaTitle: "ui-text-title",
  areaSubheading: "text-xs font-bold text-zinc-50",
  areaGroupLabel: "text-xs font-semibold tracking-wide text-zinc-200",
  areaSubtitle: "ui-area-header-subtitle",
  sectionTitle: "ui-text-title",
  subsectionTitle: "text-xs font-bold text-zinc-100",
  body: "ui-text-body",
  micro: "ui-text-micro",
  metricLabel: "text-xs font-medium text-zinc-200",
  metricHero: "text-xl font-bold tabular-nums sm:text-2xl",
  metricValue: "text-base font-bold tabular-nums",
  metricCompact: "text-sm font-bold tabular-nums leading-snug sm:text-base",
  dataTableWrap: "ui-glass-inset min-w-0 overflow-x-auto rounded-xl",
  dataTable: "w-full text-sm text-zinc-100",
  dataTh: "whitespace-nowrap px-2.5 py-2 font-medium text-zinc-200",
  dataTd: "whitespace-nowrap px-2.5 py-2 tabular-nums text-white",
  btnPrimary:
    "rounded-lg bg-gain px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-gain/90 disabled:opacity-50",
  btnSecondary: "ui-btn-secondary mt-0",
  headerBtn: "ui-btn-secondary font-semibold text-zinc-200 hover:text-white",
  headerBtnDanger: "ui-btn-secondary font-semibold text-loss",
  input: "ui-glass-input mt-1 tabular-nums",
  inputHero: "ui-glass-input mt-1.5 text-right text-lg font-bold tabular-nums",
} as const;

export function StatusPill({
  variant,
  children,
  className = "",
}: {
  variant: "ok" | "muted" | "warn";
  children: ReactNode;
  className?: string;
}) {
  const tone =
    variant === "ok"
      ? "ui-status-pill ui-status-pill-ok"
      : variant === "warn"
        ? "ui-status-pill ui-status-pill-warn"
        : "ui-status-pill ui-status-pill-muted";
  return <span className={`${tone} ${className}`.trim()}>{children}</span>;
}

export function GlassRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${insetRow} ${className}`.trim()}>{children}</div>;
}

export function AreaSectionTitle({
  children,
  size = "area",
  unit,
  as: Tag = "h2",
  className = "",
}: {
  children: ReactNode;
  size?: "area" | "sub" | "group";
  unit?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
}) {
  const sizeClass =
    size === "sub"
      ? UI.areaSubheading
      : size === "group"
        ? UI.areaGroupLabel
        : areaHeaderTitle;
  const cls = `${sizeClass} ${className}`.trim();
  return (
    <Tag className={cls}>
      {children}
      {unit && size === "area" && (
        <span className="ml-1 text-xs font-normal text-zinc-400">(단위 : 원)</span>
      )}
    </Tag>
  );
}

/** 추천 pickCard 헤더 — eyebrow · title · meta · subtitle · trailing */
export function AreaCardHeader({
  title,
  subtitle,
  meta,
  eyebrow,
  badges,
  trailing,
  unit,
  as = "h2",
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  eyebrow?: ReactNode;
  badges?: ReactNode;
  trailing?: ReactNode;
  unit?: boolean;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const Tag = as;
  return (
    <header className={`min-w-0 ${className}`.trim()}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {(eyebrow || badges) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {eyebrow}
              {badges}
            </div>
          )}
          <Tag className={`${areaHeaderTitle} ${eyebrow || badges ? "mt-1" : ""}`.trim()}>
            {title}
            {unit && <span className="ml-1 text-xs font-normal text-zinc-400">(단위 : 원)</span>}
          </Tag>
          {meta && <p className={areaHeaderMeta}>{meta}</p>}
          {subtitle && <p className={areaHeaderSubtitle}>{subtitle}</p>}
        </div>
        {trailing && (
          <div className="flex w-full min-w-0 flex-wrap items-stretch gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
            {trailing}
          </div>
        )}
      </div>
    </header>
  );
}

export function DetailZoneLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`${detailZoneLabel} ${className}`.trim()}>{children}</p>;
}

export function AreaSectionHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${areaHeaderBar} ${className}`.trim()}>{children}</div>;
}

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
    <div className={`${tabIntroBanner} leading-relaxed`}>
      <strong className="font-semibold text-white">{title}</strong>
      {" — "}
      {description}
    </div>
  );
}

export function PageSectionTitle({
  children,
  unit,
  subtitle,
  trailing,
  as = "h2",
}: {
  children: ReactNode;
  unit?: boolean;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <AreaCardHeader as={as} title={children} unit={unit} subtitle={subtitle} trailing={trailing} />
  );
}

export function InsetCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${insetCard} ${className}`.trim()}>{children}</div>;
}

export function BtnPrimary({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${UI.btnPrimary} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function BtnSecondary({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${UI.btnSecondary} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function PanelHeaderActions({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex shrink-0 items-center gap-1.5 ${className}`.trim()}>{children}</div>;
}

/** 패널 상단 — 목록/이전 화면 */
export function PanelBackButton({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`ui-btn-secondary mb-3.5 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-200 hover:text-white ${className}`.trim()}
      {...props}
    >
      <svg aria-hidden className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      {children}
    </button>
  );
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

/** 매매데이터 기준 — 세그먼트 탭 버튼 */
export function SegmentTab({
  active,
  size = "sm",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean; size?: "sm" | "lg" }) {
  const base = size === "lg" ? (active ? segmentTabLgActive : segmentTabLg) : active ? segmentTabActive : segmentTab;
  return (
    <button type="button" className={`${base} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function ActionBlockButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${actionBlock} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function LinkAccent({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${linkAccent} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export {
  BtnCreate,
  BtnSave,
  BtnRefresh,
  BtnCancel,
  BtnReset,
  BtnEdit,
  BtnDelete,
  BtnImport,
  BtnExport,
  BtnApply,
  BtnNavigate,
  BtnCreateBlock,
  BtnExpand,
  BtnTextAction,
  RefreshButton,
  RefreshButtonGroup,
} from "./AppButtons";

export { TabSectionHeader } from "./TabSectionHeader";
