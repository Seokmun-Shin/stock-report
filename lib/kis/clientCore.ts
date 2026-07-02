/** KIS Open API — 공통 HTTP (서버 전용) */

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

export function getBaseUrl(): string {
  return process.env.KIS_USE_VTS === "true" ? VTS_BASE : REAL_BASE;
}

export function parseNum(v: unknown): number {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** 빈 값만 undefined, 0은 유효값으로 유지 */
export function parseOptionalNum(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = parseNum(v);
  return Number.isFinite(n) ? n : undefined;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getAccessToken(): Promise<string> {
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

export function kisHeaders(token: string, trId: string): Record<string, string> {
  return {
    "Content-Type": "application/json; charset=utf-8",
    authorization: `Bearer ${token}`,
    appkey: process.env.KIS_APP_KEY!.trim(),
    appsecret: process.env.KIS_APP_SECRET!.trim(),
    tr_id: trId,
    custtype: "P",
  };
}

export async function kisGetJson<T>(
  path: string,
  trId: string,
  params: Record<string, string>
): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`${getBaseUrl()}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: kisHeaders(token, trId),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`KIS API 실패 (${res.status}) ${path}`);
  }

  const data = (await res.json()) as { rt_cd?: string; msg1?: string } & T;
  if (data.rt_cd !== "0") {
    throw new Error(data.msg1 ?? `KIS API 오류 ${path}`);
  }

  return data;
}
