"use client";

import { useState, type ReactNode } from "react";
import { SectionTitle } from "./StatCard";

export function CollapsibleSection({
  title,
  unit,
  subtitle,
  summary,
  children,
  defaultOpen = false,
  accent = "default",
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

  const border =
    accent === "amber" ? "border-amber-200/80" : "border-slate-200/90";
  const headerHover = accent === "amber" ? "hover:bg-amber-50/40" : "hover:bg-slate-50/80";

  return (
    <section className={`min-w-0 overflow-hidden rounded-2xl border ${border} bg-white shadow-sm`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full min-w-0 flex-col gap-3 px-3 py-3.5 text-left transition sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-3 sm:px-5 sm:py-4 ${headerHover}`}
      >
        <div className="flex min-w-0 items-start gap-2 sm:flex-1 sm:gap-3">
          <div className="min-w-0 flex-1">
            {typeof title === "string" ? <SectionTitle unit={unit}>{title}</SectionTitle> : title}
            {subtitle && <p className="mt-1 text-sm leading-relaxed text-ink-muted">{subtitle}</p>}
            {!open && <p className="mt-1 text-xs text-ink-muted/80">탭하여 상세 보기</p>}
          </div>
          <span
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-dim text-ink-muted transition sm:order-last ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <div className="grid w-full min-w-0 grid-cols-2 gap-x-3 gap-y-2 sm:flex sm:w-auto sm:shrink-0 sm:flex-wrap sm:justify-end sm:gap-4">
          {summary}
        </div>
      </button>
      {open && (
        <div className="border-t border-line bg-surface-dim/30 px-3 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">{children}</div>
      )}
    </section>
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
  const valColor = tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-ink";
  return (
    <div className="min-w-0 text-left sm:text-right">
      <p className="truncate text-xs font-medium text-ink-muted">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-bold tabular-nums sm:text-lg ${valColor}`} title={value}>
        {value}
      </p>
    </div>
  );
}
