/** 한국투자증권 Open API — 서버 전용 (Route Handler에서만 import) */

import type { KospiBenchmark, StockQuote } from "@/lib/types";
import { normalizeMarketChange } from "./normalizeQuote";

const REAL_BASE = "https://openapi.koreainvestment.com:9443";
const VTS_BASE = "https://openapivts.koreainvestment.com:29443";

interface TokenCache {
  token: string;
  expiresAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __kisTokenCache: TokenCache | undefined;
}

export function isKisConfigured(): boolean {
  return !!(process.env.KIS_APP_KEY?.trim() && process.env.KIS_APP_SECRET?.trim());
}

export function normalizeStockCode(code: string): string {
  return code.replace(/\D/g, "").padStart(6, "0").slice(-6);
}

function getBaseUrl(): string {
  return process.env.KIS_USE_VTS === "true" ? VTS_BASE : REAL_BASE;
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  const cached = global.__kisTokenCache;
  if (cached && now < cached.expiresAt - 60_000) {
    return cached.token;
  }

  const appkey = process.env.KIS_APP_KEY!.trim();
  const appsecret = process.env.KIS_APP_SECRET!.trim();

  const res = await fetch(`${getBaseUrl()}/oauth2/tokenP`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey,
      appsecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`KIS 토큰 발급 실패 (${res.status})${text ? `: ${text.slice(0, 120)}` : ""}`);
  }

  const data = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!data.access_token) {
    throw new Error(data.error_description ?? "KIS access_token 없음");
  }

  global.__kisTokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in ?? 86_400) * 1000,
  };

  return data.access_token;
}

function kisHeaders(token: string, trId: string): Record<string, string> {
  return {
    "Content-Type": "application/json; charset=utf-8",
    authorization: `Bearer ${token}`,
    appkey: process.env.KIS_APP_KEY!.trim(),
    appsecret: process.env.KIS_APP_SECRET!.trim(),
    tr_id: trId,
    custtype: "P",
  };
}

function parseNum(v: unknown): number {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** 국내주식 시세 (현재가·전일가·등락·고저) */
export async function fetchKisQuote(rawCode: string): Promise<StockQuote> {
  const code = normalizeStockCode(rawCode);
  const token = await getAccessToken();

  const url = new URL(`${getBaseUrl()}/uapi/domestic-stock/v1/quotations/inquire-price`);
  url.searchParams.set("FID_COND_MRKT_DIV_CODE", "J");
  url.searchParams.set("FID_INPUT_ISCD", code);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: kisHeaders(token, "FHKST01010100"),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`KIS 시세 조회 실패 (${res.status})`);
  }

  const data = (await res.json()) as {
    rt_cd?: string;
    msg1?: string;
    output?: {
      stck_prpr?: string;
      stck_prdy_clpr?: string;
      prdy_vrss?: string;
      prdy_ctrt?: string;
      stck_hgpr?: string;
      stck_lwpr?: string;
    };
  };

  if (data.rt_cd !== "0") {
    throw new Error(data.msg1 ?? "KIS API 오류");
  }

  const o = data.output ?? {};
  const price = parseNum(o.stck_prpr);
  if (price <= 0) {
    throw new Error("유효하지 않은 시세 응답");
  }

  const normalized = normalizeMarketChange(
    price,
    parseNum(o.stck_prdy_clpr),
    parseNum(o.prdy_vrss),
    parseNum(o.prdy_ctrt),
    0
  );

  return {
    ...normalized,
    high: parseNum(o.stck_hgpr) || price,
    low: parseNum(o.stck_lwpr) || price,
    updatedAt: new Date().toISOString(),
  };
}

/** @deprecated fetchKisQuote 사용 */
export async function fetchKisPrice(rawCode: string): Promise<number> {
  return (await fetchKisQuote(rawCode)).price;
}

export async function fetchKisQuotes(codes: string[]): Promise<{
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
      const q = await fetchKisQuote(code);
      quotes[code] = q;
      prices[code] = q.price;
    } catch (err) {
      errors[code] = err instanceof Error ? err.message : "조회 실패";
    }
  }

  return { quotes, prices, errors };
}

/** @deprecated fetchKisQuotes 사용 */
export async function fetchKisPrices(codes: string[]): Promise<{
  prices: Record<string, number>;
  errors: Record<string, string>;
}> {
  const { quotes, prices, errors } = await fetchKisQuotes(codes);
  return { prices, errors };
}

/** KOSPI 지수 (0001) */
export async function fetchKospiBenchmark(): Promise<KospiBenchmark> {
  const token = await getAccessToken();

  const url = new URL(`${getBaseUrl()}/uapi/domestic-stock/v1/quotations/inquire-index-price`);
  url.searchParams.set("FID_COND_MRKT_DIV_CODE", "U");
  url.searchParams.set("FID_INPUT_ISCD", "0001");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: kisHeaders(token, "FHPUP02100000"),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`KOSPI 조회 실패 (${res.status})`);
  }

  const data = (await res.json()) as {
    rt_cd?: string;
    msg1?: string;
    output?: {
      bstp_nmix_prpr?: string;
      bstp_nmix_prdy_clpr?: string;
      bstp_nmix_prdy_vrss?: string;
      prdy_ctrt?: string;
      bstp_nmix_prdy_ctrt?: string;
    };
  };

  if (data.rt_cd !== "0") {
    throw new Error(data.msg1 ?? "KOSPI API 오류");
  }

  const o = data.output ?? {};
  const price = parseNum(o.bstp_nmix_prpr);
  if (price <= 0) {
    throw new Error("유효하지 않은 KOSPI 응답");
  }

  const changeRate = parseNum(o.prdy_ctrt) || parseNum(o.bstp_nmix_prdy_ctrt);
  const normalized = normalizeMarketChange(
    price,
    parseNum(o.bstp_nmix_prdy_clpr),
    parseNum(o.bstp_nmix_prdy_vrss),
    changeRate,
    2
  );

  return {
    ...normalized,
    updatedAt: new Date().toISOString(),
  };
}
