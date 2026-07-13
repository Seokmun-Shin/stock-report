"use client";

import { useEffect, useState } from "react";
import type { RefreshIntervalMinutes, RefreshMode } from "@/lib/appPreferences";
import { isPeriodicRefresh, refreshIntervalLabel } from "@/lib/appPreferences";
import { formatCountdownMs, nextPeriodicDelay } from "@/lib/periodicRefresh";
import type { TabRefreshControls } from "@/lib/headerRefresh";

function RefreshGlyph({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      aria-hidden
      className={`h-3.5 w-3.5 shrink-0 ${spinning ? "animate-spin" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** 헤더 — 한 줄: 주기·타입 · 남은시간 · 새로고침 */
export function RefreshControlCluster({
  controls,
  refreshMode,
  refreshIntervalMinutes,
  lastRefreshMs,
}: {
  controls: TabRefreshControls;
  refreshMode: RefreshMode;
  refreshIntervalMinutes: RefreshIntervalMinutes;
  lastRefreshMs?: number;
}) {
  const intervalMs = refreshIntervalMinutes * 60_000;
  const periodic = isPeriodicRefresh(refreshMode);
  const [remainingMs, setRemainingMs] = useState(() =>
    periodic ? nextPeriodicDelay(lastRefreshMs, intervalMs) : null
  );

  useEffect(() => {
    if (!periodic) {
      setRemainingMs(null);
      return;
    }
    function tick() {
      setRemainingMs(nextPeriodicDelay(lastRefreshMs, intervalMs));
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [periodic, lastRefreshMs, intervalMs]);

  const timerText =
    periodic && remainingMs != null ? formatCountdownMs(remainingMs) : null;

  const statusLine = periodic
    ? `주기 ${refreshIntervalLabel(refreshIntervalMinutes)} · ${timerText ?? "—"}`
    : "수동 갱신";

  return (
    <div
      className="inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1"
      title={controls.hint}
    >
      <span
        className="truncate text-[11px] tabular-nums text-zinc-400"
        aria-live="polite"
      >
        {statusLine}
      </span>
      <button
        type="button"
        onClick={controls.onRefreshAll}
        disabled={controls.allLoading}
        title={controls.hint}
        aria-label="새로고침"
        className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-100 transition-colors hover:bg-white/15 disabled:opacity-50"
      >
        <RefreshGlyph spinning={controls.allLoading} />
        새로고침
      </button>
    </div>
  );
}

/** @deprecated RefreshControlCluster 사용 */
export const HeaderRefreshControl = RefreshControlCluster;
