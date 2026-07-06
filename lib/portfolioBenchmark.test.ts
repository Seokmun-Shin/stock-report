import { describe, expect, it } from "vitest";
import { buildPortfolioBenchmarkSeries, snapshotsToPoints } from "./portfolioBenchmark";
import type { DailySnapshot } from "./types";

describe("portfolioBenchmark", () => {
  it("builds index points from snapshots", () => {
    const snaps: DailySnapshot[] = [
      { date: "2026-06-01", portfolioTotalPnl: 0, portfolioTotalReturnRate: 0, stockPrices: {}, stockUnrealizedPnl: {} },
      { date: "2026-06-02", portfolioTotalPnl: 100, portfolioTotalReturnRate: 2.5, stockPrices: {}, stockUnrealizedPnl: {} },
    ];
    expect(snapshotsToPoints(snaps)[1].close).toBe(102.5);
  });

  it("aligns kospi from snapshots when stored", () => {
    const snaps: DailySnapshot[] = [
      {
        date: "2026-06-01",
        portfolioTotalPnl: 0,
        portfolioTotalReturnRate: 0,
        stockPrices: {},
        stockUnrealizedPnl: {},
        kospiClose: 2500,
      },
      {
        date: "2026-06-02",
        portfolioTotalPnl: 100,
        portfolioTotalReturnRate: 1,
        stockPrices: {},
        stockUnrealizedPnl: {},
        kospiClose: 2525,
      },
    ];
    const result = buildPortfolioBenchmarkSeries(snaps, []);
    expect(result.kospiIndex).toHaveLength(2);
  });
});
