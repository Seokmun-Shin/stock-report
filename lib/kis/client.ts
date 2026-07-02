/** 한국투자증권 Open API — 서버 전용 (Route Handler에서만 import) */

import { fetchKisSnapshots, fetchKisStockSnapshot } from "./snapshot";
import { fetchDomesticIndicesWithFallback, fetchKospiBenchmarkWithFallback, fetchSectorIndexPrice } from "./kospiBenchmark";
import { normalizeStockCode, isKisConfigured } from "./clientCore";

export { isKisConfigured, normalizeStockCode, fetchKisStockSnapshot, fetchKospiBenchmarkWithFallback, fetchDomesticIndicesWithFallback, fetchSectorIndexPrice };

/** @deprecated fetchKospiBenchmarkWithFallback 사용 */
export async function fetchKospiBenchmark() {
  const { kospi } = await fetchKospiBenchmarkWithFallback();
  if (!kospi) throw new Error("KOSPI 조회 실패");
  return kospi;
}

/** @deprecated fetchKisStockSnapshot 사용 */
export async function fetchKisQuote(rawCode: string) {
  return fetchKisStockSnapshot(rawCode);
}

export async function fetchKisQuotes(codes: string[]) {
  return fetchKisSnapshots(codes);
}

/** @deprecated fetchKisQuotes 사용 */
export async function fetchKisPrices(codes: string[]) {
  const { quotes, prices, errors } = await fetchKisSnapshots(codes);
  return { prices, errors };
}
