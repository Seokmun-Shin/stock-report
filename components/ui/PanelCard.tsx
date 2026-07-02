"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/** 판단 탭 기준 — 외곽 패널 */
export const panelShell = "min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm";
export const panelBody = "p-3 sm:p-5";
export const panelHeaderBar = "border-b border-line px-3 py-2.5 sm:px-4";

/** 판단 탭 기준 — 안쪽 정보 블록 */
export const insetCard = "rounded-lg border border-line/80 bg-surface-dim/50 px-3 py-2.5 text-xs text-ink-muted";

/** 위치별 타이포·컨트롤 (판단 탭 기준) */
export const UI = {
  sectionTitle: "text-sm font-bold text-ink",
  subsectionTitle: "text-xs font-bold text-ink",
  body: "text-xs leading-relaxed text-ink-muted",
  micro: "text-[10px] text-ink-muted",
  metricLabel: "text-xs font-medium text-ink-muted",
  metricHero: "text-xl font-bold tabular-nums sm:text-2xl",
  metricValue: "text-base font-bold tabular-nums",
  btnPrimary:
    "rounded-lg bg-gain px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-gain/90 disabled:opacity-50",
  btnSecondary:
    "rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-sm hover:bg-surface-dim disabled:opacity-50",
  input:
    "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm tabular-nums text-ink outline-none focus:ring-2 focus:ring-blue-200",
  inputHero:
    "mt-1.5 w-full rounded-lg border border-line bg-surface-dim px-3 py-2.5 text-right text-lg font-bold tabular-nums text-ink outline-none focus:ring-2 focus:ring-blue-200",
} as const;

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
  return (
    <h2 className={UI.sectionTitle}>
      {children}
      {unit && <span className="ml-1 text-xs font-normal text-ink-muted">(단위 : 원)</span>}
    </h2>
  );
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
