import { describe, expect, it } from "vitest";
import { formatCountdownMs, nextPeriodicDelay } from "./periodicRefresh";

describe("nextPeriodicDelay", () => {
  const interval = 5 * 60_000;

  it("returns 0 when never refreshed", () => {
    expect(nextPeriodicDelay(undefined, interval, 100_000)).toBe(0);
  });

  it("returns 0 when interval elapsed", () => {
    expect(nextPeriodicDelay(0, interval, interval)).toBe(0);
  });

  it("returns remaining time when interval not elapsed", () => {
    const last = 100_000;
    expect(nextPeriodicDelay(last, interval, last + 2 * 60_000)).toBe(3 * 60_000);
  });

  it("returns 0 immediately after interval shortened", () => {
    const last = 0;
    const now = 10 * 60_000;
    expect(nextPeriodicDelay(last, 5 * 60_000, now)).toBe(0);
  });

  it("formats countdown as M:SS", () => {
    expect(formatCountdownMs(125_000)).toBe("2:05");
    expect(formatCountdownMs(0)).toBe("0:00");
  });
});
