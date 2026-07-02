/** KOSPI·KOSDAQ 등락 종목 수 — Naver Finance (무료) */

import type { MarketBreadthSnapshot } from "../types";

function decodeHtmlBody(buf: ArrayBuffer): string {
  const bytes = Buffer.from(buf);
  try {
    const decoded = new TextDecoder("euc-kr").decode(bytes);
    if (/상승종목|KOSPI|코스피/.test(decoded)) return decoded;
  } catch {
    /* fall through */
  }
  return bytes.toString("utf8");
}

function parseCount(s: string): number {
  return parseInt(s.replace(/,/g, ""), 10);
}

/** sise_index.naver — 상한·상승·보합·하락·하한 (구/신 UI) */
function parseBreadthFromHtml(html: string, label: string): MarketBreadthSnapshot | null {
  const riseM = html.match(/상승종목\s*수[^0-9]{0,48}([\d,]+)/);
  const steadyM = html.match(/보합종목\s*수[^0-9]{0,48}([\d,]+)/);
  const fallM = html.match(/하락종목\s*수[^0-9]{0,48}([\d,]+)/);
  if (riseM && fallM) {
    return {
      label,
      advance: parseCount(riseM[1]),
      unchanged: steadyM ? parseCount(steadyM[1]) : 0,
      decline: parseCount(fallM[1]),
      updatedAt: new Date().toISOString(),
      source: "Naver Finance",
    };
  }

  const block = html.match(/class="sub_info"[\s\S]*?<\/ul>/i)?.[0];
  if (block) {
    const nums = [...block.matchAll(/<em[^>]*>([\d,]+)<\/em>/gi)]
      .map((m) => parseCount(m[1]))
      .filter((n) => Number.isFinite(n));
    if (nums.length >= 5) {
      return {
        label,
        advance: nums[1] ?? 0,
        unchanged: nums[2] ?? 0,
        decline: nums[3] ?? 0,
        updatedAt: new Date().toISOString(),
        source: "Naver Finance",
      };
    }
  }

  /** 지수 등락률(%) 직후 5개 통계 — 상한·상승·보합·하락·하한 (인코딩 무관) */
  const pctIdx = html.search(/[-−]\d[\d.]*\s*%/);
  if (pctIdx >= 0) {
    const chunk = html.slice(pctIdx, pctIdx + 1200);
    const tagged = [...chunk.matchAll(/>(\d{1,4})</g)].map((m) => parseInt(m[1], 10));
    for (let i = 0; i + 4 < tagged.length; i++) {
      const [upper, advance, unchanged, decline, lower] = tagged.slice(i, i + 5);
      if (
        upper <= 40 &&
        lower <= 40 &&
        advance >= 10 &&
        decline >= 10 &&
        unchanged >= 0 &&
        unchanged <= 500
      ) {
        return {
          label,
          advance,
          unchanged,
          decline,
          updatedAt: new Date().toISOString(),
          source: "Naver Finance",
        };
      }
    }
  }

  return null;
}

async function fetchNaverHtml(code: "KOSPI" | "KOSDAQ"): Promise<string | null> {
  const res = await fetch(`https://finance.naver.com/sise/sise_index.naver?code=${code}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept-Language": "ko-KR,ko;q=0.9",
      Accept: "text/html",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return decodeHtmlBody(await res.arrayBuffer());
}

export async function fetchMarketBreadth(): Promise<MarketBreadthSnapshot[]> {
  const out: MarketBreadthSnapshot[] = [];

  for (const code of ["KOSPI", "KOSDAQ"] as const) {
    const html = await fetchNaverHtml(code);
    if (html) {
      const parsed = parseBreadthFromHtml(html, code);
      if (parsed) out.push(parsed);
    }
  }

  return out;
}
