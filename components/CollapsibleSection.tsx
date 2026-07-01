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
    <section className={`overflow-hidden rounded-2xl border ${border} bg-white shadow-sm`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 text-left transition sm:px-5 sm:py-4 ${headerHover}`}
      >
        <div className="min-w-0 flex-1">
          {typeof title === "string" ? <SectionTitle unit={unit}>{title}</SectionTitle> : title}
          {subtitle && <p className="mt-1 text-sm leading-relaxed text-ink-muted">{subtitle}</p>}
          {!open && <p className="mt-1 text-xs text-ink-muted/80">클릭하면 상세 내역을 볼 수 있습니다</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 sm:gap-4">{summary}</div>
        <span
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-dim text-ink-muted transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="border-t border-line bg-surface-dim/30 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">{children}</div>
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
    <div className="text-right">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className={`mt-0.5 whitespace-nowrap text-base font-bold tabular-nums sm:text-lg ${valColor}`}>{value}</p>
    </div>
  );
}
