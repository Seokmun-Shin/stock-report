/** DART Open API — 공시 (무료, DART_API_KEY 필요) */

import type { BriefingDisclosure } from "../types";

const DART_BASE = "https://opendart.fss.or.kr/api";

export function isDartConfigured(): boolean {
  return !!process.env.DART_API_KEY?.trim();
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

interface DartListItem {
  corp_name?: string;
  stock_code?: string;
  report_nm?: string;
  rcept_dt?: string;
}

/** 최근 공시 목록 (stock_code로 필터) */
export async function fetchRecentDisclosures(stockCodes: string[], days = 14): Promise<BriefingDisclosure[]> {
  const key = process.env.DART_API_KEY?.trim();
  if (!key) return [];

  const codeSet = new Set(stockCodes.map((c) => c.replace(/\D/g, "").padStart(6, "0")));
  if (codeSet.size === 0) return [];

  const url = new URL(`${DART_BASE}/list.json`);
  url.searchParams.set("crtfc_key", key);
  url.searchParams.set("bgn_de", daysAgo(days));
  url.searchParams.set("end_de", formatDate(new Date()));
  url.searchParams.set("page_count", "100");
  url.searchParams.set("sort", "date");
  url.searchParams.set("sort_mth", "desc");

  const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`DART list (${res.status})`);

  const data = (await res.json()) as {
    status?: string;
    message?: string;
    list?: DartListItem[];
  };

  if (data.status !== "000") {
    throw new Error(data.message ?? "DART API 오류");
  }

  const out: BriefingDisclosure[] = [];
  for (const item of data.list ?? []) {
    const code = (item.stock_code ?? "").replace(/\D/g, "").padStart(6, "0");
    if (!codeSet.has(code)) continue;
    out.push({
      date: item.rcept_dt ?? "",
      title: item.report_nm ?? "",
      corpName: item.corp_name ?? "",
      stockCode: code,
    });
  }

  return out.slice(0, 50);
}

/** 공시 제목 키워드 감성 */
export function scoreDisclosureSentiment(disclosures: BriefingDisclosure[]): number {
  let score = 0;
  for (const d of disclosures) {
    const t = d.title;
    if (/실적|증가|흑자|수주|배당|자사주/.test(t)) score += 0.3;
    if (/감소|적자|소송|횡령|유상증자|관리|상장폐지/.test(t)) score -= 0.4;
  }
  return Math.max(-1, Math.min(1, score));
}
