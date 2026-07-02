/**
 * 매매 판단 게이트 — 타이밍선·하락장·시장 breadth 반영
 */

import type { KospiBenchmark, StockQuote, StockSummary } from "../types";
import type { BuyTimingSignal, SellTimingSignal } from "../types";
import type { MarketBriefingContext } from "./types";
import { fmt } from "../calc";

export interface VerdictGateContext {
  inBuyZone: boolean;
  inSellZone: boolean;
  aboveBuyLine: boolean;
  belowSellLine: boolean;
  waitBuyPrice: number | null;
  waitBuyPrice2: number | null;
  waitSellPrice: number | null;
  waitSellPrice2: number | null;
  fallingKnife: boolean;
  breadthBearish: boolean;
  marketDown: boolean;
  stockDown: boolean;
}

export function buildVerdictGateContext(
  summary: StockSummary,
  quote: StockQuote | undefined,
  buySignal: BuyTimingSignal,
  sellSignal: SellTimingSignal,
  kospi: KospiBenchmark | undefined,
  marketContext: MarketBriefingContext | null | undefined
): VerdictGateContext {
  const inBuyZone = buySignal.status === "zone10" || buySignal.status === "zone20";
  const aboveBuyLine = buySignal.status === "above";
  const inSellZone = sellSignal.status === "zone10" || sellSignal.status === "zone20";
  const belowSellLine = sellSignal.status === "below";

  const kospiBreadth = marketContext?.marketBreadth?.find((b) => b.label === "KOSPI");
  const breadthBearish =
    !!kospiBreadth &&
    kospiBreadth.decline > 0 &&
    kospiBreadth.decline >= kospiBreadth.advance * 1.25;

  const marketDown = (kospi?.changeRate ?? 0) <= -0.8;
  const stockDown = (quote?.changeRate ?? 0) <= -1.2;
  const fallingKnife = marketDown && stockDown && aboveBuyLine;

  return {
    inBuyZone,
    inSellZone,
    aboveBuyLine,
    belowSellLine,
    waitBuyPrice: summary.timing10 ?? null,
    waitBuyPrice2: summary.timing20 ?? null,
    waitSellPrice: summary.sellTiming10 ?? null,
    waitSellPrice2: summary.sellTiming20 ?? null,
    fallingKnife,
    breadthBearish,
    marketDown,
    stockDown,
  };
}

export function applyBuyScoreGates(
  rawScore: number,
  ctx: VerdictGateContext,
  hasStructuralBuy: boolean
): number {
  let score = rawScore;

  if (ctx.breadthBearish) score -= 6;

  if (ctx.fallingKnife) score = Math.min(score, 12);

  if (ctx.aboveBuyLine && !hasStructuralBuy) score = Math.min(score, 10);

  if (ctx.aboveBuyLine && score >= 28) score = 18;

  if (ctx.aboveBuyLine && score >= 16) score = Math.min(score, 12);

  if (!ctx.inBuyZone && !hasStructuralBuy && score >= 20) score = 14;

  return Math.max(0, score);
}

export function mapBuyVerdict(
  score: number,
  ctx: VerdictGateContext,
  hasTimingLines: boolean,
  buyZone: "zone10" | "zone20" | "above" | "watch" | "other" = "other"
): { stance: "yes" | "wait"; timing: "now" | "this_week" | "wait"; when: string; headline: string } {
  const cheap1 = ctx.waitBuyPrice;
  const cheap2 = ctx.waitBuyPrice2;

  if (ctx.fallingKnife || (ctx.aboveBuyLine && ctx.marketDown)) {
    return {
      stance: "wait",
      timing: "wait",
      when: cheap1 ? `${fmt(cheap1)} 이하로` : "가격 하락 대기",
      headline: cheap1 ? `${fmt(cheap1)} 이하로 떨어지면 매수` : "하락장 — 지금 사지 않기",
    };
  }

  if (ctx.inBuyZone && score >= 18) {
    return {
      stance: "yes",
      timing: "now",
      when: "지금~오늘",
      headline:
        buyZone === "zone20"
          ? "추가 매수 OK (매도가보다 20%↓)"
          : "조금 더 싸짐 — 매수 OK (매도가보다 10%↓)",
    };
  }

  if (score >= 28 && !ctx.aboveBuyLine) {
    return {
      stance: "yes",
      timing: "now",
      when: "지금~오늘",
      headline: "설정한 가격대 도달 — 매수 검토",
    };
  }

  if (score >= 16 && ctx.inBuyZone) {
    return {
      stance: "yes",
      timing: "this_week",
      when: "이번 주",
      headline: "이번 주 나눠서 매수 검토",
    };
  }

  if (ctx.aboveBuyLine && hasTimingLines && cheap1) {
    return {
      stance: "wait",
      timing: "wait",
      when: `${fmt(cheap1)} 이하로`,
      headline: `아직 비쌈 — ${fmt(cheap1)} 이하 대기`,
    };
  }

  if (score >= 16) {
    return { stance: "yes", timing: "this_week", when: "이번 주", headline: "이번 주 매수 검토" };
  }
  if (score >= 6) {
    return {
      stance: "wait",
      timing: "wait",
      when: cheap1 ? `${fmt(cheap1)} 이하로` : "조금 더",
      headline: cheap1 ? `${fmt(cheap1)}까지 기다리기` : "아직 기다리기",
    };
  }

  return {
    stance: "wait",
    timing: "wait",
    when: "관망",
    headline: cheap1 ? `지금은 사기엔 비쌈 (${fmt(cheap1)} 참고)` : "지금은 매수 구간 아님",
  };
}

export function mapSellVerdict(
  score: number,
  ctx: VerdictGateContext,
  holdingQty: number
): { stance: "yes" | "wait" | "skip"; timing: "now" | "this_week" | "wait" | "skip"; when: string; headline: string } {
  if (holdingQty <= 0) {
    return { stance: "skip", timing: "skip", when: "—", headline: "보유 종목 없음" };
  }

  const target1 = ctx.waitSellPrice;
  const target2 = ctx.waitSellPrice2;

  /** 목표 매도가보다 낮으면 — 점수와 관계없이 '보유' */
  if (ctx.belowSellLine && target1) {
    return {
      stance: "wait",
      timing: "wait",
      when: "지금은 보유",
      headline: `목표 ${fmt(target1)}까지 보유`,
    };
  }

  if (ctx.inSellZone && score >= 18) {
    return {
      stance: "yes",
      timing: "now",
      when: "지금~오늘",
      headline:
        target2 && ctx.inSellZone
          ? `목표 ${fmt(target2)} 근처 — 매도 검토`
          : `목표 ${fmt(target1!)} 도달 — 매도 검토`,
    };
  }

  if (score >= 28 && ctx.inSellZone) {
    return { stance: "yes", timing: "now", when: "지금~오늘", headline: "목표가 도달 — 매도 검토" };
  }

  if (score >= 16 && ctx.inSellZone) {
    return { stance: "yes", timing: "this_week", when: "이번 주", headline: "이번 주 나눠서 매도 검토" };
  }

  if (score >= 6) {
    return {
      stance: "wait",
      timing: "wait",
      when: target1 ? `${fmt(target1)} 이상` : "조금 더",
      headline: target1 ? `목표 ${fmt(target1)}까지 보유` : "조금 더 보유",
    };
  }

  return {
    stance: "wait",
    timing: "wait",
    when: "보유 유지",
    headline: target1 ? `목표 ${fmt(target1)}까지 보유` : "지금은 매도 구간 아님",
  };
}

export function refineBuyPrices(
  zone: { suggested: number; min: number; max: number },
  ctx: VerdictGateContext,
  price: number,
  roundPrice: (n: number) => number
): { suggested: number; min: number; max: number; limitHint: string } {
  const cheap1 = ctx.waitBuyPrice;
  const cheap2 = ctx.waitBuyPrice2;

  if (ctx.aboveBuyLine && cheap1 && price > cheap1) {
    const min = cheap2 && cheap2 < cheap1 ? roundPrice(cheap2) : roundPrice(cheap1 * 0.98);
    const max = roundPrice(cheap1);
    return {
      suggested: max,
      min,
      max,
      limitHint: `${fmt(min)}~${fmt(max)} (이 가격 이하에서 매수)`,
    };
  }

  if (ctx.inBuyZone && cheap1) {
    const max = Math.min(price, roundPrice(cheap1 * 1.01));
    const min = zone.min;
    return {
      suggested: price <= min * 1.01 ? price : roundPrice((min + price) / 2),
      min,
      max,
      limitHint: `${fmt(min)}~${fmt(max)} (나눠서 매수)`,
    };
  }

  return {
    ...zone,
    limitHint: `${fmt(zone.min)}~${fmt(zone.max)}`,
  };
}

export function refineSellPrices(
  zone: { suggested: number; min: number; max: number },
  ctx: VerdictGateContext,
  price: number,
  roundPrice: (n: number) => number
): { suggested: number; min: number; max: number; limitHint: string } {
  const target1 = ctx.waitSellPrice;
  const target2 = ctx.waitSellPrice2;

  if (ctx.belowSellLine && target1 && price < target1) {
    return {
      suggested: roundPrice(target1),
      min: roundPrice(target1),
      max: target2 ? roundPrice(target2) : roundPrice(target1 * 1.03),
      limitHint: `목표 ${fmt(target1)} 이상에 매도 (지금 ${fmt(price)} — 아직 보유)`,
    };
  }

  if (ctx.inSellZone && target1) {
    const min = Math.max(price, roundPrice(target1 * 0.99));
    const max = zone.max;
    return {
      suggested: price >= max * 0.99 ? price : roundPrice((price + max) / 2),
      min,
      max,
      limitHint: `${fmt(min)}~${fmt(max)} (나눠서 매도)`,
    };
  }

  return {
    ...zone,
    limitHint: `${fmt(zone.min)}~${fmt(zone.max)}`,
  };
}
