"use client";

import type { AppTab } from "@/lib/appTabs";
import { LEDGER_FLOW_STEPS, ledgerStepForTab } from "@/lib/ledgerFlow";

/** 기록 + 원천 → 손익 → 타이밍 3단계 */
export function AppFlowBanner({ tab }: { tab: AppTab }) {
  const current = ledgerStepForTab(tab);
  if (!current) return null;

  return (
    <section className="ui-flow-banner min-w-0">
      <p className="ui-fg-muted text-xs font-bold uppercase tracking-wide">기록 + 원천 → 손익 → 타이밍</p>
      <ol className="ui-flow-step-row mt-2">
        {LEDGER_FLOW_STEPS.map((s) => {
          const active = s.step === current.step;
          return (
            <li
              key={s.step}
              className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium leading-snug sm:text-sm ${
                active
                  ? "border border-gain/35 bg-gain/20 text-gain"
                  : "ui-flow-step-idle"
              }`}
              title={s.detail}
            >
              <span className="font-bold tabular-nums">{s.step}.</span> {s.short}
            </li>
          );
        })}
      </ol>
      <p className="ui-fg-secondary mt-2 text-xs leading-relaxed">{current.detail}</p>
    </section>
  );
}