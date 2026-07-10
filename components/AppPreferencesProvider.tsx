"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyUiTheme,
  DEFAULT_APP_PREFERENCES,
  loadAppPreferences,
  saveAppPreferences,
  type AppPreferences,
  type RefreshMode,
  type RefreshIntervalMinutes,
  type UiTheme,
} from "@/lib/appPreferences";

type AppPreferencesContextValue = {
  preferences: AppPreferences;
  setRefreshMode: (mode: RefreshMode) => void;
  setRefreshIntervalMinutes: (minutes: RefreshIntervalMinutes) => void;
  setTheme: (theme: UiTheme) => void;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_APP_PREFERENCES);

  useEffect(() => {
    const loaded = loadAppPreferences();
    setPreferences(loaded);
    applyUiTheme(loaded.theme);
  }, []);

  const setRefreshMode = useCallback((refreshMode: RefreshMode) => {
    setPreferences((prev) => {
      const next = { ...prev, refreshMode };
      saveAppPreferences(next);
      return next;
    });
  }, []);

  const setRefreshIntervalMinutes = useCallback((refreshIntervalMinutes: RefreshIntervalMinutes) => {
    setPreferences((prev) => {
      const next = { ...prev, refreshIntervalMinutes };
      saveAppPreferences(next);
      return next;
    });
  }, []);

  const setTheme = useCallback((theme: UiTheme) => {
    setPreferences((prev) => {
      const next = { ...prev, theme };
      saveAppPreferences(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ preferences, setRefreshMode, setRefreshIntervalMinutes, setTheme }),
    [preferences, setRefreshMode, setRefreshIntervalMinutes, setTheme]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences(): AppPreferencesContextValue {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  }
  return ctx;
}
