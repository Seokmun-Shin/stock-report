"use client";

import type { AppTab } from "@/components/AppTabNav";
import { APP_FLOW_STEPS, stepForTab } from "@/lib/appFlow";

export function AppFlowBanner({ tab }: { tab: AppTab }) {
  const current = stepForTab(tab);
  if (!current) return null;

  return (
    <section className="mt-4 rounded-2xl border border-slate-200/90 bg-white px-3 py-3 shadow-sm sm:px-5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">사용 흐름</p>
      <ol className="mt-2 flex flex-wrap gap-1.5">
        {APP_FLOW_STEPS.map((s) => {
          const active = s.step === current.step || s.alsoTab === tab;
          const inApp = !s.external;
          return (
            <li
              key={s.step}
              className={`rounded-lg px-2 py-1 text-[11px] font-medium leading-snug sm:text-xs ${
                active
                  ? "border border-gain/35 bg-gain-soft text-gain"
                  : inApp
                    ? "bg-surface-dim/60 text-ink-muted"
                    : "border border-dashed border-line bg-white text-ink-muted"
              }`}
              title={s.detail}
            >
              <span className="font-bold tabular-nums">{s.step}.</span> {s.short}
              {s.external && <span className="ml-0.5 text-[10px] opacity-70">(앱 밖)</span>}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs leading-relaxed text-ink-muted">{current.detail}</p>
    </section>
  );
}
