"use client";

export type AppTab = "verdict" | "discover" | "sources" | "records" | "report" | "settings";

const TABS: { id: AppTab; label: string }[] = [
  { id: "verdict", label: "판단" },
  { id: "discover", label: "추천" },
  { id: "sources", label: "원천" },
  { id: "records", label: "기록" },
  { id: "report", label: "성과" },
  { id: "settings", label: "설정" },
];

export function AppTabNav({ active, onChange }: { active: AppTab; onChange: (tab: AppTab) => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-sm"
      aria-label="메인 메뉴"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-6">
        {TABS.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={selected ? "page" : undefined}
              className={`min-h-[3.25rem] text-[11px] font-bold transition sm:text-sm ${
                selected ? "text-gain" : "text-ink-muted hover:text-ink"
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
