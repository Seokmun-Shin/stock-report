import { describe, expect, it } from "vitest";
import { computeRealizedPnlByTrade, fmt, fmtPct, tradeAmount, tradeCost } from "./calc";
import type { Trade } from "./types";

function trade(partial: Partial<Trade> & Pick<Trade, "id" | "type" | "quantity" | "price">): Trade {
  return {
    stockId: "s1",
    date: "2026-01-10",
    fee: 100,
    tax: 0,
    createdAt: "2026-01-10T09:00:00.000Z",
    ...partial,
  };
}

describe("tradeAmount", () => {
  it("computes qty × price", () => {
    expect(tradeAmount(trade({ id: "1", type: "buy", quantity: 10, price: 50_000 }))).toBe(500_000);
  });
});

describe("tradeCost", () => {
  it("includes tax on sells", () => {
    const sell = trade({ id: "2", type: "sell", quantity: 1, price: 100, tax: 50 });
    expect(tradeCost(sell)).toBe(150);
  });
});

describe("computeRealizedPnlByTrade", () => {
  it("FIFO matches sell lots", () => {
    const trades: Trade[] = [
      trade({ id: "b1", type: "buy", quantity: 10, price: 100, fee: 0, date: "2026-01-01" }),
      trade({
        id: "s1",
        type: "sell",
        quantity: 4,
        price: 120,
        fee: 0,
        tax: 0,
        date: "2026-01-05",
      }),
    ];
    const pnl = computeRealizedPnlByTrade(trades);
    expect(pnl.s1).toBe(80);
  });
});

describe("formatting", () => {
  it("formats percent with sign", () => {
    expect(fmtPct(3.456)).toBe("+3.46%");
    expect(fmtPct(-1)).toBe("-1.00%");
  });

  it("formats integers with locale grouping", () => {
    expect(fmt(1234567)).toMatch(/1,234,567/);
  });
});
