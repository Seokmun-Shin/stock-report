/**
 * 대시보드·판단 카드 — 권장가 히어로, 대칭 2행 비교
 */

import { fmt, fmtPct } from "../calc";
import type { StockSummary } from "../types";
import type { SideVerdict } from "./tradingVerdict";

export const VERDICT_COMPARE_ROWS = 2;

export type AdviceTone = "buy" | "sell" | "hold" | "neutral";

function pctDiff(price: number, ref: number): number {
  return ((price - ref) / ref) * 100;
}

export type VerdictFactTone = "muted";

export interface VerdictPanelFact {
  key: string;
  label: string | null;
  value: string | null;
  suffix?: string | null;
  tone: VerdictFactTone;
}

export interface VerdictPanelHero {
  label: string;
  value: string;
}

export interface VerdictPanelCopy {
  status: string;
  adviceTone: AdviceTone;
  hero: VerdictPanelHero | null;
  facts: VerdictPanelFact[];
}

function compareSlots(rows: Array<VerdictPanelFact | null>): VerdictPanelFact[] {
  const slots: VerdictPanelFact[] = [];
  for (let i = 0; i < VERDICT_COMPARE_ROWS; i++) {
    slots.push(
      rows[i] ?? { key: `empty-${i}`, label: null, value: null, tone: "muted" }
    );
  }
  return slots;
}

function priceWithSuffix(anchor: number, current: number): { value: string; suffix: string } {
  return { value: fmt(anchor), suffix: fmtPct(pctDiff(current, anchor)) };
}

/** 대시보드 조언 문구 (패널 헤더 우측) */
export const DASHBOARD_ADVICE_MESSAGES = {
  buy: {
    yes: { text: "추가 매수 OK", tone: "buy" as AdviceTone },
    wait: { text: "가격 내려올 때까지 대기", tone: "hold" as AdviceTone },
    neutral: { text: "매수 구간 아님", tone: "neutral" as AdviceTone },
  },
  sell: {
    yes: { text: "매도 검토", tone: "sell" as AdviceTone },
    wait: { text: "보유 유지", tone: "hold" as AdviceTone },
    skip: { text: "보유 종목 없음", tone: "neutral" as AdviceTone },
  },
} as const;

function buyAdvice(buy: Pick<SideVerdict, "stance">): {
  status: string;
  tone: AdviceTone;
} {
  const pick =
    buy.stance === "yes"
      ? DASHBOARD_ADVICE_MESSAGES.buy.yes
      : buy.stance === "wait"
        ? DASHBOARD_ADVICE_MESSAGES.buy.wait
        : DASHBOARD_ADVICE_MESSAGES.buy.neutral;
  return { status: pick.text, tone: pick.tone };
}

function sellAdvice(sell: Pick<SideVerdict, "stance">): {
  status: string;
  tone: AdviceTone;
} {
  const pick =
    sell.stance === "yes"
      ? DASHBOARD_ADVICE_MESSAGES.sell.yes
      : sell.stance === "skip"
        ? DASHBOARD_ADVICE_MESSAGES.sell.skip
        : DASHBOARD_ADVICE_MESSAGES.sell.wait;
  return { status: pick.text, tone: pick.tone };
}

export function buildBuyVerdictCopy(
  summary: StockSummary,
  price: number,
  buy: Pick<SideVerdict, "stance" | "headline" | "targetPrice">
): VerdictPanelCopy {
  const advice = buyAdvice(buy);
  if (buy.stance === "skip") {
    return {
      status: buy.headline,
      adviceTone: "neutral",
      hero: null,
      facts: compareSlots([]),
    };
  }

  return {
    status: advice.status,
    adviceTone: advice.tone,
    hero:
      buy.targetPrice > 0
        ? { label: "권장 매수가", value: `~${fmt(buy.targetPrice)}` }
        : null,
    facts: compareSlots([
      summary.lastSellPrice && summary.lastSellPrice > 0
        ? (() => {
            const p = priceWithSuffix(summary.lastSellPrice, price);
            return {
              key: "last-sell",
              label: "매도가",
              value: p.value,
              suffix: p.suffix,
              tone: "muted" as const,
            };
          })()
        : null,
      summary.lastBuyPrice && summary.lastBuyPrice > 0
        ? (() => {
            const p = priceWithSuffix(summary.lastBuyPrice, price);
            return {
              key: "last-buy",
              label: "최근매수",
              value: p.value,
              suffix: p.suffix,
              tone: "muted" as const,
            };
          })()
        : null,
    ]),
  };
}

export function buildSellVerdictCopy(
  summary: StockSummary,
  price: number,
  sell: Pick<SideVerdict, "stance" | "headline" | "targetPrice">
): VerdictPanelCopy {
  const advice = sellAdvice(sell);
  if (sell.stance === "skip" || summary.holdingQty <= 0) {
    return {
      status: sell.headline,
      adviceTone: "neutral",
      hero: null,
      facts: compareSlots([]),
    };
  }

  const cost =
    summary.holdingAvgPrice > 0
      ? summary.holdingAvgPrice
      : summary.lastBuyPrice && summary.lastBuyPrice > 0
        ? summary.lastBuyPrice
        : null;
  const rec =
    sell.targetPrice > 0
      ? sell.targetPrice
      : summary.sellTiming10 && summary.sellTiming10 > 0
        ? summary.sellTiming10
        : null;

  if (!cost || !rec) {
    return {
      status: advice.status,
      adviceTone: advice.tone,
      hero: null,
      facts: compareSlots([
        cost
          ? { key: "cost", label: "평단", value: fmt(cost), tone: "muted" }
          : null,
      ]),
    };
  }

  const stage1 = summary.sellTiming10 && summary.sellTiming10 > 0 ? summary.sellTiming10 : null;
  const costVs = priceWithSuffix(cost, price);

  return {
    status: advice.status,
    adviceTone: advice.tone,
    hero: { label: "권장 매도가", value: `~${fmt(rec)}` },
    facts: compareSlots([
      {
        key: "cost",
        label: "평단",
        value: costVs.value,
        suffix: costVs.suffix,
        tone: "muted",
      },
      stage1
        ? {
            key: "stage1",
            label: "1단계 목표",
            value: fmt(stage1),
            suffix: `+${pctDiff(stage1, cost).toFixed(1)}%`,
            tone: "muted",
          }
        : null,
    ]),
  };
}

export const VERDICT_PANEL_MIN_H = "min-h-[196px]";

export const PANEL_SECTION = {
  header: "min-h-9 shrink-0",
  hero: "min-h-[4.25rem] shrink-0",
  compareHead: "h-7 shrink-0",
  compareRow: "h-7 shrink-0",
} as const;
