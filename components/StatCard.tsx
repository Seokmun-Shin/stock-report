"use client";

import { useState } from "react";
import { fmtPct } from "@/lib/calc";

export function UnitNotice() {
  return <span className="ml-1 text-sm font-normal text-ink-muted">(단위 : 원)</span>;
}

export function SectionTitle({ children, unit }: { children: React.ReactNode; unit?: boolean }) {
  return (
    <h2 className="text-base font-semibold text-ink sm:text-lg">
      {children}
      {unit && <UnitNotice />}
    </h2>
  );
}

export function HintTooltip({ text, align = "center" }: { text: string; align?: "center" | "right" }) {
  const [open, setOpen] = useState(false);
  const pos = align === "right" ? "right-0 left-auto translate-x-0" : "left-1/2 -translate-x-1/2";

  return (
    <span className="group/hint relative inline-flex align-middle">
      <button
        type="button"
        tabIndex={0}
        aria-label={`${text} (설명)`}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="ml-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold leading-none text-slate-400 hover:bg-slate-200/80 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-[calc(100%+6px)] z-30 w-max max-w-[260px] rounded-lg bg-slate-800 px-2.5 py-2 text-left text-xs font-normal leading-snug text-white shadow-lg ${pos} ${
          open ? "block" : "hidden group-hover/hint:block group-focus-within/hint:block"
        }`}
      >
        {text}
      </span>
    </span>
  );
}

function CardLabel({ label, hint, hintAlign }: { label: string; hint?: string; hintAlign?: "center" | "right" }) {
  return (
    <span className="inline-flex items-center">
      <span>{label}</span>
      {hint && <HintTooltip text={hint} align={hintAlign} />}
    </span>
  );
}

export function StatCard({
  label,
  hint,
  value,
  sub,
  tone = "neutral",
  inline = false,
  fill = false,
  hintAlign,
}: {
  label: string;
  hint?: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "gain" | "loss";
  inline?: boolean;
  fill?: boolean;
  hintAlign?: "center" | "right";
}) {
  const bg =
    tone === "gain" ? "bg-gain-soft border-blue-200" : tone === "loss" ? "bg-loss-soft border-red-200" : "bg-surface border-line";
  const valColor = tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-ink";

  if (inline) {
    return (
      <div className={`flex min-h-[2.75rem] min-w-0 items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${bg} ${fill ? "flex-1" : ""}`}>
        <div className="min-w-0 flex-1 text-sm font-semibold text-slate-700">
          <CardLabel label={label} hint={hint} hintAlign={hintAlign} />
        </div>
        <span className={`shrink-0 truncate text-right text-base font-bold tabular-nums ${valColor}`} title={value}>
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex min-h-[4.75rem] min-w-0 flex-col rounded-xl border p-3.5 shadow-sm ${bg}`}>
      <p className="text-sm font-semibold text-slate-700">
        <CardLabel label={label} hint={hint} hintAlign={hintAlign} />
      </p>
      <div className="mt-auto pt-2">
        <p className={`truncate text-right text-lg font-bold tabular-nums sm:text-xl ${valColor}`} title={value}>
          {value}
        </p>
        {sub && (
          <p className={`mt-0.5 truncate text-right text-sm tabular-nums ${tone !== "neutral" ? valColor : "text-slate-500"}`}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export function HeroMetric({
  label,
  hint,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  hint?: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "gain" | "loss";
}) {
  const valColor = tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-ink";
  return (
    <div className="min-w-0 max-w-[300px] shrink-0 text-right">
      <p className="text-sm font-semibold text-slate-700">
        <CardLabel label={label} hint={hint} hintAlign="right" />
      </p>
      <p className={`mt-1.5 whitespace-nowrap text-xl font-bold tabular-nums sm:text-2xl ${valColor}`}>
        <span title={value}>{value}</span>
        {sub && <span className="ml-2 text-lg font-semibold text-slate-500">{sub}</span>}
      </p>
    </div>
  );
}

export function ZoneDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-slate-300" />
      <span className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-600">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-300" />
    </div>
  );
}

export function Pct({ n }: { n: number }) {
  return (
    <span className={n > 0 ? "font-bold tabular-nums text-gain" : n < 0 ? "font-bold tabular-nums text-loss" : "font-bold tabular-nums text-ink"}>
      {fmtPct(n)}
    </span>
  );
}
