import { describe, expect, it } from "vitest";
import { buildBuyVerdictCopy, buildSellVerdictCopy } from "./verdictDisplay";
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
    lastSellPrice: 359_500,
    lastBuyPrice: 323_000,
    timing10: 292_500,
    timing20: 280_000,
    sellTiming10: 364_500,
    sellTiming20: 380_000,
    holdingQty: 19,
    holdingAvgPrice: 331_000,
    holdingAvgPriceWithCost: 331_500,
    unrealizedPnl: 0,
    unrealizedPnlWithCost: 0,
    unrealizedPnlPct: 0,
    currentPrice: 297_000,
    ...overrides,
  };
}

describe("buildBuyVerdictCopy", () => {
  it("sets advice tone and hero without extra suffix", () => {
    const copy = buildBuyVerdictCopy(baseSummary(), 297_000, {
      stance: "yes",
      headline: "ok",
      targetPrice: 292_500,
    });
    expect(copy.adviceTone).toBe("buy");
    expect(copy.status).toBe("추가 매수 OK");
    expect(copy.hero?.value).toBe("~292,500");
    expect(copy.facts).toHaveLength(2);
  });
});

describe("buildSellVerdictCopy", () => {
  it("hold advice and no 평단 대비 in hero", () => {
    const copy = buildSellVerdictCopy(baseSummary(), 297_000, {
      stance: "wait",
      headline: "hold",
      targetPrice: 364_500,
    });
    expect(copy.adviceTone).toBe("hold");
    expect(copy.status).toBe("보유 유지");
    expect(copy.hero?.value).toBe("~364,500");
    expect(copy.facts).toHaveLength(2);
  });
});
