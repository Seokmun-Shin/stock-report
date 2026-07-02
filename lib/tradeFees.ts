/** 국내 주식 매매 비용 추정 (미래에셋 최저 우대·코스피/코스닥 공통 세율 참고) */

/** 매수 총 비용 — 위탁수수료 + 유관기관 제비용 (0.01362%) */
export const DEFAULT_BUY_TOTAL_FEE_RATE = 0.01362 / 100;

/** 매도 수수료 — 위탁수수료 + 유관기관 제비용 (0.01264%) */
export const DEFAULT_SELL_TOTAL_FEE_RATE = 0.01264 / 100;

/** 매도 증권거래세 (0.20%, 코스피/코스닥 공통) */
export const DEFAULT_SELL_TRANSACTION_TAX_RATE = 0.002;

/** @deprecated buyTotalFeePct 설정 사용 */
export const DEFAULT_COMMISSION_RATE = DEFAULT_BUY_TOTAL_FEE_RATE;

/** @deprecated 0.20% 단일 세율로 대체 */
export const KOSPI_TRANSACTION_TAX_RATE = DEFAULT_SELL_TRANSACTION_TAX_RATE;

/** @deprecated 현행 0.20% 단일 증권거래세 — 농특세 별도 없음 */
export const KOSPI_RURAL_TAX_RATE = 0;

export function calcTradeFee(amount: number, rate: number): number {
  return Math.round(amount * rate);
}

export function calcBuyFees(amount: number, rate?: number): number {
  return calcTradeFee(amount, rate ?? DEFAULT_BUY_TOTAL_FEE_RATE);
}

export function calcSellFees(amount: number, rate?: number): number {
  return calcTradeFee(amount, rate ?? DEFAULT_SELL_TOTAL_FEE_RATE);
}

/** @deprecated calcBuyFees 사용 */
export function calcBuyCommission(amount: number, rate?: number): number {
  return calcBuyFees(amount, rate);
}

export function calcSellTaxes(
  sellAmount: number,
  options?: { taxRate?: number }
): { transactionTax: number; ruralTax: number; total: number } {
  const tr = options?.taxRate ?? DEFAULT_SELL_TRANSACTION_TAX_RATE;
  const transactionTax = Math.floor(sellAmount * tr);
  return { transactionTax, ruralTax: 0, total: transactionTax };
}

export function sellTaxTotal(trade: { tax: number; transactionTax?: number; ruralTax?: number }): number {
  if (trade.transactionTax != null || trade.ruralTax != null) {
    return (trade.transactionTax ?? 0) + (trade.ruralTax ?? 0);
  }
  return trade.tax;
}
