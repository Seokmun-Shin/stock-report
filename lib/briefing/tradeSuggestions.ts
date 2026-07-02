import type { StockQuote, TradeType, BuyTimingSignal, SellTimingSignal } from "../types";
import type { StockSummary } from "../types";
import { today, fmt } from "../calc";
import { calcBuyFees, calcSellFees, calcSellTaxes } from "../tradeFees";
import type { ReportSettings } from "@/lib/reportSettings";
import { buyFeeRateFromSettings, resolveReportSettings, sellFeeRateFromSettings, sellTaxRateFromSettings } from "@/lib/reportSettings";
import type { TradeRecommendation } from "./types";
import type { StockTradingVerdict } from "./tradingVerdict";

export interface TradeSuggestion {
  type: TradeType;
  date: string;
  executedTime: string;
  quantity: number;
  price: number;
  fee: number;
  transactionTax: number;
  ruralTax: number;
  rationale: string[];
  /** 판단 탭과 동일 엔진 — 관망일 때 false */
  alignedWithVerdict: boolean;
  /** 참고 prefill용 (hold면 없음) */
  recommendedAction: "buy" | "sell" | "hold";
}

function nowTimeKst(): string {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${String(kst.getHours()).padStart(2, "0")}:${String(kst.getMinutes()).padStart(2, "0")}`;
}

/** 판단 참고 + (선택) prefill — 자동 적용하지 않음 */
export function buildTradeSuggestion(
  summary: StockSummary,
  quote: StockQuote | undefined,
  buySignal: BuyTimingSignal,
  sellSignal: SellTimingSignal,
  settings?: Partial<ReportSettings>,
  preferType?: TradeType,
  recommendation?: TradeRecommendation,
  verdict?: StockTradingVerdict
): TradeSuggestion {
  void buySignal;
  void sellSignal;
  resolveReportSettings(settings);

  const buyFeeRate = buyFeeRateFromSettings(settings);
  const sellFeeRate = sellFeeRateFromSettings(settings);
  const sellTaxRate = sellTaxRateFromSettings(settings);

  const price =
    recommendation?.suggestedPrice ??
    (recommendation?.action === "sell"
      ? verdict?.sell.targetPrice
      : recommendation?.action === "buy"
        ? verdict?.buy.targetPrice
        : undefined) ??
    quote?.price ??
    summary.currentPrice;

  const rationale: string[] = [];
  const action = recommendation?.action ?? "hold";

  let type: TradeType = preferType ?? "buy";
  if (!preferType) {
    if (action === "sell" && summary.holdingQty > 0) type = "sell";
    else if (action === "buy") type = "buy";
    else type = "buy";
  }

  const alignedWithVerdict = action !== "hold";

  if (recommendation) {
    rationale.push(recommendation.summary, recommendation.timingNote);
    if (verdict) {
      rationale.push(`매수: ${verdict.buy.headline}`, `매도: ${verdict.sell.headline}`);
    }
  } else if (verdict) {
    rationale.push(`매수: ${verdict.buy.headline}`, `매도: ${verdict.sell.headline}`);
    if (quote) rationale.push(`KIS 전일比 ${quote.changeRate.toFixed(2)}%`);
  } else if (type === "buy" && quote) {
    rationale.push(`KIS 전일比 ${quote.changeRate.toFixed(2)}%`);
  } else if (summary.holdingQty > 0) {
    rationale.push(`보유 ${summary.holdingQty}주 · 평단 ${fmt(summary.holdingAvgPriceWithCost)}`);
  }

  let quantity = 0;
  if (action === "buy" && type === "buy") {
    quantity = summary.holdingQty > 0 ? Math.max(1, Math.floor(summary.holdingQty / 3)) : 1;
  } else if (action === "sell" && type === "sell" && summary.holdingQty > 0) {
    quantity = Math.max(1, Math.floor(summary.holdingQty / 2));
  }

  const amount = quantity * price;
  const fee =
    amount > 0
      ? type === "buy"
        ? calcBuyFees(amount, buyFeeRate)
        : calcSellFees(amount, sellFeeRate)
      : 0;
  let transactionTax = 0;
  let ruralTax = 0;
  if (type === "sell" && amount > 0) {
    const taxes = calcSellTaxes(amount, { taxRate: sellTaxRate });
    transactionTax = taxes.transactionTax;
    ruralTax = taxes.ruralTax;
  }

  return {
    type,
    date: today(),
    executedTime: nowTimeKst(),
    quantity,
    price: Math.round(price),
    fee,
    transactionTax,
    ruralTax,
    rationale,
    alignedWithVerdict,
    recommendedAction: action,
  };
}
