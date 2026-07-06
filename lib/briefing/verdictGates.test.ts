import { describe, expect, it } from "vitest";
import { applyBuyScoreGates, buildVerdictGateContext } from "./verdictGates";
import type { StockSummary } from "../types";

function baseSummary(overrides: Partial<StockSummary> = {}): StockSummary {
  return {
    stockId: "s1",
    stockName: "Test",
    buyAmount: 0,
    sellAmount: 0,
    tradeCost: 0,
    tradeProfit: 0,
    netProfit: 0,
    returnRate: 0,
    lastSellPrice: 10_000,
    lastBuyPrice: null,
    timing10: 9_000,
    timing20: 8_000,
    sellTiming10: 11_000,
    sellTiming20: 12_000,
    holdingQty: 10,
    holdingAvgPrice: 9_500,
    holdingAvgPriceWithCost: 9_600,
    unrealizedPnl: 0,
    unrealizedPnlWithCost: 0,
    unrealizedPnlPct: 0,
    currentPrice: 10_000,
    ...overrides,
  };
}

describe("buildVerdictGateContext", () => {
  it("detects buy zone", () => {
    const ctx = buildVerdictGateContext(
      baseSummary(),
      undefined,
      { status: "zone10", label: "1차", hint: "" },
      { status: "watch", label: "—", hint: "" },
      undefined,
      null
    );
    expect(ctx.inBuyZone).toBe(true);
    expect(ctx.inSellZone).toBe(false);
  });
});

describe("applyBuyScoreGates", () => {
  it("caps score when falling knife", () => {
    const ctx = buildVerdictGateContext(
      baseSummary({ currentPrice: 10_500 }),
      { price: 10_500, prevClose: 10_600, changeAmount: -100, changeRate: -2, high: 10_600, low: 10_400, updatedAt: "" },
      { status: "above", label: "대기", hint: "" },
      { status: "watch", label: "—", hint: "" },
      { price: 2500, prevClose: 2520, changeAmount: -20, changeRate: -1, updatedAt: "" },
      null
    );
    expect(ctx.fallingKnife).toBe(true);
    expect(applyBuyScoreGates(40, ctx, false)).toBeLessThanOrEqual(12);
  });
});
