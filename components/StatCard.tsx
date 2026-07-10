"use client";

import { useState } from "react";
import { fmtPct } from "@/lib/calc";
import { AreaCardHeader } from "./ui/PanelCard";

export function UnitNotice() {
  return <span className="ui-fg-muted ml-1 text-xs font-normal">(단위 : 원)</span>;
}

export function SectionTitle({
  children,
  unit,
  subtitle,
  trailing,
}: {
  children: React.ReactNode;
  unit?: boolean;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <AreaCardHeader as="h2" title={children} unit={unit} subtitle={subtitle} trailing={trailing} />
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
        className="ml-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold leading-none text-zinc-500 hover:bg-white/10 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-gain/25"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-[calc(100%+6px)] z-30 w-max max-w-[260px] rounded-lg bg-zinc-900 px-2.5 py-2 text-left text-xs font-normal leading-snug text-white shadow-lg ${pos} ${
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
  className = "",
}: {
  label: string;
  hint?: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "gain" | "loss";
  inline?: boolean;
  fill?: boolean;
  hintAlign?: "center" | "right";
  className?: string;
}) {
  const valColor = tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "ui-fg-primary";

  if (inline) {
    return (
      <div className={`ui-inner-block flex min-h-[2.5rem] min-w-0 items-center justify-between gap-2 py-2 ${fill ? "flex-1" : ""}`}>
        <div className="ui-fg-secondary min-w-0 flex-1 text-xs font-medium sm:text-sm">
          <CardLabel label={label} hint={hint} hintAlign={hintAlign} />
        </div>
        <span className={`shrink-0 text-right text-sm font-bold tabular-nums leading-snug ${valColor}`} title={value}>
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className={`ui-inner-block flex min-w-0 flex-col p-2.5 ${className} ${tone !== "neutral" ? (tone === "gain" ? "bg-red-500/10" : "bg-blue-500/10") : ""}`}>
      <p className="ui-fg-secondary text-xs font-medium">
        <CardLabel label={label} hint={hint} hintAlign={hintAlign} />
      </p>
      <div className="mt-1.5">
        <p
          className={`text-right text-sm font-bold tabular-nums leading-snug sm:text-base ${valColor}`}
          title={value}
        >
          {value}
        </p>
        {sub && (
          <p
            className={`mt-0.5 text-right text-xs tabular-nums sm:text-sm ${tone !== "neutral" ? valColor : "text-zinc-300"}`}
          >
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
  const valColor = tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-white";
  return (
    <div className="min-w-0 max-w-[300px] shrink-0 text-right">
      <p className="text-sm font-semibold text-zinc-300">
        <CardLabel label={label} hint={hint} hintAlign="right" />
      </p>
      <p className={`mt-1.5 whitespace-nowrap text-xl font-bold tabular-nums sm:text-2xl ${valColor}`}>
        <span title={value}>{value}</span>
        {sub && <span className="ml-2 text-lg font-semibold text-zinc-300">{sub}</span>}
      </p>
    </div>
  );
}

export function ZoneDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-white/15" />
      <span className="shrink-0 ui-chip px-2.5 py-0.5 text-xs font-semibold text-zinc-300">
        {label}
      </span>
      <div className="h-px flex-1 bg-white/15" />
    </div>
  );
}

export function Pct({ n }: { n: number }) {
  return (
    <span className={n > 0 ? "font-bold tabular-nums text-gain" : n < 0 ? "font-bold tabular-nums text-loss" : "font-bold tabular-nums text-white"}>
      {fmtPct(n)}
    </span>
  );
}
