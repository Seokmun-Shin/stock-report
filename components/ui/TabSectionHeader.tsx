"use client";

import type { ReactNode } from "react";

/** 「오늘 한눈에」 기준 — eyebrow · 제목 · (부제) · 우측 액션(새로고침 등) */
export function TabSectionHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className = "",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`ui-section-header flex min-w-0 flex-wrap items-end justify-between gap-3 sm:gap-4 ${className}`.trim()}
    >
      <div className="min-w-0 flex-1 basis-[min(100%,12rem)]">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-300">{eyebrow}</p>
        ) : null}
        <h2
          className={`text-2xl font-semibold tracking-tight text-white sm:text-3xl ${
            eyebrow ? "mt-1" : ""
          }`.trim()}
        >
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
