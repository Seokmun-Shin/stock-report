/** KIS 시장(코스피·코스닥) 전체 투자자 수급 */

import type { MarketInvestorFlow } from "@/lib/briefing/types";
import { isKisConfigured, kisGetJson, parseOptionalNum, sleep } from "./clientCore";

const SECTOR_CODE = { KSP: "0001", KSQ: "1001" } as const;

function kstYmd(d = new Date()): string {
  const kst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, "0");
  const day = String(kst.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function kstDate(d = new Date()): Date {
  return new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

function kstPrevBusinessYmd(d = new Date()): string {
  const cursor = kstDate(d);
  cursor.setDate(cursor.getDate() - 1);
  while (cursor.getDay() === 0 || cursor.getDay() === 6) {
    cursor.setDate(cursor.getDate() - 1);
  }
  return kstYmd(cursor);
}

function* businessDaysBack(from: Date, max: number): Generator<string> {
  const cursor = kstDate(from);
  let count = 0;
  while (count < max) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      yield kstYmd(cursor);
      count++;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
}

function parseInvestorQty(row: Record<string, unknown>) {
  return {
    foreignNetQty: parseOptionalNum(row.frgn_ntby_qty),
    institutionNetQty: parseOptionalNum(row.orgn_ntby_qty),
    personalNetQty: parseOptionalNum(row.prsn_ntby_qty),
    date: String(row.stck_bsop_date ?? row.bsop_date ?? ""),
  };
}

async function fetchIntraday(market: "KSP" | "KSQ"): Promise<MarketInvestorFlow["intraday"] | undefined> {
  const sectorCode = SECTOR_CODE[market];

  const data = await kisGetJson<{ output?: Record<string, unknown>[] | Record<string, unknown> }>(
    "/uapi/domestic-stock/v1/quotations/inquire-investor-time-by-market",
    "FHPTJ04030000",
    {
      FID_INPUT_ISCD: market,
      FID_INPUT_ISCD_2: sectorCode,
    }
  );

  const raw = data.output;
  const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];
  const o = rows.length > 0 ? rows[rows.length - 1] ?? rows[0] : undefined;
  if (!o || typeof o !== "object") return undefined;

  const parsed = parseInvestorQty(o);
  if (
    parsed.foreignNetQty == null &&
    parsed.institutionNetQty == null &&
    parsed.personalNetQty == null
  ) {
    return undefined;
  }

  return {
    foreignNetQty: parsed.foreignNetQty,
    institutionNetQty: parsed.institutionNetQty,
    personalNetQty: parsed.personalNetQty,
    asOf: String(o.stck_cntg_hour ?? o.bsop_hour ?? kstYmd()),
  };
}

async function fetchDailyForDate(
  market: "KSP" | "KSQ",
  ymd: string
): Promise<NonNullable<MarketInvestorFlow["daily"]>[number] | null> {
  const sectorCode = SECTOR_CODE[market];

  const data = await kisGetJson<{ output?: Record<string, unknown>[] | Record<string, unknown> }>(
    "/uapi/domestic-stock/v1/quotations/inquire-investor-daily-by-market",
    "FHPTJ04040000",
    {
      FID_COND_MRKT_DIV_CODE: "U",
      FID_INPUT_ISCD: sectorCode,
      FID_INPUT_DATE_1: ymd,
      FID_INPUT_ISCD_1: market,
      FID_INPUT_DATE_2: ymd,
      FID_INPUT_ISCD_2: sectorCode,
    }
  );

  const raw = data.output;
  const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];

  for (const r of rows) {
    const p = parseInvestorQty(r);
    if (
      p.date &&
      (p.foreignNetQty != null || p.institutionNetQty != null || p.personalNetQty != null)
    ) {
      return {
        date: p.date,
        foreignNetQty: p.foreignNetQty,
        institutionNetQty: p.institutionNetQty,
        personalNetQty: p.personalNetQty,
      };
    }
  }

  return null;
}

async function fetchDaily(market: "KSP" | "KSQ", days = 5): Promise<MarketInvestorFlow["daily"]> {
  const out: NonNullable<MarketInvestorFlow["daily"]> = [];
  const seen = new Set<string>();

  const start = kstDate();
  start.setDate(start.getDate() - 1);

  for (const ymd of businessDaysBack(start, days + 8)) {
    if (out.length >= days) break;
    if (seen.has(ymd)) continue;

    try {
      const row = await fetchDailyForDate(market, ymd);
      if (row && !seen.has(row.date)) {
        seen.add(row.date);
        out.push(row);
      }
    } catch {
      /* skip day */
    }
    await sleep(80);
  }

  return out.sort((a, b) => b.date.localeCompare(a.date)).slice(0, days);
}

const MARKET_META: { market: "KSP" | "KSQ"; label: string }[] = [
  { market: "KSP", label: "코스피" },
  { market: "KSQ", label: "코스닥" },
];

export async function fetchMarketInvestorFlows(): Promise<MarketInvestorFlow[]> {
  if (!isKisConfigured()) return [];

  const out: MarketInvestorFlow[] = [];

  for (const meta of MARKET_META) {
    try {
      const [intradayR, dailyR] = await Promise.allSettled([
        fetchIntraday(meta.market),
        fetchDaily(meta.market),
      ]);

      const intraday = intradayR.status === "fulfilled" ? intradayR.value : undefined;
      const daily = dailyR.status === "fulfilled" ? (dailyR.value ?? []) : [];

      if (!intraday && daily.length === 0) continue;

      out.push({
        market: meta.market,
        label: meta.label,
        intraday,
        daily: daily.length > 0 ? daily : undefined,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      /* skip market */
    }
    await sleep(150);
  }

  return out;
}

export { kstPrevBusinessYmd };
