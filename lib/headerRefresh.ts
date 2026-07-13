import { REFRESH_ACTIONS } from "@/lib/refreshActions";

export type TabRefreshControls = {
  hint: string;
  onRefreshAll: () => void;
  allLoading: boolean;
};

/** 모든 탭 — KIS · 뉴스·거시 · 발굴 순위 일괄 갱신 */
export function resolveTabRefreshControls(handlers: {
  refreshAll: () => void;
  kisLoading: boolean;
  briefingLoading: boolean;
  discoveryLoading: boolean;
}): TabRefreshControls {
  const { refreshAll, kisLoading, briefingLoading, discoveryLoading } = handlers;

  return {
    hint: `${REFRESH_ACTIONS.kis.hint} · ${REFRESH_ACTIONS.briefing.hint} · ${REFRESH_ACTIONS.discovery.hint}`,
    onRefreshAll: refreshAll,
    allLoading: kisLoading || briefingLoading || discoveryLoading,
  };
}
