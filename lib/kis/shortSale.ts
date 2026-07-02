/** KIS 공매도 — 일별 추이(종목) · 상위 순위(시장) */

import type { KisShortSaleRow } from "./types";
import { kisGetJson, normalizeStockCode, parseOptionalNum, sleep } from "./clientCore";

function kstYmd(d = new Date()): string {
  const kst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${kst.getFullYear()}${String(kst.getMonth() + 1).padStart(2, "0")}${String(kst.getDate()).padStart(2, "0")}`;
}

function daysAgoYmd(n: number): string {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  kst.setDate(kst.getDate() - n);
  return kstYmd(kst);
}

function extractShortSaleRows(data: {
  output?: Record<string, unknown>[] | Record<string, unknown>;
  output2?: Record<string, unknown>[] | Record<string, unknown>;
}): Record<string, unknown>[] {
  const o2 = data.output2;
  if (Array.isArray(o2) && o2.length > 0) return o2;
  if (o2 && typeof o2 === "object") return [o2];

  const o = data.output;
  if (Array.isArray(o) && o.length > 0) return o;
  if (o && typeof o === "object") return [o];

  return [];
}

function parseShortRow(r: Record<string, unknown>): KisShortSaleRow {
  return {
    date: String(r.stck_bsop_date ?? r.bsop_date ?? ""),
    shortQty: parseOptionalNum(r.ssts_cntg_qty ?? r.shtn_qty ?? r.whol_ssts_qty),
    shortAmount: parseOptionalNum(r.ssts_tr_pbmn ?? r.ssts_cntg_tr_pbmn ?? r.shtn_tr_pbmn),
    shortBalanceQty: parseOptionalNum(r.ssts_qty ?? r.ovrl_ssts_vol ?? r.ssts_bal_qty),
    shortBalanceRate: parseOptionalNum(
      r.ssts_vol_rlim ?? r.acml_ssts_cntg_qty_rlim ?? r.ssts_rlim ?? r.ssts_ehrt
    ),
  };
}

export async function fetchStockShortSaleDaily(code: string, days = 10): Promise<KisShortSaleRow[]> {
  const normalized = normalizeStockCode(code);
  const end = kstYmd();
  const start = daysAgoYmd(days + 5);

  const data = await kisGetJson<{
    output?: Record<string, unknown>[] | Record<string, unknown>;
    output2?: Record<string, unknown>[] | Record<string, unknown>;
  }>("/uapi/domestic-stock/v1/quotations/daily-short-sale", "FHPST04830000", {
    FID_COND_MRKT_DIV_CODE: "J",
    FID_INPUT_ISCD: normalized,
    FID_INPUT_DATE_1: start,
    FID_INPUT_DATE_2: end,
  });

  return extractShortSaleRows(data)
    .map(parseShortRow)
    .filter((r) => r.date && (r.shortQty != null || r.shortBalanceQty != null))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);
}

export interface KospiShortSaleRankRow extends KisShortSaleRow {
  stockCode?: string;
  stockName?: string;
}

/** 코스피 공매도 상위 — KIS ranking/short-sale (시장 지수 공매도 API는 미제공) */
export async function fetchKospiShortSaleRanking(limit = 10): Promise<KospiShortSaleRankRow[]> {
  const data = await kisGetJson<{ output?: Record<string, unknown>[] | Record<string, unknown> }>(
    "/uapi/domestic-stock/v1/ranking/short-sale",
    "FHPST04820000",
    {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_COND_SCR_DIV_CODE: "20482",
      FID_INPUT_ISCD: "0001",
      FID_PERIOD_DIV_CODE: "D",
      FID_INPUT_CNT_1: "0",
      FID_TRGT_CLS_CODE: "0",
      FID_TRGT_EXLS_CLS_CODE: "0",
      FID_APLY_RANG_VOL: "0",
      FID_APLY_RANG_PRC_1: "0",
      FID_APLY_RANG_PRC_2: "0",
    }
  );

  const raw = data.output;
  const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];

  return rows
    .slice(0, limit)
    .map((r) => ({
      ...parseShortRow(r),
      date: String(r.stck_bsop_date ?? r.bsop_date ?? kstYmd()),
      stockCode: String(r.mksc_shrn_iscd ?? r.iscd ?? "").padStart(6, "0"),
      stockName: String(r.hts_kor_isnm ?? r.kor_isnm ?? r.prdt_name ?? "").trim() || undefined,
      shortQty: parseOptionalNum(r.ssts_cntg_qty ?? r.shtn_qty ?? r.ssts_cntg_vol),
      shortBalanceRate: parseOptionalNum(r.ssts_vol_rlim ?? r.ssts_ehrt ?? r.ssts_rlim),
    }))
    .filter((r) => r.stockCode && r.stockCode !== "000000");
}

/** @deprecated fetchKospiShortSaleRanking 사용 */
export async function fetchKospiMarketShortSale(): Promise<KisShortSaleRow[]> {
  try {
    return await fetchKospiShortSaleRanking(5);
  } catch {
    return [];
  }
}
