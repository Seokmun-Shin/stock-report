import type { AppData } from "./types";
import { migrateAppData, uid } from "./calc";

const RAW_SEED = {
  stocks: [
    { id: "sk", name: "SK하이닉스" },
    { id: "ss", name: "삼성전자" },
  ],
  trades: [
    { id: uid(), stockId: "sk", type: "buy" as const, date: "2026-05-29", quantity: 4, price: 2300500, fee: 1753, tax: 0 },
    { id: uid(), stockId: "sk", type: "buy" as const, date: "2026-06-01", quantity: 6, price: 2301000, fee: 1168, tax: 0 },
    { id: uid(), stockId: "sk", type: "sell" as const, date: "2026-06-25", quantity: 10, price: 2925000, fee: 3715, tax: 58494 },
    { id: uid(), stockId: "sk", type: "buy" as const, date: "2026-06-26", quantity: 19, price: 2651000, fee: 0, tax: 0 },
    { id: uid(), stockId: "ss", type: "buy" as const, date: "2026-06-01", quantity: 100, price: 318500, fee: 4046, tax: 0 },
    { id: uid(), stockId: "ss", type: "buy" as const, date: "2026-06-02", quantity: 29, price: 350000, fee: 1289, tax: 0 },
    { id: uid(), stockId: "ss", type: "sell" as const, date: "2026-06-25", quantity: 129, price: 359500, fee: 6113, tax: 92750 },
    { id: uid(), stockId: "ss", type: "buy" as const, date: "2026-06-26", quantity: 70, price: 332000, fee: 0, tax: 0 },
  ],
  currentPrices: { sk: 2630000, ss: 325000 },
  initialCapitalTradeIds: [] as string[],
};

export const SEED: AppData = migrateAppData(RAW_SEED);

export const STORAGE_KEY = "stock-report-v2";
