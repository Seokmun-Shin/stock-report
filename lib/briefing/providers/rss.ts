/** RSS 파싱 (외부 의존성 없음) */

import type { BriefingNewsItem } from "../types";

const RSS_FEEDS: { url: string; source: string; region?: BriefingNewsItem["region"]; topic?: BriefingNewsItem["topic"] }[] = [
  {
    url: "https://news.google.com/rss/search?q=KOSPI+%EC%A6%9D%EC%8B%9C&hl=ko&gl=KR&ceid=KR:ko",
    source: "Google 뉴스·증시",
    region: "KR",
    topic: "market",
  },
  {
    url: "https://news.google.com/rss/search?q=%ED%95%9C%EA%B5%AD+%EC%A6%9D%EC%8B%9C+%EC%A7%80%EC%88%98&hl=ko&gl=KR&ceid=KR:ko",
    source: "Google 뉴스·국내",
    region: "KR",
    topic: "market",
  },
  {
    url: "https://news.google.com/rss/search?q=S%26P+500+stock+market&hl=en-US&gl=US&ceid=US:en",
    source: "Google 뉴스·미국증시",
    region: "US",
    topic: "market",
  },
  {
    url: "https://news.google.com/rss/search?q=%EC%BD%94%EC%8A%A4%ED%94%BC200+%EC%A7%80%EC%88%98&hl=ko&gl=KR&ceid=KR:ko",
    source: "Google 뉴스·코스피200",
    region: "KR",
    topic: "market",
  },
];

const MACRO_RSS_FEEDS: { url: string; source: string; region: BriefingNewsItem["region"]; topic: BriefingNewsItem["topic"] }[] = [
  {
    url: "https://news.google.com/rss/search?q=Federal+Reserve+interest+rates+US+economy&hl=en-US&gl=US&ceid=US:en",
    source: "미국·금리·연준",
    region: "US",
    topic: "rates",
  },
  {
    url: "https://news.google.com/rss/search?q=US+economic+data+CPI+GDP+jobs&hl=en-US&gl=US&ceid=US:en",
    source: "미국·경제지표",
    region: "US",
    topic: "economy",
  },
  {
    url: "https://news.google.com/rss/search?q=Bank+of+Japan+BOJ+Japan+economy&hl=en-US&gl=US&ceid=US:en",
    source: "일본·BOJ·경제",
    region: "JP",
    topic: "economy",
  },
  {
    url: "https://news.google.com/rss/search?q=China+economy+PMI+PBOC&hl=en-US&gl=US&ceid=US:en",
    source: "중국·경제·정책",
    region: "CN",
    topic: "economy",
  },
  {
    url: "https://news.google.com/rss/search?q=Bank+of+England+UK+economy&hl=en-US&gl=US&ceid=US:en",
    source: "영국·BOE·경제",
    region: "UK",
    topic: "economy",
  },
  {
    url: "https://news.google.com/rss/search?q=geopolitics+war+sanctions+trade+tension&hl=en-US&gl=US&ceid=US:en",
    source: "국제정세·지정학",
    region: "GLOBAL",
    topic: "geopolitics",
  },
  {
    url: "https://news.google.com/rss/search?q=US+China+trade+tariff&hl=en-US&gl=US&ceid=US:en",
    source: "미중·무역",
    region: "GLOBAL",
    topic: "geopolitics",
  },
  {
    url: "https://news.google.com/rss/search?q=oil+OPEC+energy+crude&hl=en-US&gl=US&ceid=US:en",
    source: "에너지·유가",
    region: "GLOBAL",
    topic: "economy",
  },
  {
    url: "https://news.google.com/rss/search?q=forex+dollar+yen+yuan+exchange+rate&hl=en-US&gl=US&ceid=US:en",
    source: "글로벌·환율",
    region: "GLOBAL",
    topic: "fx",
  },
  {
    url: "https://www.federalreserve.gov/feeds/press_monetary.xml",
    source: "Fed·통화정책",
    region: "US",
    topic: "policy",
  },
  {
    url: "https://news.google.com/rss/search?q=Bank+of+Korea+monetary+policy+interest+rate&hl=en-US&gl=US&ceid=US:en",
    source: "한은·통화정책",
    region: "KR",
    topic: "policy",
  },
  {
    url: "https://news.google.com/rss/search?q=semiconductor+chip+SOX+TSMC&hl=en-US&gl=US&ceid=US:en",
    source: "반도체·글로벌",
    region: "GLOBAL",
    topic: "economy",
  },
  {
    url: "https://news.google.com/rss/search?q=KOSDAQ+%EC%A6%9D%EC%8B%9C&hl=ko&gl=KR&ceid=KR:ko",
    source: "Google 뉴스·코스닥",
    region: "KR",
    topic: "market",
  },
  {
    url: "https://news.google.com/rss/search?q=%ED%95%9C%EA%B5%AD+%EA%B2%BD%EC%A0%9C+%EC%A0%95%EC%B1%85+%EB%B6%80%EB%8F%99%EC%82%B0&hl=ko&gl=KR&ceid=KR:ko",
    source: "한국·경제정책",
    region: "KR",
    topic: "policy",
  },
  {
    url: "https://news.google.com/rss/search?q=%EC%A0%84%EA%B8%B0%EC%B0%A8+%EB%B0%B0%ED%84%B0%EB%A6%AC+%EC%A2%85%EB%AA%A9&hl=ko&gl=KR&ceid=KR:ko",
    source: "2차전지·EV",
    region: "KR",
    topic: "economy",
  },
  {
    url: "https://news.google.com/rss/search?q=ECB+eurozone+economy+inflation&hl=en-US&gl=US&ceid=US:en",
    source: "EU·ECB·경제",
    region: "EU",
    topic: "economy",
  },
  {
    url: "https://news.google.com/rss/search?q=Taiwan+economy+semiconductor+export&hl=en-US&gl=US&ceid=US:en",
    source: "대만·경제·반도체",
    region: "TW",
    topic: "economy",
  },
  {
    url: "https://news.google.com/rss/search?q=Korea+export+trade+current+account&hl=en-US&gl=US&ceid=US:en",
    source: "한국·수출·무역",
    region: "KR",
    topic: "economy",
  },
];

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function parseRssXml(
  xml: string,
  source: string,
  meta?: Pick<BriefingNewsItem, "region" | "topic">
): BriefingNewsItem[] {
  const items: BriefingNewsItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  for (const block of blocks.slice(0, 15)) {
    const title = decodeEntities(block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const link = (block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "").trim();
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "").trim();
    if (title) {
      items.push({
        title,
        link: link || "#",
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source,
        region: meta?.region,
        topic: meta?.topic,
      });
    }
  }

  return items;
}

export async function fetchRssFeed(
  url: string,
  source: string,
  meta?: Pick<BriefingNewsItem, "region" | "topic">
): Promise<BriefingNewsItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "stock-report/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RSS ${source} (${res.status})`);
  const xml = await res.text();
  return parseRssXml(xml, source, meta);
}

function mergeNewsItems(feeds: BriefingNewsItem[][], limit: number): BriefingNewsItem[] {
  const merged: BriefingNewsItem[] = [];
  const seen = new Set<string>();

  for (const batch of feeds) {
    for (const item of batch) {
      const key = item.title.slice(0, 80);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  return merged.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, limit);
}

export async function fetchMarketNews(): Promise<BriefingNewsItem[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map((f) => fetchRssFeed(f.url, f.source, { region: f.region, topic: f.topic }))
  );
  const feeds = results
    .filter((r): r is PromiseFulfilledResult<BriefingNewsItem[]> => r.status === "fulfilled")
    .map((r) => r.value);
  return mergeNewsItems(feeds, 20);
}

export async function fetchMacroNews(): Promise<BriefingNewsItem[]> {
  const results = await Promise.allSettled(
    MACRO_RSS_FEEDS.map((f) => fetchRssFeed(f.url, f.source, { region: f.region, topic: f.topic }))
  );
  const feeds = results
    .filter((r): r is PromiseFulfilledResult<BriefingNewsItem[]> => r.status === "fulfilled")
    .map((r) => r.value);
  return mergeNewsItems(feeds, 30);
}

export async function fetchStockNews(stockName: string): Promise<BriefingNewsItem[]> {
  const q = encodeURIComponent(`${stockName} 주식`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=ko&gl=KR&ceid=KR:ko`;
  try {
    return (await fetchRssFeed(url, `${stockName} 뉴스`)).slice(0, 8);
  } catch {
    return [];
  }
}

/** 간단 키워드 감성 (-1 ~ +1) */
const POSITIVE = ["상승", "호재", "실적", "서프라이즈", "수주", "신고가", "반등", "매수", "성장", "흑자", "surge", "beat", "gain"];
const NEGATIVE = ["하락", "악재", "우려", "적자", "리콜", "조사", "규제", "매도", "급락", "손실", "fall", "drop", "miss", "cut"];

export function scoreSentiment(texts: string[]): { score: number; label: string } {
  let score = 0;
  const joined = texts.join(" ").toLowerCase();

  for (const w of POSITIVE) {
    if (joined.includes(w.toLowerCase())) score += 1;
  }
  for (const w of NEGATIVE) {
    if (joined.includes(w.toLowerCase())) score -= 1;
  }

  const normalized = Math.max(-1, Math.min(1, score / 4));
  let label = "중립";
  if (normalized >= 0.35) label = "긍정";
  else if (normalized <= -0.35) label = "부정";

  return { score: normalized, label };
}
