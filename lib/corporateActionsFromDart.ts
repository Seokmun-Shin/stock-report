/** DART 공시 제목에서 분할·배당 이벤트 추출 (자동 등록용) */

import type { BriefingDisclosure } from "@/lib/briefing/types";
import type { AppData, StockEvent } from "@/lib/types";
import { uid } from "@/lib/calc";

function dartDateToIso(ymd: string): string | null {
  const d = ymd.replace(/\D/g, "");
  if (d.length !== 8) return null;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

function parseSplitRatio(title: string): number | undefined {
  const colon = title.match(/(\d+)\s*[:：]\s*(\d+)/);
  if (colon) {
    const left = Number(colon[1]);
    const right = Number(colon[2]);
    if (left > 0 && right > 0) return Math.max(left, right) / Math.min(left, right);
  }
  const perShare = title.match(/1\s*주당\s*(\d+(?:\.\d+)?)\s*주/);
  if (perShare) {
    const n = Number(perShare[1]);
    if (n >= 2) return Math.round(n);
  }
  return undefined;
}

function isSplitDisclosure(title: string): boolean {
  return /주식\s*분할|액면\s*분할|분할\s*결정|분할\s*기일|분할\s*비율/.test(title);
}

function isDividendDisclosure(title: string): boolean {
  return /현금\s*·?\s*배당|배당\s*결정|중간\s*배당|결산\s*배당|배당\s*기일|배당금\s*지급/.test(title);
}

function eventKey(stockId: string, type: StockEvent["type"], date: string): string {
  return `${stockId}:${type}:${date}`;
}

/** 종목별 DART 공시 → stockEvents 후보 */
export function extractCorporateActionsFromDisclosures(
  stockId: string,
  disclosures: BriefingDisclosure[]
): StockEvent[] {
  const out: StockEvent[] = [];

  for (const d of disclosures) {
    const date = dartDateToIso(d.date);
    if (!date) continue;
    const title = d.title;

    if (isSplitDisclosure(title)) {
      const ratio = parseSplitRatio(title);
      out.push({
        id: uid(),
        stockId,
        type: "split",
        date,
        ratio,
        memo: ratio ? `DART 자동 · ${title.slice(0, 40)}` : `DART 자동(비율 확인 필요) · ${title.slice(0, 36)}`,
      });
      continue;
    }

    if (isDividendDisclosure(title)) {
      out.push({
        id: uid(),
        stockId,
        type: "dividend",
        date,
        memo: `DART 자동 · ${title.slice(0, 40)}`,
      });
    }
  }

  return out;
}

/** briefing 종목 공시 → stockEvents 병합 (중복 제외, 매매 자동 조정 없음) */
export function mergeCorporateActionsFromBriefing(
  data: AppData,
  stockDisclosures: { stockId: string; disclosures: BriefingDisclosure[] }[]
): AppData | null {
  const existing = new Set(
    (data.stockEvents ?? []).map((e) => eventKey(e.stockId, e.type, e.date))
  );
  const added: StockEvent[] = [];

  for (const { stockId, disclosures } of stockDisclosures) {
    for (const ev of extractCorporateActionsFromDisclosures(stockId, disclosures)) {
      const key = eventKey(ev.stockId, ev.type, ev.date);
      if (existing.has(key)) continue;
      existing.add(key);
      added.push(ev);
    }
  }

  if (added.length === 0) return null;

  return {
    ...data,
    stockEvents: [...(data.stockEvents ?? []), ...added],
  };
}
