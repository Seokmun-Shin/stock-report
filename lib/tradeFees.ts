/** 국내 주식 매매 비용 추정 (참고용 — 증권사·종목별 상이) */

/** 온라인 위탁 수수료율 (0.015%) */
export const DEFAULT_COMMISSION_RATE = 0.00015;

/** 코스피 매도 거래세 (0.15%) */
export const KOSPI_TRANSACTION_TAX_RATE = 0.0015;

/** 코스피 매도 농특세 (0.15%) */
export const KOSPI_RURAL_TAX_RATE = 0.0015;

export function calcBuyCommission(amount: number, rate = DEFAULT_COMMISSION_RATE): number {
  return Math.round(amount * rate);
}

export function calcSellTaxes(
  sellAmount: number,
  options?: { transactionRate?: number; ruralRate?: number }
): { transactionTax: number; ruralTax: number; total: number } {
  const tr = options?.transactionRate ?? KOSPI_TRANSACTION_TAX_RATE;
  const rr = options?.ruralRate ?? KOSPI_RURAL_TAX_RATE;
  const transactionTax = Math.floor(sellAmount * tr);
  const ruralTax = Math.floor(sellAmount * rr);
  return { transactionTax, ruralTax, total: transactionTax + ruralTax };
}

export function sellTaxTotal(trade: { tax: number; transactionTax?: number; ruralTax?: number }): number {
  if (trade.transactionTax != null || trade.ruralTax != null) {
    return (trade.transactionTax ?? 0) + (trade.ruralTax ?? 0);
  }
  return trade.tax;
}
