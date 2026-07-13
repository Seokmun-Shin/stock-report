import type { AppTab } from "@/lib/appTabs";

/** 주기적 새로고침 — 다음 실행까지 남은 ms (0이면 즉시) */
export function nextPeriodicDelay(
  lastRefreshMs: number | undefined,
  intervalMs: number,
  nowMs: number = Date.now()
): number {
  if (!lastRefreshMs || lastRefreshMs <= 0) return 0;
  const elapsed = nowMs - lastRefreshMs;
  return elapsed >= intervalMs ? 0 : intervalMs - elapsed;
}

/** UI 타이머 — M:SS (초 단위 갱신) */
export function formatCountdownMs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** 모든 탭 공통 — 타이머·주기 갱신 기준 시각 */
export const GLOBAL_PERIODIC_KEY = "global" as const;
export type PeriodicRefreshKey = typeof GLOBAL_PERIODIC_KEY;

export function periodicRefreshKeyForTab(_tab: AppTab): PeriodicRefreshKey {
  return GLOBAL_PERIODIC_KEY;
}
