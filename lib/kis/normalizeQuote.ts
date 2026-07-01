/** KIS 시세·지수 응답 정규화 (전일가·등락 불일치 보정) */

export interface RawMarketFields {
  price: number;
  prevClose: number;
  changeAmount: number;
  changeRate: number;
}

/** 전일가=현재가인데 등락률/등락액이 있는 경우 역산 보정 */
export function normalizeMarketChange(
  price: number,
  prevClose: number,
  changeAmount: number,
  changeRate: number,
  decimals = 0
): RawMarketFields {
  let prev = prevClose > 0 ? prevClose : price;
  let amt = changeAmount;
  let rate = changeRate;

  const round = (n: number) =>
    decimals > 0 ? Math.round(n * 10 ** decimals) / 10 ** decimals : Math.round(n);

  const inconsistent = Math.abs(price - prev) < (decimals > 0 ? 0.005 : 1);

  if (amt !== 0 && inconsistent) {
    prev = price - amt;
  }

  if (rate !== 0 && inconsistent) {
    prev = price / (1 + rate / 100);
    if (amt === 0) amt = price - prev;
  }

  if (rate === 0 && prev > 0 && Math.abs(price - prev) >= (decimals > 0 ? 0.005 : 1)) {
    rate = ((price - prev) / prev) * 100;
    if (amt === 0) amt = price - prev;
  }

  if (amt === 0 && prev > 0) {
    amt = price - prev;
  }

  if (rate === 0 && prev > 0 && amt !== 0) {
    rate = (amt / prev) * 100;
  }

  return {
    price: round(price),
    prevClose: round(prev),
    changeAmount: round(amt),
    changeRate: Math.round(rate * 100) / 100,
  };
}
