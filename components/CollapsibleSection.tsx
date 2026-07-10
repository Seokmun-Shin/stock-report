"use client";

import { useState, type ReactNode } from "react";
import { AreaCardHeader, pickCard } from "./ui/PanelCard";

/** 영역 접기/펼치기 — 헤더 맨 우측 고정 */
export function SectionCollapseToggle({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center ui-btn-secondary transition ${open ? "rotate-180" : ""} ${className}`.trim()}
      aria-hidden
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** 추천 pickCard 와 동일 — panelShell 중첩 없음 */
export function CollapsibleSection({
  title,
  unit,
  subtitle,
  summary,
  children,
  defaultOpen = true,
}: {
  title: ReactNode;
  unit?: boolean;
  subtitle?: ReactNode;
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  accent?: "default" | "amber";
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article className={pickCard}>
      <header>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full text-left"
        >
          {typeof title === "string" ? (
            <AreaCardHeader
              as="h3"
              title={title}
              unit={unit}
              subtitle={subtitle}
              trailing={<SectionCollapseToggle open={open} className="self-start sm:self-center" />}
            />
          ) : (
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">{title}</div>
              <SectionCollapseToggle open={open} className="self-start sm:self-center" />
            </div>
          )}
          {!open && <p className="ui-fg-muted mt-1 text-xs">탭하여 상세 보기</p>}
          <div className="mt-2 flex gap-4 overflow-x-auto sm:hidden">{summary}</div>
          <div className="hidden shrink-0 sm:mt-2 sm:flex sm:items-center sm:gap-4">{summary}</div>
        </button>
      </header>
      {open && <div className="mt-3">{children}</div>}
    </article>
  );
}

export function SummaryChip({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "gain" | "loss";
}) {
  const valColor = tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "ui-fg-primary";
  return (
    <div className="min-w-[6.5rem] shrink-0 text-left sm:min-w-0 sm:text-right">
      <p className="ui-fg-muted truncate text-xs font-medium">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-bold tabular-nums sm:text-base ${valColor}`} title={value}>
        {value}
      </p>
    </div>
  );
}
