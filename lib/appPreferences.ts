/** 앱 화면·갱신 설정 — localStorage (기록 데이터와 분리) */

export type RefreshMode = "auto" | "manual";
export type UiTheme = "dark" | "light";

export interface AppPreferences {
  /** auto: 해당 탭 진입 시 갱신 · manual: 버튼만 */
  refreshMode: RefreshMode;
  theme: UiTheme;
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  refreshMode: "auto",
  theme: "dark",
};

const STORAGE_KEY = "stock-report-app-preferences";
const LEGACY_KIS_AUTO_KEY = "stock-report-kis-auto";

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
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      refreshMode: parsed.refreshMode === "manual" ? "manual" : "auto",
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

export function isAutoRefresh(mode: RefreshMode): boolean {
  return mode === "auto";
}
