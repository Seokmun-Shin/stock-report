/** KIS 순위 API — 거래량·등락률·외국인 순매수 · 코스피/코스닥 */

import { kisGetJson, normalizeStockCode, parseNum, parseOptionalNum, sleep } from "./clientCore";

export type KisMarketBoard = "KSP" | "KSQ";

/** KIS 지수/시장 코드 — 0001=코스피, 1001=코스닥 */
const MARKET_ISCD: Record<KisMarketBoard, string> = {
  KSP: "0001",
  KSQ: "1001",
};

export interface KisRankingRow {
  rank: number;
  stockCode: string;
  stockName: string;
  price: number;
  changeRate: number;
  volume?: number;
  tradeAmount?: number;
  netBuyQty?: number;
}

function extractOutputRows(data: {
  output?: Record<string, unknown>[] | Record<string, unknown>;
  output2?: Record<string, unknown>[] | Record<string, unknown>;
}): Record<string, unknown>[] {
  for (const key of ["output", "output2"] as const) {
    const block = data[key];
    if (Array.isArray(block) && block.length > 0) return block;
    if (block && typeof block === "object" && !Array.isArray(block)) return [block];
  }
  return [];
}

function parseRankingRow(r: Record<string, unknown>, rankFallback: number): KisRankingRow | null {
  const code = String(r.mksc_shrn_iscd ?? r.stck_shrn_iscd ?? r.iscd ?? "")
    .replace(/\D/g, "")
    .padStart(6, "0");
  if (!code || code === "000000") return null;

  const name = String(r.hts_kor_isnm ?? r.kor_isnm ?? r.prdt_name ?? "").trim();
  if (!name) return null;

  const rank = parseOptionalNum(r.data_rank) ?? rankFallback;
  const price = parseNum(r.stck_prpr ?? r.stck_clpr ?? r.prpr);
  const changeRate = parseNum(r.prdy_ctrt ?? r.prdy_vrss_sign_rate ?? r.fltt_rt);

  return {
    rank,
    stockCode: code,
    stockName: name,
    price,
    changeRate,
    volume: parseOptionalNum(r.acml_vol ?? r.vol),
    tradeAmount: parseOptionalNum(r.acml_tr_pbmn ?? r.tr_pbmn),
    netBuyQty: parseOptionalNum(r.frgn_ntby_qty ?? r.ntby_qty ?? r.frgn_ntby_tr_pbmn),
  };
}

function parseRankingList(data: {
  output?: Record<string, unknown>[] | Record<string, unknown>;
  output2?: Record<string, unknown>[] | Record<string, unknown>;
}): KisRankingRow[] {
  return extractOutputRows(data)
    .map((r, i) => parseRankingRow(r, i + 1))
    .filter((r): r is KisRankingRow => r != null);
}

/** 거래량(거래대금) 순위 — 최대 30건 */
export async function fetchVolumeRank(market: KisMarketBoard, limit = 30): Promise<KisRankingRow[]> {
  const data = await kisGetJson<{
    output?: Record<string, unknown>[] | Record<string, unknown>;
  }>("/uapi/domestic-stock/v1/quotations/volume-rank", "FHPST01710000", {
    FID_COND_MRKT_DIV_CODE: "J",
    FID_COND_SCR_DIV_CODE: "20171",
    FID_INPUT_ISCD: MARKET_ISCD[market],
    FID_DIV_CLS_CODE: "0",
    FID_BLNG_CLS_CODE: "3",
    FID_TRGT_CLS_CODE: "0",
    FID_TRGT_EXLS_CLS_CODE: "0",
    FID_INPUT_PRICE_1: "0",
    FID_INPUT_PRICE_2: "0",
    FID_VOL_CNT: "0",
  });

  return parseRankingList(data).slice(0, limit);
}

/** 등락률 상승 순위 — 최대 30건 */
export async function fetchGainerRank(market: KisMarketBoard, limit = 30): Promise<KisRankingRow[]> {
  const data = await kisGetJson<{
    output?: Record<string, unknown>[] | Record<string, unknown>;
  }>("/uapi/domestic-stock/v1/ranking/fluctuation", "FHPST01700000", {
    FID_COND_MRKT_DIV_CODE: "J",
    FID_COND_SCR_DIV_CODE: "20170",
    FID_INPUT_ISCD: MARKET_ISCD[market],
    FID_DIV_CLS_CODE: "0",
    FID_RANK_SORT_CLS_CODE: "0",
    FID_INPUT_CNT_1: "0",
    FID_INPUT_PRICE_1: "0",
    FID_INPUT_PRICE_2: "0",
    FID_PRC_CLS_CODE: "0",
    FID_TRGT_CLS_CODE: "0",
    FID_TRGT_EXLS_CLS_CODE: "0",
    FID_VOL_CNT: "0",
    FID_RSFL_RATE1: "0",
    FID_RSFL_RATE2: "0",
  });

  return parseRankingList(data).slice(0, limit);
}

/** 외국인 순매수 상위 — 최대 30건 */
export async function fetchForeignNetBuyRank(market: KisMarketBoard, limit = 30): Promise<KisRankingRow[]> {
  const data = await kisGetJson<{
    output?: Record<string, unknown>[] | Record<string, unknown>;
  }>("/uapi/domestic-stock/v1/quotations/foreign-institution-total", "FHPTJ04400000", {
    FID_COND_MRKT_DIV_CODE: "J",
    FID_COND_SCR_DIV_CODE: "20440",
    FID_DIV_CLS_CODE: "0",
    FID_ETC_CLS_CODE: "0",
    FID_INPUT_ISCD: MARKET_ISCD[market],
    FID_RANK_SORT_CLS_CODE: "0",
  });

  return parseRankingList(data).slice(0, limit);
}

export interface MarketRankingsBundle {
  market: KisMarketBoard;
  volume: KisRankingRow[];
  gainers: KisRankingRow[];
  foreignBuy: KisRankingRow[];
  fetchedAt: string;
}

export async function fetchMarketRankings(market: KisMarketBoard): Promise<MarketRankingsBundle> {
  const volume = await fetchVolumeRank(market);
  await sleep(120);
  const gainers = await fetchGainerRank(market);
  await sleep(120);
  const foreignBuy = await fetchForeignNetBuyRank(market);

  return {
    market,
    volume,
    gainers,
    foreignBuy,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchAllMarketRankings(): Promise<{
  kospi: MarketRankingsBundle;
  kosdaq: MarketRankingsBundle;
}> {
  const kospi = await fetchMarketRankings("KSP");
  await sleep(200);
  const kosdaq = await fetchMarketRankings("KSQ");
  return { kospi, kosdaq };
}
