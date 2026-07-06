import { describe, expect, it } from "vitest";
import { dedupeTradeRows, tradeRowFingerprint } from "./tradeDedup";
import type { ParsedTradeRow } from "./tradeCsv";

describe("tradeDedup", () => {
  const row: ParsedTradeRow = {
    date: "2026-06-01",
    stockName: "삼성전자",
    type: "buy",
    quantity: 10,
    price: 70000,
    fee: 100,
    tax: 0,
  };

  it("builds stable fingerprint", () => {
    expect(tradeRowFingerprint(row)).toBe("2026-06-01|삼성전자|buy|10|70000");
  });

  it("skips duplicates against existing set", () => {
    const existing = new Set([tradeRowFingerprint(row)]);
    const { unique, skipped } = dedupeTradeRows([row, row], existing);
    expect(unique).toHaveLength(0);
    expect(skipped).toBe(2);
  });
});
