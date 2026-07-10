"use client";

import { appLayoutMax } from "@/components/ui/PanelCard";
import { type AppTab } from "@/lib/appTabs";
import { getNavTabs } from "@/lib/productPositioning";

export type { AppTab };

export function AppTabNav({
  active,
  onChange,
  standalone = false,
}: {
  active: AppTab;
  onChange: (tab: AppTab) => void;
  standalone?: boolean;
}) {
  const tabs = getNavTabs(standalone);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800/90 bg-zinc-950/95 backdrop-blur-sm"
      aria-label="메인 메뉴"
    >
      <div className={`mx-auto grid ${appLayoutMax} grid-cols-6`}>
        {tabs.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={selected ? "page" : undefined}
              className={`flex min-h-[3.75rem] touch-manipulation flex-col items-center justify-center px-0.5 py-2 text-[12px] font-bold leading-snug transition active:scale-[0.98] sm:min-h-[3.25rem] sm:text-[13px] ${
                selected ? "text-gain" : "text-zinc-300 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
