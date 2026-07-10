/** 앱 화면·갱신 설정 — localStorage (기록 데이터와 분리) */

export type RefreshMode = "manual" | "periodic";
export type RefreshIntervalMinutes = 5 | 15 | 30;
export type UiTheme = "dark" | "light";

export interface AppPreferences {
  /** manual: 버튼만 · periodic: N분마다 (탭 활성 시) */
  refreshMode: RefreshMode;
  refreshIntervalMinutes: RefreshIntervalMinutes;
  theme: UiTheme;
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  refreshMode: "periodic",
  refreshIntervalMinutes: 15,
  theme: "dark",
};

const STORAGE_KEY = "stock-report-app-preferences";
const LEGACY_KIS_AUTO_KEY = "stock-report-kis-auto";

function parseInterval(v: unknown): RefreshIntervalMinutes {
  if (v === 5 || v === 30) return v;
  return 15;
}

export function loadAppPreferences(): AppPreferences {
  if (typeof localStorage === "undefined") return DEFAULT_APP_PREFERENCES;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_KIS_AUTO_KEY);
      if (legacy === "false") {
        return { ...DEFAULT_APP_PREFERENCES, refreshMode: "manual" };
      }
      return DEFAULT_APP_PREFERENCES;
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const rawMode = typeof parsed.refreshMode === "string" ? parsed.refreshMode : undefined;
    const mode: RefreshMode =
      rawMode === "manual"
        ? "manual"
        : rawMode === "auto" || rawMode === "periodic" || rawMode == null
          ? "periodic"
          : DEFAULT_APP_PREFERENCES.refreshMode;
    return {
      refreshMode: mode,
      refreshIntervalMinutes: parseInterval(parsed.refreshIntervalMinutes),
      theme: parsed.theme === "light" ? "light" : "dark",
    };
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

export function saveAppPreferences(prefs: AppPreferences): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  applyUiTheme(prefs.theme);
}

export function applyUiTheme(theme: UiTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

export function isPeriodicRefresh(mode: RefreshMode): boolean {
  return mode === "periodic";
}

/** @deprecated isPeriodicRefresh 사용 */
export function isAutoRefresh(mode: RefreshMode): boolean {
  return isPeriodicRefresh(mode);
}

export function refreshIntervalLabel(minutes: RefreshIntervalMinutes): string {
  return `${minutes}분`;
}
