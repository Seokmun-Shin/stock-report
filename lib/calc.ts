import type {
  AppData,
  BuyTimingSignal,
  InitialCapitalSummary,
  PortfolioSummary,
  SellTimingSignal,
  StockSummary,
  TimingSignal,
  Trade,
} from "./types";
import { sellTaxTotal } from "./tradeFees";
import { resolveReportSettings, timingLineFromAvg, timingLineFromSell } from "./reportSettings";

export function tradeAmount(t: Trade): number {
  return t.quantity * t.price;
}

export function tradeCost(t: Trade): number {
  return t.fee + (t.type === "sell" ? sellTaxTotal(t) : 0);
}

interface Lot {
  qty: number;
  price: number;
  fee: number;
}

function fifoStockMetrics(trades: Trade[]) {
  const sorted = [...trades].sort(compareTradesByDateAsc);
  const lots: Lot[] = [];

  let buyAmountTotal = 0;
  let sellAmountTotal = 0;
  let buyCostTotal = 0;
  let sellCostTotal = 0;
  let matchedBuyAmount = 0;

  for (const t of sorted) {
    if (t.type === "buy") {
      buyAmountTotal += tradeAmount(t);
      buyCostTotal += t.fee;
      lots.push({ qty: t.quantity, price: t.price, fee: t.fee });
    } else {
      sellAmountTotal += tradeAmount(t);
      sellCostTotal += t.fee + sellTaxTotal(t);
      let remaining = t.quantity;
      while (remaining > 0 && lots.length > 0) {
        const lot = lots[0];
        const take = Math.min(remaining, lot.qty);
        const feeShare = lot.qty > 0 ? (lot.fee * take) / lot.qty : 0;
        matchedBuyAmount += take * lot.price;
        lot.fee -= feeShare;
        lot.qty -= take;
        remaining -= take;
        if (lot.qty <= 0) lots.shift();
      }
    }
  }

  let holdingQty = 0;
  let holdingCost = 0;
  let holdingCostBasis = 0;
  for (const lot of lots) {
    holdingQty += lot.qty;
    holdingCost += lot.qty * lot.price;
    holdingCostBasis += lot.qty * lot.price + lot.fee;
  }

  const tradeCost = buyCostTotal + sellCostTotal;
  const tradeProfit = sellAmountTotal - matchedBuyAmount;
  const netProfit = tradeProfit - tradeCost;
  const returnRate =
    matchedBuyAmount + tradeCost > 0 ? (netProfit / (matchedBuyAmount + tradeCost)) * 100 : 0;

  const holdingAvgPrice = holdingQty > 0 ? holdingCost / holdingQty : 0;
  const holdingAvgPriceWithCost = holdingQty > 0 ? holdingCostBasis / holdingQty : 0;

  return {
    buyAmountTotal,
    sellAmountTotal,
    tradeCost,
    tradeProfit,
    netProfit,
    returnRate,
    holdingQty,
    holdingAvgPrice,
    holdingAvgPriceWithCost,
    holdingCostBasis,
  };
}

export function summarizeStock(
  stockId: string,
  stockName: string,
  trades: Trade[],
  currentPrice: number,
  settingsInput?: Partial<import("./reportSettings").ReportSettings>
): StockSummary {
  const settings = resolveReportSettings(settingsInput);
  const rows = trades.filter((t) => t.stockId === stockId);
  const m = fifoStockMetrics(rows);

  const unrealizedPnl =
    m.holdingQty > 0 ? (currentPrice - m.holdingAvgPrice) * m.holdingQty : 0;
  const unrealizedPnlWithCost =
    m.holdingQty > 0 ? currentPrice * m.holdingQty - m.holdingCostBasis : 0;
  const unrealizedPnlPct =
    m.holdingCostBasis > 0 ? (unrealizedPnlWithCost / m.holdingCostBasis) * 100 : 0;

  const sells = rows.filter((t) => t.type === "sell");
  const lastSell = [...sells].sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastSellPrice = lastSell?.price ?? null;
  const timing10 = lastSellPrice ? timingLineFromSell(lastSellPrice, settings.buyTimingPct1) : null;
  const timing20 = lastSellPrice ? timingLineFromSell(lastSellPrice, settings.buyTimingPct2) : null;
  const sellTiming10 =
    m.holdingQty > 0 && m.holdingAvgPrice > 0
      ? timingLineFromAvg(m.holdingAvgPrice, settings.sellTimingPct1)
      : null;
  const sellTiming20 =
    m.holdingQty > 0 && m.holdingAvgPrice > 0
      ? timingLineFromAvg(m.holdingAvgPrice, settings.sellTimingPct2)
      : null;

  return {
    stockId,
    stockName,
    buyAmount: m.buyAmountTotal,
    sellAmount: m.sellAmountTotal,
    tradeCost: m.tradeCost,
    tradeProfit: m.tradeProfit,
    netProfit: m.netProfit,
    returnRate: m.returnRate,
    lastSellPrice,
    timing10,
    timing20,
    sellTiming10,
    sellTiming20,
    holdingQty: m.holdingQty,
    holdingAvgPrice: m.holdingAvgPrice,
    holdingAvgPriceWithCost: m.holdingAvgPriceWithCost,
    unrealizedPnl,
    unrealizedPnlWithCost,
    unrealizedPnlPct,
    currentPrice,
  };
}

export function summarizePortfolio(data: AppData): PortfolioSummary {
  let buyAmount = 0;
  let sellAmount = 0;
  let tradeCost = 0;
  let netProfitRealized = 0;
  let unrealizedPnl = 0;
  let matchedBuyAmount = 0;

  for (const stock of data.stocks) {
    const rows = data.trades.filter((t) => t.stockId === stock.id);
    const m = fifoStockMetrics(rows);
    buyAmount += m.buyAmountTotal;
    sellAmount += m.sellAmountTotal;
    tradeCost += m.tradeCost;
    netProfitRealized += m.netProfit;

    const sorted = [...rows].sort(compareTradesByDateAsc);
    const lots: Lot[] = [];
    for (const t of sorted) {
      if (t.type === "buy") {
        lots.push({ qty: t.quantity, price: t.price, fee: t.fee });
      } else {
        let rem = t.quantity;
        while (rem > 0 && lots.length) {
          const lot = lots[0];
          const take = Math.min(rem, lot.qty);
          matchedBuyAmount += take * lot.price;
          lot.qty -= take;
          rem -= take;
          if (lot.qty <= 0) lots.shift();
        }
      }
    }

    unrealizedPnl += summarizeStock(
      stock.id,
      stock.name,
      data.trades,
      data.currentPrices[stock.id] ?? 0,
      data.reportSettings
    ).unrealizedPnl;
  }

  const returnRateRealized =
    matchedBuyAmount + tradeCost > 0 ? (netProfitRealized / (matchedBuyAmount + tradeCost)) * 100 : 0;

  const totalPnl = netProfitRealized + unrealizedPnl;
  const totalReturnRate = buyAmount + tradeCost > 0 ? (totalPnl / (buyAmount + tradeCost)) * 100 : 0;

  return {
    buyAmount,
    sellAmount,
    tradeCost,
    netProfitRealized,
    returnRateRealized,
    unrealizedPnl,
    totalPnl,
    totalReturnRate,
  };
}

export function getBuyTimingSignal(
  summary: StockSummary,
  settingsInput?: Partial<import("./reportSettings").ReportSettings>
): BuyTimingSignal {
  const settings = resolveReportSettings(settingsInput);
  const { currentPrice, timing10, timing20, lastSellPrice } = summary;
  const p1 = settings.buyTimingPct1;
  const p2 = settings.buyTimingPct2;
  if (!lastSellPrice || !timing10 || !timing20) {
    return { status: "watch", label: "기준 없음", hint: "매도 기록이 있으면 매수 타이밍선이 표시됩니다." };
  }
  if (currentPrice <= timing20) {
    return {
      status: "zone20",
      label: "2차 분할 구간",
      hint: `최근 매도가(${fmt(lastSellPrice)}) 대비 -${p2}% 이하. 적극 분할 매수 검토.`,
    };
  }
  if (currentPrice <= timing10) {
    return {
      status: "zone10",
      label: "1차 분할 구간",
      hint: `최근 매도가 대비 -${p1}% 이하. 1차 분할 매수 검토.`,
    };
  }
  return {
    status: "above",
    label: "관망",
    hint: `현재가가 1차 매수선(${fmt(timing10)}) 위. 급하게 매수하지 않아도 됩니다.`,
  };
}

/** @deprecated getBuyTimingSignal 사용 */
export function getTimingSignal(summary: StockSummary): TimingSignal {
  return getBuyTimingSignal(summary);
}

export function getSellTimingSignal(
  summary: StockSummary,
  settingsInput?: Partial<import("./reportSettings").ReportSettings>
): SellTimingSignal {
  const settings = resolveReportSettings(settingsInput);
  const { currentPrice, sellTiming10, sellTiming20, holdingAvgPrice, holdingQty } = summary;
  const p1 = settings.sellTimingPct1;
  const p2 = settings.sellTimingPct2;
  if (holdingQty <= 0 || !holdingAvgPrice || !sellTiming10 || !sellTiming20) {
    return {
      status: "watch",
      label: "기준 없음",
      hint: "보유 중일 때 평단 기준 매도 타이밍선이 표시됩니다.",
    };
  }
  if (currentPrice >= sellTiming20) {
    return {
      status: "zone20",
      label: "2차 익절 구간",
      hint: `평단(${fmt(holdingAvgPrice)}) 대비 +${p2}% 이상. 분할 매도·익절 검토.`,
    };
  }
  if (currentPrice >= sellTiming10) {
    return {
      status: "zone10",
      label: "1차 익절 구간",
      hint: `평단 대비 +${p1}% 이상. 1차 분할 매도 검토.`,
    };
  }
  return {
    status: "below",
    label: "보유 유지",
    hint: `1차 매도선(${fmt(sellTiming10)})까지 추가 상승을 기다립니다.`,
  };
}

/** FIFO 기준 매도 건별 실현손익 (매수 수수료·매도 비용 반영) */
export function computeRealizedPnlByTrade(trades: Trade[]): Record<string, number> {
  const sorted = [...trades].sort(compareTradesByDateAsc);
  const lots: Lot[] = [];
  const result: Record<string, number> = {};

  for (const t of sorted) {
    if (t.type === "buy") {
      lots.push({ qty: t.quantity, price: t.price, fee: t.fee });
      continue;
    }

    const sellFeeTotal = t.fee + sellTaxTotal(t);
    let remaining = t.quantity;
    let matchedCost = 0;

    while (remaining > 0 && lots.length > 0) {
      const lot = lots[0];
      const take = Math.min(remaining, lot.qty);
      const buyFeeShare = lot.qty > 0 ? (lot.fee * take) / lot.qty : 0;
      matchedCost += take * lot.price + buyFeeShare;
      lot.fee -= buyFeeShare;
      lot.qty -= take;
      remaining -= take;
      if (lot.qty <= 0) lots.shift();
    }

    const sellFeeShare = t.quantity > 0 ? (sellFeeTotal * t.quantity) / t.quantity : sellFeeTotal;
    const proceeds = tradeAmount(t) - sellFeeShare;
    result[t.id] = proceeds - matchedCost;
  }

  return result;
}

export function formatTradeDateTime(t: Trade): string {
  if (t.executedTime) return `${t.date} ${t.executedTime}`;
  return t.date;
}

export function fmt(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(n));
}

export function fmtQty(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n);
}

export function fmtSigned(n: number): string {
  if (n > 0) return `+${fmt(n)}`;
  return fmt(n);
}

export function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** trade id 또는 createdAt에서 입력 시각 추출 */
export function tradeSortKey(t: Trade): number {
  if (t.createdAt) return new Date(t.createdAt).getTime();
  const ms = parseInt(t.id.split("-")[0], 10);
  if (!isNaN(ms) && ms > 1e12) return ms;
  return new Date(`${t.date}T12:00:00`).getTime();
}

/** 화면: 최신순 (같은 날짜면 체결시각/입력 역순) */
export function compareTradesByDateDesc(a: Trade, b: Trade): number {
  const byDate = b.date.localeCompare(a.date);
  if (byDate !== 0) return byDate;
  const ta = tradeExecutedMinutes(a);
  const tb = tradeExecutedMinutes(b);
  if (ta !== tb) return tb - ta;
  return tradeSortKey(b) - tradeSortKey(a);
}

/** FIFO·회계: 과거순 (같은 날짜면 체결시각 → createdAt) */
export function compareTradesByDateAsc(a: Trade, b: Trade): number {
  const byDate = a.date.localeCompare(b.date);
  if (byDate !== 0) return byDate;
  const ta = tradeExecutedMinutes(a);
  const tb = tradeExecutedMinutes(b);
  if (ta !== tb) return ta - tb;
  return tradeSortKey(a) - tradeSortKey(b);
}

function tradeExecutedMinutes(t: Trade): number {
  if (t.executedTime) {
    const [h, m] = t.executedTime.split(":").map((x) => parseInt(x, 10));
    if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
  }
  const d = new Date(t.createdAt);
  if (!isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
  return 12 * 60;
}

function inferCreatedAt(t: Trade, index: number): string {
  const ms = parseInt(t.id.split("-")[0], 10);
  if (!isNaN(ms) && ms > 1e12) return new Date(ms).toISOString();
  const sec = String(Math.min(index, 59)).padStart(2, "0");
  return new Date(`${t.date}T12:00:${sec}`).toISOString();
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface CapitalLot {
  qty: number;
  price: number;
  fee: number;
  isInitial: boolean;
}

/** 선택한 매수 내역 기준 — FIFO로 실현/미실현/회수금 계산 */
export function summarizeInitialCapital(data: AppData): InitialCapitalSummary {
  const capitalIdList = data.initialCapitalTradeIds ?? [];
  const initialIds = new Set(capitalIdList);
  const selectedCount = initialIds.size;

  let initialCapital = 0;
  for (const id of capitalIdList) {
    const t = data.trades.find((x) => x.id === id);
    if (t && t.type === "buy") initialCapital += tradeAmount(t) + t.fee;
  }

  if (selectedCount === 0 || initialCapital === 0) {
    return {
      initialCapital: 0,
      realizedPnl: 0,
      unrealizedPnl: 0,
      totalPnl: 0,
      recoveredCash: 0,
      stillInvested: 0,
      holdingMarketValue: 0,
      currentValue: 0,
      returnRate: 0,
      selectedCount: 0,
    };
  }

  let realizedPnl = 0;
  let recoveredCash = 0;
  let stillInvested = 0;
  let holdingMarketValue = 0;
  let unrealizedPnl = 0;

  for (const stock of data.stocks) {
    const rows = [...data.trades.filter((t) => t.stockId === stock.id)].sort(compareTradesByDateAsc);
    const lots: CapitalLot[] = [];
    const currentPrice = data.currentPrices[stock.id] ?? 0;

    for (const t of rows) {
      if (t.type === "buy") {
        lots.push({
          qty: t.quantity,
          price: t.price,
          fee: t.fee,
          isInitial: initialIds.has(t.id),
        });
      } else {
        let remaining = t.quantity;
          const sellFeeTotal = t.fee + sellTaxTotal(t);

        while (remaining > 0 && lots.length > 0) {
          const lot = lots[0];
          const take = Math.min(remaining, lot.qty);
          const buyFeeShare = lot.qty > 0 ? (lot.fee * take) / lot.qty : 0;
          const sellFeeShare = t.quantity > 0 ? (sellFeeTotal * take) / t.quantity : 0;
          const proceeds = take * t.price - sellFeeShare;
          const cost = take * lot.price + buyFeeShare;

          if (lot.isInitial) {
            realizedPnl += proceeds - cost;
            recoveredCash += proceeds;
          }

          lot.fee -= buyFeeShare;
          lot.qty -= take;
          remaining -= take;
          if (lot.qty <= 0) lots.shift();
        }
      }
    }

    for (const lot of lots) {
      if (!lot.isInitial || lot.qty <= 0) continue;
      const cost = lot.qty * lot.price + lot.fee;
      stillInvested += cost;
      holdingMarketValue += lot.qty * currentPrice;
      unrealizedPnl += lot.qty * currentPrice - cost;
    }
  }

  const totalPnl = realizedPnl + unrealizedPnl;

  return {
    initialCapital,
    realizedPnl,
    unrealizedPnl,
    totalPnl,
    recoveredCash,
    stillInvested,
    holdingMarketValue,
    currentValue: recoveredCash + holdingMarketValue,
    returnRate: initialCapital > 0 ? (totalPnl / initialCapital) * 100 : 0,
    selectedCount,
  };
}

type TradeDraft = Omit<Trade, "createdAt"> & { createdAt?: string };

const LEGACY_STOCK_CODES: Record<string, string> = {
  sk: "000660",
  ss: "005930",
};

export function migrateAppData(
  raw: Partial<Omit<AppData, "trades">> & { trades?: TradeDraft[] }
): AppData {
  const trades = (raw.trades ?? []).map((t, i) => {
    const tax = t.tax ?? 0;
    const transactionTax = t.transactionTax;
    const ruralTax = t.ruralTax;
    return {
      ...t,
      tax:
        t.type === "sell" && transactionTax != null && ruralTax != null
          ? transactionTax + ruralTax
          : tax,
      createdAt: t.createdAt ?? inferCreatedAt(t as Trade, i),
    };
  });
  const stocks = (raw.stocks ?? []).map((s) => ({
    ...s,
    code: s.code?.trim() || LEGACY_STOCK_CODES[s.id],
  }));
  return {
    stocks,
    trades,
    currentPrices: raw.currentPrices ?? {},
    initialCapitalTradeIds: raw.initialCapitalTradeIds ?? [],
    reportSettings: resolveReportSettings(raw.reportSettings),
    dailySnapshots: raw.dailySnapshots ?? [],
    peakPrices: raw.peakPrices ?? {},
    stockQuotes: raw.stockQuotes ?? {},
    kospiBenchmark: raw.kospiBenchmark,
    stockEvents: raw.stockEvents ?? [],
  };
}
