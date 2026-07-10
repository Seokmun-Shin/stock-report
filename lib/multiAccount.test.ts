import { describe, expect, it } from "vitest";
import { migrateAppData } from "./calc";
import {
  addAccount,
  DEFAULT_ACCOUNT_ID,
  enableMultiAccount,
  packActiveAccount,
  switchAccount,
} from "./multiAccount";
import { EMPTY } from "./seed";

describe("multiAccount", () => {
  it("legacy data has no accounts array", () => {
    expect(EMPTY.accounts).toBeUndefined();
    expect(listAccountsSafe(EMPTY)).toEqual([{ id: DEFAULT_ACCOUNT_ID, name: "기본" }]);
  });

  it("enableMultiAccount wraps flat portfolio", () => {
    const multi = enableMultiAccount(EMPTY);
    expect(multi.accounts).toHaveLength(1);
    expect(multi.accounts![0].id).toBe(DEFAULT_ACCOUNT_ID);
    expect(multi.activeAccountId).toBe(DEFAULT_ACCOUNT_ID);
  });

  it("addAccount creates empty second account", () => {
    const withIsa = addAccount(EMPTY, "ISA");
    expect(withIsa.accounts).toHaveLength(2);
    expect(withIsa.activeAccountId).not.toBe(DEFAULT_ACCOUNT_ID);
    expect(withIsa.stocks).toHaveLength(0);
  });

  it("switchAccount preserves first account stocks", () => {
    const seeded = migrateAppData({
      stocks: [{ id: "a", name: "A", code: "005930" }],
      trades: [],
      currentPrices: {},
      initialCapitalTradeIds: [],
    });
    const multi = addAccount(seeded, "ISA");
    const isaId = multi.activeAccountId!;
    const back = switchAccount(multi, DEFAULT_ACCOUNT_ID);
    expect(back.stocks).toHaveLength(1);
    expect(back.stocks[0].name).toBe("A");
    const again = switchAccount(back, isaId);
    expect(again.stocks).toHaveLength(0);
  });

  it("packActiveAccount syncs trades into accounts", () => {
    let multi = enableMultiAccount(EMPTY);
    multi = {
      ...multi,
      stocks: [{ id: "x", name: "X", code: "000660" }],
      trades: [],
    };
    const packed = packActiveAccount(multi);
    expect(packed.accounts![0].stocks).toHaveLength(1);
  });
});

function listAccountsSafe(data: ReturnType<typeof migrateAppData>) {
  if (data.accounts?.length) {
    return data.accounts.map(({ id, name }) => ({ id, name }));
  }
  return [{ id: DEFAULT_ACCOUNT_ID, name: "기본" }];
}
