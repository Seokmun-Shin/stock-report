/** KIS 종목 스냅샷 — 시세·투자자·호가·프로그램매매 통합 */

import type { StockQuote } from "@/lib/types";
import { normalizeMarketChange } from "./normalizeQuote";
import type {
  KisInvestorDailyRow,
  KisInvestorGross,
  KisInvestorNet,
  KisOrderBook,
  KisProgramTrade,
  KisQuoteExtended,
  KisStockExtras,
} from "./types";
import {
  kisGetJson,
  normalizeStockCode,
  parseNum,
  parseOptionalNum,
  sleep,
} from "./clientCore";
import { fetchSectorIndexPrice } from "./kospiBenchmark";
import { fetchStockShortSaleDaily } from "./shortSale";

function kstYmd(d = new Date()): string {
  const kst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, "0");
  const day = String(kst.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** KST 기준 직전 영업일 (주말 제외) — FHPTJ04160001 조회용 */
function kstPrevBusinessYmd(d = new Date()): string {
  const kst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const cursor = new Date(kst);
  cursor.setDate(cursor.getDate() - 1);
  while (cursor.getDay() === 0 || cursor.getDay() === 6) {
    cursor.setDate(cursor.getDate() - 1);
  }
  return kstYmd(cursor);
}

function isKrxAfterDailySettlement(d = new Date()): boolean {
  const kst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const day = kst.getDay();
  if (day === 0 || day === 6) return true;
  const mins = kst.getHours() * 60 + kst.getMinutes();
  return mins >= 15 * 60 + 40;
}

function optNum(...vals: unknown[]): number | undefined {
  for (const v of vals) {
    const n = parseOptionalNum(v);
    if (n !== undefined) return n;
  }
  return undefined;
}

function hasInvestorQty(row: Record<string, unknown>): boolean {
  return ["prsn_ntby_qty", "frgn_ntby_qty", "orgn_ntby_qty", "prsn_ntby_tr_pbmn", "frgn_ntby_tr_pbmn", "orgn_ntby_tr_pbmn"].some(
    (k) => row[k] != null && row[k] !== ""
  );
}

function pickTodayInvestorRow(rows: Record<string, unknown>[], todayYmd: string): Record<string, unknown> | undefined {
  const todayRow = rows.find((r) => String(r.stck_bsop_date ?? r.bsop_date ?? "") === todayYmd);
  if (todayRow && hasInvestorQty(todayRow)) return todayRow;
  return undefined;
}

function mergeInvestorNet(a?: KisInvestorNet, b?: KisInvestorNet): KisInvestorNet | undefined {
  if (!a && !b) return undefined;
  return {
    personalNetQty: a?.personalNetQty ?? b?.personalNetQty,
    foreignNetQty: a?.foreignNetQty ?? b?.foreignNetQty,
    institutionNetQty: a?.institutionNetQty ?? b?.institutionNetQty,
    personalNetAmount: a?.personalNetAmount ?? b?.personalNetAmount,
    foreignNetAmount: a?.foreignNetAmount ?? b?.foreignNetAmount,
    institutionNetAmount: a?.institutionNetAmount ?? b?.institutionNetAmount,
    securitiesNetQty: a?.securitiesNetQty ?? b?.securitiesNetQty,
    trustNetQty: a?.trustNetQty ?? b?.trustNetQty,
    pensionNetQty: a?.pensionNetQty ?? b?.pensionNetQty,
    asOf: a?.asOf ?? b?.asOf,
  };
}

function mergeProgram(a?: KisProgramTrade, b?: KisProgramTrade): KisProgramTrade | undefined {
  if (!a && !b) return undefined;
  return {
    netBuyQty: a?.netBuyQty ?? b?.netBuyQty,
    netBuyAmount: a?.netBuyAmount ?? b?.netBuyAmount,
    buyQty: a?.buyQty ?? b?.buyQty,
    sellQty: a?.sellQty ?? b?.sellQty,
    asOf: a?.asOf ?? b?.asOf,
  };
}

function parseExtended(o: Record<string, unknown>): KisQuoteExtended {
  return {
    open: parseOptionalNum(o.stck_oprc),
    volume: parseOptionalNum(o.acml_vol),
    tradingValue: parseOptionalNum(o.acml_tr_pbmn),
    marketCap: parseOptionalNum(o.hts_avls) ?? parseOptionalNum(o.mkt_cap),
    per: parseOptionalNum(o.per),
    pbr: parseOptionalNum(o.pbr),
    eps: parseOptionalNum(o.eps),
    bps: parseOptionalNum(o.bps),
    listedShares: parseOptionalNum(o.lstn_stcn),
    upperLimit: parseOptionalNum(o.stck_mxpr),
    lowerLimit: parseOptionalNum(o.stck_llam),
    week52High: parseOptionalNum(o.w52_hgpr),
    week52Low: parseOptionalNum(o.w52_lwpr),
    foreignOwnershipPct: parseOptionalNum(o.hts_frgn_ehrt),
    sectorName: typeof o.bstp_kor_isnm === "string" && o.bstp_kor_isnm ? String(o.bstp_kor_isnm) : undefined,
    sectorMidCode:
      typeof o.idx_bztp_mcls_cd === "string" && o.idx_bztp_mcls_cd
        ? String(o.idx_bztp_mcls_cd)
        : typeof o.bstp_cls_code === "string" && o.bstp_cls_code
          ? String(o.bstp_cls_code)
          : undefined,
  };
}

function parseInvestorRow(row: Record<string, unknown>): KisInvestorNet {
  return {
    personalNetQty: parseOptionalNum(row.prsn_ntby_qty),
    foreignNetQty: parseOptionalNum(row.frgn_ntby_qty),
    institutionNetQty: parseOptionalNum(row.orgn_ntby_qty),
    personalNetAmount: parseOptionalNum(row.prsn_ntby_tr_pbmn),
    foreignNetAmount: parseOptionalNum(row.frgn_ntby_tr_pbmn),
    institutionNetAmount: parseOptionalNum(row.orgn_ntby_tr_pbmn),
    securitiesNetQty: parseOptionalNum(row.scrt_ntby_qty),
    trustNetQty: parseOptionalNum(row.ivtr_ntby_qty),
    pensionNetQty: optNum(row.pnsn_ntby_qty, row.fund_ntby_qty),
    asOf: String(row.stck_bsop_date ?? row.bsop_date ?? row.stck_cntg_hour ?? "") || undefined,
  };
}

/** inquire-price 응답 — 당일 장중 외국인·기관·개인·프로그램 */
function parseInvestorFromPrice(o: Record<string, unknown>): KisInvestorNet | undefined {
  const inv: KisInvestorNet = {
    personalNetQty: parseOptionalNum(o.prsn_ntby_qty),
    foreignNetQty: parseOptionalNum(o.frgn_ntby_qty),
    institutionNetQty: parseOptionalNum(o.orgn_ntby_qty),
    personalNetAmount: parseOptionalNum(o.prsn_ntby_tr_pbmn),
    foreignNetAmount: parseOptionalNum(o.frgn_ntby_tr_pbmn),
    institutionNetAmount: parseOptionalNum(o.orgn_ntby_tr_pbmn),
    asOf: kstYmd(),
  };
  if (
    inv.personalNetQty != null ||
    inv.foreignNetQty != null ||
    inv.institutionNetQty != null ||
    inv.personalNetAmount != null ||
    inv.foreignNetAmount != null ||
    inv.institutionNetAmount != null
  ) {
    return inv;
  }
  return undefined;
}

function parseProgramFromPrice(o: Record<string, unknown>): KisProgramTrade | undefined {
  const netBuyQty = parseOptionalNum(o.pgtr_ntby_qty);
  const netBuyAmount = parseOptionalNum(o.pgtr_ntby_tr_pbmn);
  if (netBuyQty == null && netBuyAmount == null) return undefined;
  return { netBuyQty, netBuyAmount, asOf: kstYmd() };
}

function parseInvestorDaily(row: Record<string, unknown>): KisInvestorDailyRow {
  return {
    date: String(row.stck_bsop_date ?? row.bsop_date ?? ""),
    personalNetQty: parseOptionalNum(row.prsn_ntby_qty),
    foreignNetQty: parseOptionalNum(row.frgn_ntby_qty),
    institutionNetQty: parseOptionalNum(row.orgn_ntby_qty),
    personalNetAmount: parseOptionalNum(row.prsn_ntby_tr_pbmn),
    foreignNetAmount: parseOptionalNum(row.frgn_ntby_tr_pbmn),
    institutionNetAmount: parseOptionalNum(row.orgn_ntby_tr_pbmn),
    personalBuyQty: parseOptionalNum(row.prsn_shnu_vol),
    personalSellQty: parseOptionalNum(row.prsn_seln_vol),
    foreignBuyQty: parseOptionalNum(row.frgn_shnu_vol),
    foreignSellQty: parseOptionalNum(row.frgn_seln_vol),
    institutionBuyQty: parseOptionalNum(row.orgn_shnu_vol),
    institutionSellQty: parseOptionalNum(row.orgn_seln_vol),
  };
}

function toInvestorGross(d: KisInvestorDailyRow): KisInvestorGross | undefined {
  if (
    d.foreignBuyQty == null &&
    d.foreignSellQty == null &&
    d.institutionBuyQty == null &&
    d.institutionSellQty == null &&
    d.personalBuyQty == null &&
    d.personalSellQty == null
  ) {
    return undefined;
  }
  return {
    date: d.date,
    foreignBuyQty: d.foreignBuyQty,
    foreignSellQty: d.foreignSellQty,
    institutionBuyQty: d.institutionBuyQty,
    institutionSellQty: d.institutionSellQty,
    personalBuyQty: d.personalBuyQty,
    personalSellQty: d.personalSellQty,
  };
}

function rowsToInvestorDaily(rows: Record<string, unknown>[]): KisInvestorDailyRow[] {
  return rows
    .map((r) => parseInvestorDaily(r))
    .filter(
      (r) =>
        r.date &&
        (r.personalNetQty != null ||
          r.foreignNetQty != null ||
          r.institutionNetQty != null ||
          r.personalBuyQty != null ||
          r.foreignBuyQty != null ||
          r.institutionBuyQty != null)
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
}

async function fetchPriceOutput(code: string): Promise<Record<string, unknown>> {
  const data = await kisGetJson<{ output?: Record<string, unknown> }>(
    "/uapi/domestic-stock/v1/quotations/inquire-price",
    "FHKST01010100",
    { FID_COND_MRKT_DIV_CODE: "J", FID_INPUT_ISCD: code }
  );
  return data.output ?? {};
}

async function fetchInvestorFromApi(code: string): Promise<{
  investor?: KisInvestorNet;
  daily: KisInvestorDailyRow[];
}> {
  const data = await kisGetJson<{ output?: Record<string, unknown>[] | Record<string, unknown> }>(
    "/uapi/domestic-stock/v1/quotations/inquire-investor",
    "FHKST01010900",
    { FID_COND_MRKT_DIV_CODE: "J", FID_INPUT_ISCD: code }
  );
  const raw = data.output;
  const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];
  if (rows.length === 0) return { daily: [] };

  const today = kstYmd();
  const snapRow = pickTodayInvestorRow(rows, today);
  return {
    investor: snapRow ? parseInvestorRow(snapRow) : undefined,
    daily: rowsToInvestorDaily(rows),
  };
}

async function fetchInvestorDailyDetailed(code: string): Promise<KisInvestorDailyRow[]> {
  const datesToTry = isKrxAfterDailySettlement()
    ? [kstYmd(), kstPrevBusinessYmd()]
    : [kstPrevBusinessYmd(), kstYmd()];

  let lastErr: Error | undefined;
  for (const queryDate of datesToTry) {
    try {
      const data = await kisGetJson<{
        output2?: Record<string, unknown>[] | Record<string, unknown>;
      }>(
        "/uapi/domestic-stock/v1/quotations/investor-trade-by-stock-daily",
        "FHPTJ04160001",
        {
          FID_COND_MRKT_DIV_CODE: "J",
          FID_INPUT_ISCD: code,
          FID_INPUT_DATE_1: queryDate,
          FID_ORG_ADJ_PRC: "",
          FID_ETC_CLS_CODE: "",
        }
      );
      const raw = data.output2;
      const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const parsed = rowsToInvestorDaily(rows as Record<string, unknown>[]);
      if (parsed.length > 0) return parsed;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error("조회 실패");
      if (!/TIME LIMIT|OPSQ2001/i.test(lastErr.message)) throw lastErr;
    }
  }
  if (lastErr) throw lastErr;
  return [];
}

async function fetchOrderBook(code: string): Promise<KisOrderBook | undefined> {
  const data = await kisGetJson<{
    output1?: Record<string, unknown>;
    output2?: Record<string, unknown>;
  }>(
    "/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn",
    "FHKST01010200",
    { FID_COND_MRKT_DIV_CODE: "J", FID_INPUT_ISCD: code }
  );
  const o1 = data.output1 ?? {};
  const o2 = data.output2 ?? {};
  return {
    askPrice1: parseOptionalNum(o1.askp1),
    bidPrice1: parseOptionalNum(o1.bidp1),
    askQty1: parseOptionalNum(o1.askp_rsqn1),
    bidQty1: parseOptionalNum(o1.bidp_rsqn1),
    totalAskQty: optNum(o1.total_askp_rsqn, o1.total_ask_rsqn),
    totalBidQty: optNum(o1.total_bidp_rsqn, o1.total_bid_rsqn),
    expectedPrice: optNum(o2.antc_cnpr, o1.antc_cnpr),
    expectedQty: optNum(o2.antc_cnqn, o1.antc_cnqn, o2.antc_vol, o1.antc_vol, o2.acml_vol),
  };
}

async function fetchProgramTrade(code: string): Promise<KisProgramTrade | undefined> {
  const data = await kisGetJson<{ output?: Record<string, unknown>[] | Record<string, unknown> }>(
    "/uapi/domestic-stock/v1/quotations/program-trade-by-stock",
    "FHPPG04650101",
    { FID_COND_MRKT_DIV_CODE: "J", FID_INPUT_ISCD: code }
  );
  const raw = data.output;
  const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (rows.length === 0) return undefined;
  const row = rows[0] as Record<string, unknown>;
  return {
    netBuyQty: optNum(row.whol_smtn_ntby_qty, row.whol_ntby_qty, row.ntby_qty),
    netBuyAmount: optNum(row.whol_smtn_ntby_tr_pbmn, row.whol_ntby_tr_pbmn, row.ntby_tr_pbmn),
    buyQty: optNum(row.whol_smtn_shnu_vol, row.whol_shnu_vol),
    sellQty: optNum(row.whol_smtn_seln_vol, row.whol_seln_vol),
    asOf: String(row.bsop_hour ?? row.stck_cntg_hour ?? "") || undefined,
  };
}

/** 종목 1개 — KIS 시세 + 부가 API */
export async function fetchKisStockSnapshot(rawCode: string): Promise<StockQuote> {
  const code = normalizeStockCode(rawCode);
  const o = await fetchPriceOutput(code);

  const price = parseNum(o.stck_prpr);
  if (price <= 0) throw new Error("유효하지 않은 시세 응답");

  const normalized = normalizeMarketChange(
    price,
    parseNum(o.stck_prdy_clpr),
    parseNum(o.prdy_vrss),
    parseNum(o.prdy_ctrt),
    0
  );

  const extras: KisStockExtras = {
    extended: parseExtended(o),
    investor: parseInvestorFromPrice(o),
    program: parseProgramFromPrice(o),
    errors: {},
  };

  const tasks: { key: string; run: () => Promise<void> }[] = [
    {
      key: "investor",
      run: async () => {
        const api = await fetchInvestorFromApi(code);
        extras.investor = mergeInvestorNet(extras.investor, api.investor);
        if (api.daily.length > 0) extras.investorDaily = api.daily;
      },
    },
    {
      key: "investorDaily",
      run: async () => {
        const detailed = await fetchInvestorDailyDetailed(code);
        if (detailed.length > 0) {
          extras.investorDaily = detailed;
          extras.investorGross = toInvestorGross(detailed[0]);
        }
      },
    },
    {
      key: "orderBook",
      run: async () => {
        extras.orderBook = await fetchOrderBook(code);
      },
    },
    {
      key: "program",
      run: async () => {
        extras.program = mergeProgram(await fetchProgramTrade(code), extras.program);
      },
    },
    {
      key: "shortSale",
      run: async () => {
        extras.shortSaleDaily = await fetchStockShortSaleDaily(code);
      },
    },
    {
      key: "sectorIndex",
      run: async () => {
        const sectorCode = extras.extended?.sectorMidCode;
        const sectorName = extras.extended?.sectorName;
        if (!sectorCode) return;
        const idx = await fetchSectorIndexPrice(sectorCode);
        if (!idx) return;
        extras.sectorIndex = {
          label: sectorName ?? `업종 ${sectorCode}`,
          price: idx.price,
          changeRate: idx.changeRate,
          code: sectorCode,
        };
      },
    },
  ];

  for (const t of tasks) {
    try {
      await t.run();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "조회 실패";
      const hasDailyFallback = !!extras.investorDaily?.length;
      const isTimeLimit = /TIME LIMIT|OPSQ2001/i.test(msg);
      if (t.key === "investorDaily" && hasDailyFallback && isTimeLimit) {
        continue;
      }
      extras.errors![t.key] = isTimeLimit
        ? "장중에는 당일 확정 미제공 · 전일 기준 inquire-investor 사용"
        : msg;
    }
    await sleep(60);
  }

  if (extras.errors && Object.keys(extras.errors).length === 0) delete extras.errors;

  return {
    ...normalized,
    high: parseNum(o.stck_hgpr) || price,
    low: parseNum(o.stck_lwpr) || price,
    updatedAt: new Date().toISOString(),
    kis: extras,
  };
}

export async function fetchKisSnapshots(codes: string[]): Promise<{
  quotes: Record<string, StockQuote>;
  prices: Record<string, number>;
  errors: Record<string, string>;
}> {
  const quotes: Record<string, StockQuote> = {};
  const prices: Record<string, number> = {};
  const errors: Record<string, string> = {};

  for (const raw of codes) {
    const code = normalizeStockCode(raw);
    try {
      const q = await fetchKisStockSnapshot(code);
      quotes[code] = q;
      prices[code] = q.price;
    } catch (err) {
      errors[code] = err instanceof Error ? err.message : "조회 실패";
    }
    await sleep(80);
  }

  return { quotes, prices, errors };
}
