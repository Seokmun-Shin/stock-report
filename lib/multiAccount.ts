import type { AccountPortfolio, AppData } from "./types";

export const DEFAULT_ACCOUNT_ID = "default";

type AccountSlice = Omit<AccountPortfolio, "id" | "name">;

function accountSlice(data: AppData): AccountSlice {
  return {
    stocks: data.stocks,
    trades: data.trades,
    currentPrices: data.currentPrices,
    initialCapitalTradeIds: data.initialCapitalTradeIds,
    stockEvents: data.stockEvents ?? [],
    peakPrices: data.peakPrices ?? {},
    dailySnapshots: data.dailySnapshots ?? [],
  };
}

function applySlice(data: AppData, slice: AccountSlice): AppData {
  return {
    ...data,
    stocks: slice.stocks,
    trades: slice.trades,
    currentPrices: slice.currentPrices,
    initialCapitalTradeIds: slice.initialCapitalTradeIds,
    stockEvents: slice.stockEvents,
    peakPrices: slice.peakPrices,
    dailySnapshots: slice.dailySnapshots,
  };
}

export function hasMultipleAccounts(data: AppData): boolean {
  return (data.accounts?.length ?? 0) > 1;
}

export function listAccounts(data: AppData): Pick<AccountPortfolio, "id" | "name">[] {
  if (data.accounts?.length) {
    return data.accounts.map(({ id, name }) => ({ id, name }));
  }
  return [{ id: DEFAULT_ACCOUNT_ID, name: "기본" }];
}

/** 저장용 — 활성 계좌 slice를 accounts 배열에 반영 */
export function packActiveAccount(data: AppData): AppData {
  if (!data.accounts?.length) return data;
  const activeId = data.activeAccountId ?? data.accounts[0].id;
  const slice = accountSlice(data);
  return {
    ...data,
    activeAccountId: activeId,
    accounts: data.accounts.map((a) => (a.id === activeId ? { ...a, ...slice } : a)),
  };
}

/** 불러오기용 — legacy 단일 포트폴리오를 기본 계좌로 래핑 (선택) */
export function enableMultiAccount(data: AppData): AppData {
  if (data.accounts?.length) return packActiveAccount(data);
  return {
    ...data,
    accounts: [{ id: DEFAULT_ACCOUNT_ID, name: "기본", ...accountSlice(data) }],
    activeAccountId: DEFAULT_ACCOUNT_ID,
  };
}

export function switchAccount(data: AppData, accountId: string): AppData {
  const packed = packActiveAccount(data);
  const target = packed.accounts?.find((a) => a.id === accountId);
  if (!target) return data;
  return applySlice({ ...packed, activeAccountId: accountId }, target);
}

export function addAccount(data: AppData, name: string): AppData {
  const packed = packActiveAccount(enableMultiAccount(data));
  const id = `acc_${Date.now().toString(36)}`;
  const empty: AccountPortfolio = {
    id,
    name: name.trim() || "새 계좌",
    stocks: [],
    trades: [],
    currentPrices: {},
    initialCapitalTradeIds: [],
    stockEvents: [],
    peakPrices: {},
    dailySnapshots: [],
  };
  return applySlice(
    { ...packed, accounts: [...(packed.accounts ?? []), empty], activeAccountId: id },
    empty
  );
}

export function renameAccount(data: AppData, accountId: string, name: string): AppData {
  if (!data.accounts?.length) return data;
  const trimmed = name.trim();
  if (!trimmed) return data;
  return {
    ...data,
    accounts: data.accounts.map((a) => (a.id === accountId ? { ...a, name: trimmed } : a)),
  };
}

/** migrateAppData — accounts가 있으면 활성 계좌 필드를 top-level에 펼침 */
export function resolveAccountSlice(
  raw: Partial<AppData> & { accounts?: AccountPortfolio[] }
): Partial<AppData> {
  if (!raw.accounts?.length) return raw;
  const activeId = raw.activeAccountId ?? raw.accounts[0].id;
  const acc = raw.accounts.find((a) => a.id === activeId) ?? raw.accounts[0];
  return {
    ...raw,
    activeAccountId: activeId,
    stocks: acc.stocks,
    trades: acc.trades,
    currentPrices: acc.currentPrices,
    initialCapitalTradeIds: acc.initialCapitalTradeIds,
    stockEvents: acc.stockEvents,
    peakPrices: acc.peakPrices,
    dailySnapshots: acc.dailySnapshots,
  };
}

/** migrateAppData 마지막 — 활성 slice를 accounts에 동기화 */
export function syncAccountsFromFlat(
  migrated: AppData,
  raw: Partial<AppData> & { accounts?: AccountPortfolio[] }
): AppData {
  if (!raw.accounts?.length) return migrated;
  const activeId = migrated.activeAccountId ?? raw.activeAccountId ?? raw.accounts[0].id;
  const slice = accountSlice(migrated);
  return {
    ...migrated,
    activeAccountId: activeId,
    accounts: raw.accounts.map((a) => (a.id === activeId ? { ...a, ...slice } : a)),
  };
}
