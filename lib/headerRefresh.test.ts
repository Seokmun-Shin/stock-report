import { describe, expect, it, vi } from "vitest";
import { resolveTabRefreshControls } from "./headerRefresh";

describe("resolveTabRefreshControls", () => {
  it("all tabs use refreshAll", () => {
    const refreshAll = vi.fn();
    const handlers = {
      refreshAll,
      kisLoading: false,
      briefingLoading: false,
      discoveryLoading: false,
    };

    for (const tab of ["verdict", "discover", "settings"] as const) {
      refreshAll.mockClear();
      const c = resolveTabRefreshControls(handlers);
      c.onRefreshAll();
      expect(refreshAll).toHaveBeenCalledTimes(1);
      expect(c.hint).toContain("Top10");
    }
  });
});
