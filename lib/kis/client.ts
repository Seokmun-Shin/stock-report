/** 한국투자증권 Open API — 서버 전용 (Route Handler에서만 import) */

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

/** 국내주식 현재가 (stck_prpr) */
export async function fetchKisPrice(rawCode: string): Promise<number> {
  const code = normalizeStockCode(rawCode);
  const token = await getAccessToken();
  const appkey = process.env.KIS_APP_KEY!.trim();
  const appsecret = process.env.KIS_APP_SECRET!.trim();

  const url = new URL(`${getBaseUrl()}/uapi/domestic-stock/v1/quotations/inquire-price`);
  url.searchParams.set("FID_COND_MRKT_DIV_CODE", "J");
  url.searchParams.set("FID_INPUT_ISCD", code);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      authorization: `Bearer ${token}`,
      appkey,
      appsecret,
      tr_id: "FHKST01010100",
      custtype: "P",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`KIS 시세 조회 실패 (${res.status})`);
  }

  const data = (await res.json()) as {
    rt_cd?: string;
    msg1?: string;
    output?: { stck_prpr?: string };
  };

  if (data.rt_cd !== "0") {
    throw new Error(data.msg1 ?? "KIS API 오류");
  }

  const price = Number(data.output?.stck_prpr);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("유효하지 않은 시세 응답");
  }

  return price;
}

export async function fetchKisPrices(codes: string[]): Promise<{
  prices: Record<string, number>;
  errors: Record<string, string>;
}> {
  const prices: Record<string, number> = {};
  const errors: Record<string, string> = {};

  for (const raw of codes) {
    const code = normalizeStockCode(raw);
    try {
      prices[code] = await fetchKisPrice(code);
    } catch (err) {
      errors[code] = err instanceof Error ? err.message : "조회 실패";
    }
  }

  return { prices, errors };
}
