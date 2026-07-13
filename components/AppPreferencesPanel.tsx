"use client";

import type { ReactNode } from "react";
import { REFRESH_ACTIONS } from "@/lib/refreshActions";
import { refreshIntervalLabel, type RefreshIntervalMinutes } from "@/lib/appPreferences";
import { useAppPreferences } from "@/components/AppPreferencesProvider";
import { AreaCardHeader, PanelCard, segmentTab, segmentTabActive } from "@/components/ui/PanelCard";

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={active ? segmentTabActive : segmentTab}>
      {children}
    </button>
  );
}

const INTERVAL_OPTIONS: RefreshIntervalMinutes[] = [5, 15, 30];

export function AppPreferencesPanel() {
  const { preferences, setRefreshMode, setRefreshIntervalMinutes, setTheme } = useAppPreferences();

  return (
    <PanelCard>
      <AreaCardHeader title="화면·갱신" subtitle="새로고침 동작과 밝기 모드를 설정합니다." />

      <div className="mt-4 space-y-5">
        <div>
          <p className="ui-fg-secondary text-xs font-semibold">새로고침</p>
          <p className="ui-fg-muted mt-1 text-xs leading-relaxed">
            「{REFRESH_ACTIONS.kis.label}」「{REFRESH_ACTIONS.briefing.label}」「
            {REFRESH_ACTIONS.discovery.label}」 · 상단 「전체 새로고침」
          </p>
          <div className="ui-mode-toggle-row mt-2">
            <ModeButton active={preferences.refreshMode === "periodic"} onClick={() => setRefreshMode("periodic")}>
              주기적
            </ModeButton>
            <ModeButton active={preferences.refreshMode === "manual"} onClick={() => setRefreshMode("manual")}>
              수동
            </ModeButton>
          </div>
          {preferences.refreshMode === "periodic" && (
            <div className="ui-mode-toggle-row mt-2">
              {INTERVAL_OPTIONS.map((m) => (
                <ModeButton
                  key={m}
                  active={preferences.refreshIntervalMinutes === m}
                  onClick={() => setRefreshIntervalMinutes(m)}
                >
                  {refreshIntervalLabel(m)}
                </ModeButton>
              ))}
            </div>
          )}
          <p className="ui-fg-muted mt-2 text-xs leading-relaxed">
            {preferences.refreshMode === "periodic"
              ? `해당 탭을 보는 동안 ${refreshIntervalLabel(preferences.refreshIntervalMinutes)}마다 갱신합니다. 남은 시간은 상단 타이머에 표시됩니다.`
              : "상단 새로고침 버튼을 눌러야 갱신됩니다."}
          </p>
        </div>

        <div>
          <p className="ui-fg-secondary text-xs font-semibold">화면보기</p>
          <div className="ui-mode-toggle-row mt-2">
            <ModeButton active={preferences.theme === "light"} onClick={() => setTheme("light")}>
              일반모드
            </ModeButton>
            <ModeButton active={preferences.theme === "dark"} onClick={() => setTheme("dark")}>
              다크모드
            </ModeButton>
          </div>
          <p className="ui-fg-muted mt-2 text-xs leading-relaxed">
            {preferences.theme === "light"
              ? "밝은 배경·흰 카드 기반 화면입니다."
              : "검은 배경 기반 화면입니다. (기본)"}
          </p>
        </div>
      </div>
    </PanelCard>
  );
}
