/**
 * 매수·매도 판단 — 시세·매매기록·시장 데이터 기반 구간·신뢰도
 */

import type { KospiBenchmark, StockQuote, StockSummary } from "../types";
import type { ReportSettings } from "../reportSettings";
import { resolveReportSettings } from "../reportSettings";
import type { ReportSettings } from "../reportSettings";
import { fmt, fmtPct, getBuyTimingSignal, getSellTimingSignal, estimateSellProfit, type SellProfitEstimate } from "../calc";
import type { MarketBriefingContext, StockBriefingContext, TradeUrgency } from "./types";
import { summarizeGlobalRisk } from "./providers/globalMarket";
import { summarizeOfficialMacro } from "./providers/officialIndicators";
import { summarizeMarketInvestorFlow } from "./marketFlow";
import {
  applyExtraVerdictFactors,
  buildStockVerdictExtra,
  extraDataQualityBoost,
  mergeCostGainSignal,
  type VerdictBuildContext,
} from "./verdictExtra";
import { applyKisMarketFactors, kisDataQualityBoost } from "./kisVerdict";
import {
  applyBuyScoreGates,
  buildVerdictGateContext,
  mapBuyVerdict,
  mapSellVerdict,
  refineBuyPrices,
  refineSellPrices,
} from "./verdictGates";

export type { VerdictBuildContext };

export type VerdictTiming = TradeUrgency | "skip";

export interface SellProfitPreview {
  atNow: SellProfitEstimate;
  atTarget: SellProfitEstimate | null;
}

export interface SideVerdict {
  stance: "yes" | "wait" | "skip";
  timing: VerdictTiming;
  headline: string;
  when: string;
  targetPrice: number;
  priceRange: { min: number; max: number };
  confidence: number;
  reasons: string[];
  /** 0~1 — 입력 데이터 충족도 */
  dataQuality: number;
  sellProfitPreview?: SellProfitPreview;
}

export interface StockTradingVerdict {
  stockId: string;
  stockName: string;
  buy: SideVerdict;
  sell: SideVerdict;
  currentPrice: number;
}

interface ScoredFactor {
  buy: number;
  sell: number;
  text: string;
  side: "buy" | "sell" | "both";
}

function buildSellProfitPreview(
  summary: StockSummary,
  currentPrice: number,
  feeSettings: Partial<ReportSettings>
): SellProfitPreview | undefined {
  if (summary.holdingQty <= 0) return undefined;
  const atNow = estimateSellProfit(summary, currentPrice, feeSettings);
  if (!atNow) return undefined;
  const targetPrice = summary.sellTiming10;
  const atTarget =
    targetPrice && targetPrice > 0 ? estimateSellProfit(summary, targetPrice, feeSettings) : null;
  return { atNow, atTarget };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function roundPrice(n: number) {
  if (n >= 100_000) return Math.round(n / 500) * 500;
  if (n >= 10_000) return Math.round(n / 100) * 100;
  return Math.round(n);
}

/** 매수 구간: 일저가 · 고점 · 최근매도가 · 최근매수가 · 평단 · 목표가 앵커 종합 */
function buildBuyZone(
  summary: StockSummary,
  quote: StockQuote | undefined,
  price: number,
  peakPrice: number | undefined,
  settings: ReturnType<typeof resolveReportSettings>,
  userTargetPrice?: number
) {
  const anchors: number[] = [];

  if (quote?.low && quote.low > 0) anchors.push(quote.low);
  if (quote?.prevClose && quote.prevClose > 0) {
    anchors.push(roundPrice(quote.prevClose * (1 - Math.min(3, Math.abs(quote.changeRate)) / 100)));
    anchors.push(roundPrice(quote.prevClose * 0.98));
  }
  if (peakPrice && peakPrice > 0) {
    anchors.push(roundPrice(peakPrice * (1 - settings.buyDropFromPeakPct / 100)));
  }
  if (summary.lastSellPrice && summary.lastSellPrice > 0) {
    anchors.push(roundPrice(summary.lastSellPrice * (1 - settings.buyTimingPct1 / 100)));
    if (summary.timing10 && summary.timing10 > 0) anchors.push(summary.timing10);
    if (summary.timing20 && summary.timing20 > 0) anchors.push(summary.timing20);
  }
  if (summary.lastBuyPrice && summary.lastBuyPrice > 0) {
    anchors.push(roundPrice(summary.lastBuyPrice * (1 - settings.buyTimingPct1 / 100)));
    anchors.push(roundPrice(summary.lastBuyPrice * 0.97));
  }
  if (summary.holdingQty > 0 && summary.holdingAvgPrice > 0) {
    anchors.push(roundPrice(summary.holdingAvgPrice * 0.97));
  }
  if (userTargetPrice && userTargetPrice > 0 && price > userTargetPrice) {
    anchors.push(roundPrice(userTargetPrice * 0.97));
  }

  const fallbackLow = roundPrice(price * 0.97);
  const zoneMin = anchors.length > 0 ? Math.min(...anchors) : fallbackLow;
  const zoneMax = price;
  const min = Math.min(zoneMin, zoneMax);
  const max = Math.max(zoneMin, zoneMax);

  let suggested: number;
  if (price <= min * 1.01) suggested = price;
  else if (anchors.includes(quote?.low ?? 0)) suggested = roundPrice((price + (quote!.low as number)) / 2);
  else suggested = roundPrice((min + price) / 2);

  return {
    suggested: clamp(suggested, min, max),
    min,
    max,
    anchorCount: anchors.length,
  };
}

/** 매도 구간: 일고가 · 평단·익절선 · 목표가 앵커 종합 */
function buildSellZone(
  summary: StockSummary,
  quote: StockQuote | undefined,
  price: number,
  settings: ReturnType<typeof resolveReportSettings>,
  userTargetPrice?: number
) {
  const anchors: number[] = [];

  if (quote?.high && quote.high > 0) anchors.push(quote.high);
  if (summary.holdingAvgPrice > 0) {
    anchors.push(roundPrice(summary.holdingAvgPrice * (1 + settings.sellGainFromAvgPct / 100)));
    anchors.push(roundPrice(summary.holdingAvgPrice * (1 + settings.sellTimingPct1 / 100)));
    if (summary.sellTiming10 && summary.sellTiming10 > 0) anchors.push(summary.sellTiming10);
    if (summary.sellTiming20 && summary.sellTiming20 > 0) anchors.push(summary.sellTiming20);
  }
  if (summary.holdingAvgPriceWithCost > 0 && summary.holdingAvgPriceWithCost !== summary.holdingAvgPrice) {
    anchors.push(roundPrice(summary.holdingAvgPriceWithCost * (1 + settings.sellGainFromAvgPct / 100)));
  }
  if (userTargetPrice && userTargetPrice > 0) anchors.push(userTargetPrice);
  // 매도 구간은 매수가(평단) 기준 — 최근 매도가는 사용하지 않음

  const fallbackHigh = roundPrice(price * 1.03);
  const zoneMax = anchors.length > 0 ? Math.max(...anchors) : fallbackHigh;
  const zoneMin = price;
  const min = Math.min(zoneMin, zoneMax);
  const max = Math.max(zoneMin, zoneMax);

  let suggested: number;
  if (price >= max * 0.99) suggested = price;
  else if (summary.holdingAvgPrice > 0 && summary.unrealizedPnlPct >= settings.sellGainFromAvgPct) {
    suggested = roundPrice((price + max) / 2);
  } else {
    suggested = roundPrice(summary.holdingAvgPrice > 0
      ? summary.holdingAvgPrice * (1 + settings.sellGainFromAvgPct / 100)
      : (price + max) / 2);
  }

  return {
    suggested: clamp(suggested, min, max),
    min,
    max,
    anchorCount: anchors.length,
  };
}

function mapBuyScore(score: number) {
  if (score >= 28) return { stance: "yes" as const, timing: "now" as VerdictTiming, when: "지금~오늘", headline: "네, 지금 사도 됩니다" };
  if (score >= 16) return { stance: "yes" as const, timing: "this_week" as VerdictTiming, when: "이번 주", headline: "이번 주 나눠서 매수 검토" };
  if (score >= 6) return { stance: "wait" as const, timing: "wait" as VerdictTiming, when: "조금 더", headline: "아직 기다리세요" };
  return { stance: "wait" as const, timing: "wait" as VerdictTiming, when: "관망", headline: "지금은 매수 구간 아님" };
}

function mapSellScore(score: number) {
  if (score >= 28) return { stance: "yes" as const, timing: "now" as VerdictTiming, when: "지금~오늘", headline: "네, 지금 팔아도 됩니다" };
  if (score >= 16) return { stance: "yes" as const, timing: "this_week" as VerdictTiming, when: "이번 주", headline: "이번 주 매도 검토" };
  if (score >= 6) return { stance: "wait" as const, timing: "wait" as VerdictTiming, when: "조금 더", headline: "조금 더 보유" };
  return { stance: "wait" as const, timing: "wait" as VerdictTiming, when: "보유 유지", headline: "지금은 매도 구간 아님" };
}

/** 신뢰도: yes=신호 강도, wait/skip=판단(보유·관망) 신뢰도 — 데이터·앵커 반영 */
function calcConfidence(
  score: number,
  stance: SideVerdict["stance"],
  factorCount: number,
  dataQuality: number,
  anchorCount: number,
  hasQuote: boolean
): number {
  const dataPart = clamp(dataQuality * 38, 0, 38);
  const anchorPart = clamp(anchorCount * 5, 0, 20);
  const factorPart = clamp(factorCount * 6, 0, 22);

  if (stance === "skip") return 0;

  if (stance === "wait") {
    // 매도·관망: 신호는 약하지만 데이터가 충실하면 '보유 유지' 판단 신뢰도는 높을 수 있음
    const weakSignalBonus = clamp(28 - score * 1.1, 10, 28);
    let conf = Math.round(22 + dataPart + anchorPart + Math.min(factorPart, 12) + weakSignalBonus);
    if (!hasQuote) conf = Math.min(conf, 58);
    return clamp(conf, 38, 88);
  }

  const signalPart = clamp(score * 2.4, 0, 50);
  let conf = Math.round(16 + signalPart + dataPart + anchorPart + factorPart);
  if (!hasQuote) conf = Math.min(conf, 52);
  if (factorCount < 2) conf = Math.min(conf, 65);
  return clamp(conf, 30, 96);
}

function assessDataQuality(
  quote: StockQuote | undefined,
  peakPrice: number | undefined,
  stockContext: StockBriefingContext | undefined,
  marketContext: MarketBriefingContext | undefined,
  summary: StockSummary,
  side: "buy" | "sell",
  userTargetPrice?: number,
  stockExtra?: ReturnType<typeof buildStockVerdictExtra>,
  buildCtx?: VerdictBuildContext
): number {
  let q = 0;
  if (quote?.price && quote.price > 0) q += 0.28;
  if (quote?.low && quote?.high) q += 0.12;
  if (quote?.prevClose && quote.prevClose > 0) q += 0.05;
  q += kisDataQualityBoost(quote);
  if (peakPrice && peakPrice > 0) q += 0.15;
  if (stockContext && (stockContext.news.length > 0 || stockContext.disclosures.length > 0)) q += 0.15;
  if (marketContext?.globalIndices.length) q += 0.1;
  if (marketContext?.macroInstruments?.length) q += 0.06;
  if (marketContext?.fxRates?.length) q += 0.04;
  if (marketContext?.fx?.rate) q += 0.05;
  if (marketContext?.officialIndicators?.length) q += 0.08;
  if (marketContext?.marketInvestorFlows?.length) q += 0.05;
  if (summary.lastSellPrice) q += 0.1;
  if (summary.lastBuyPrice) q += 0.05;
  if (userTargetPrice && userTargetPrice > 0) q += 0.08;
  if (side === "sell" && summary.holdingQty > 0 && summary.holdingAvgPrice > 0) q += 0.2;
  if (summary.buyAmount > 0) q += 0.05;
  if (stockExtra) q += extraDataQualityBoost(stockExtra, marketContext, buildCtx);
  return clamp(q, 0, 1);
}

export function buildStockTradingVerdict(
  summary: StockSummary,
  quote: StockQuote | undefined,
  settings: Partial<ReportSettings> | undefined,
  stockContext: StockBriefingContext | undefined,
  marketContext: MarketBriefingContext | undefined,
  kospi: KospiBenchmark | undefined,
  peakPrice?: number,
  userTargetPrice?: number,
  buildCtx?: VerdictBuildContext
): StockTradingVerdict {
  const resolved = resolveReportSettings(settings);
  const price = quote?.price ?? summary.currentPrice;
  const buySignal = getBuyTimingSignal(summary, settings);
  const sellSignal = getSellTimingSignal(summary, settings);
  const gateCtx = buildVerdictGateContext(summary, quote, buySignal, sellSignal, kospi, marketContext);
  const stockExtra = buildStockVerdictExtra(summary.stockId, summary, buildCtx);
  const factors: ScoredFactor[] = [];
  let buyScore = 0;
  let sellScore = 0;

  if (peakPrice != null && peakPrice > 0 && price > 0) {
    const drop = ((peakPrice - price) / peakPrice) * 100;
    if (drop >= resolved.buyDropFromPeakPct) {
      buyScore += 22;
      factors.push({ buy: 22, sell: 0, text: `고점 ${fmt(peakPrice)} 대비 −${drop.toFixed(1)}%`, side: "buy" });
    } else if (drop >= resolved.buyDropFromPeakPct * 0.55) {
      buyScore += 9;
      factors.push({ buy: 9, sell: 0, text: `고점 대비 −${drop.toFixed(1)}% (관심)`, side: "buy" });
    }
  }

  if (quote) {
    if (quote.changeRate <= -2.5) {
      const delta = gateCtx.inBuyZone ? 12 : 2;
      buyScore += delta;
      if (delta >= 8) {
        factors.push({ buy: delta, sell: 0, text: `전일比 ${fmtPct(quote.changeRate)} (급락)`, side: "buy" });
      }
    } else if (quote.changeRate <= -1) {
      const delta = gateCtx.inBuyZone ? 5 : 1;
      buyScore += delta;
      if (delta >= 4) {
        factors.push({ buy: delta, sell: 0, text: `전일比 ${fmtPct(quote.changeRate)}`, side: "buy" });
      }
    }
    if (quote.changeRate >= 3 && summary.holdingQty > 0) {
      sellScore += 12;
      factors.push({ buy: 0, sell: 12, text: `전일比 +${quote.changeRate.toFixed(1)}% (급등)`, side: "sell" });
    } else if (quote.changeRate >= 1.5 && summary.holdingQty > 0) {
      sellScore += 5;
      factors.push({ buy: 0, sell: 5, text: `전일比 +${quote.changeRate.toFixed(1)}%`, side: "sell" });
    }
    if (quote.low > 0 && price <= quote.low * 1.005) {
      const delta = gateCtx.inBuyZone ? 8 : 3;
      buyScore += delta;
      if (delta >= 6) {
        factors.push({ buy: delta, sell: 0, text: `당일 저가 ${fmt(quote.low)} 부근`, side: "buy" });
      }
    }
    if (quote.high > 0 && price >= quote.high * 0.995 && summary.holdingQty > 0) {
      sellScore += 7;
      factors.push({ buy: 0, sell: 7, text: `당일 고가 ${fmt(quote.high)} 부근`, side: "sell" });
    }
    if (quote.prevClose > 0 && price <= quote.prevClose * 1.002 && price >= quote.prevClose * 0.985) {
      buyScore += 4;
      factors.push({ buy: 4, sell: 0, text: `전일 종가 ${fmt(quote.prevClose)} 지지`, side: "buy" });
    }
  }

  if (summary.lastSellPrice && summary.lastSellPrice > 0 && price > 0) {
    const vsLastSell = ((price - summary.lastSellPrice) / summary.lastSellPrice) * 100;
    if (vsLastSell <= -resolved.buyTimingPct1) {
      buyScore += 14;
      factors.push({
        buy: 14,
        sell: 0,
        text: `최근 매도가 ${fmt(summary.lastSellPrice)} 대비 ${fmtPct(vsLastSell)}`,
        side: "buy",
      });
    }
  }

  if (summary.lastBuyPrice && summary.lastBuyPrice > 0 && price > 0) {
    const vsLastBuy = ((price - summary.lastBuyPrice) / summary.lastBuyPrice) * 100;
    if (vsLastBuy <= -resolved.buyTimingPct1) {
      buyScore += 10;
      factors.push({
        buy: 10,
        sell: 0,
        text: `최근 매수가 ${fmt(summary.lastBuyPrice)} 대비 ${fmtPct(vsLastBuy)}`,
        side: "buy",
      });
    } else if (vsLastBuy <= -5) {
      buyScore += 4;
      factors.push({
        buy: 4,
        sell: 0,
        text: `최근 매수가 대비 ${fmtPct(vsLastBuy)} (추가매수 검토)`,
        side: "buy",
      });
    }
  }

  if (resolved.useTimingPctLines && summary.timing20 && price > 0 && price <= summary.timing20) {
    buyScore += 8;
    factors.push({
      buy: 8,
      sell: 0,
      text: `2단계 목표 ${fmt(summary.timing20)} 이하`,
      side: "buy",
    });
  }

  if (userTargetPrice && userTargetPrice > 0 && price > 0) {
    const vsTarget = ((price - userTargetPrice) / userTargetPrice) * 100;
    if (summary.holdingQty > 0 && vsTarget >= -1) {
      sellScore += vsTarget >= 0 ? 12 : 6;
      factors.push({
        buy: 0,
        sell: vsTarget >= 0 ? 12 : 6,
        text: `목표가 ${fmt(userTargetPrice)} ${vsTarget >= 0 ? "도달" : "근접"} (${fmtPct(vsTarget)})`,
        side: "sell",
      });
    } else if (vsTarget <= -5) {
      buyScore += 5;
      factors.push({
        buy: 5,
        sell: 0,
        text: `목표가 ${fmt(userTargetPrice)} 대비 ${fmtPct(vsTarget)} (저가)`,
        side: "buy",
      });
    }
  }

  if (summary.holdingQty > 0) {
    const costMerge = mergeCostGainSignal(
      price,
      summary,
      resolved.sellGainFromAvgPct,
      sellScore,
      buyScore
    );

    if (costMerge.skipPlainUnrealized) {
      buyScore += costMerge.buyDelta;
      sellScore += costMerge.sellDelta;
      if (costMerge.text && (costMerge.buyDelta > 0 || costMerge.sellDelta > 0)) {
        factors.push({
          buy: costMerge.buyDelta,
          sell: costMerge.sellDelta,
          text: costMerge.text,
          side: costMerge.sellDelta > 0 ? "sell" : "buy",
        });
      }
    } else if (summary.unrealizedPnlPct >= resolved.sellGainFromAvgPct) {
      sellScore += 24;
      factors.push({
        buy: 0,
        sell: 24,
        text: `평단 ${fmt(summary.holdingAvgPrice)} 대비 ${fmtPct(summary.unrealizedPnlPct)} (이익 구간)`,
        side: "sell",
      });
    } else if (summary.unrealizedPnlPct <= -8) {
      buyScore += 6;
      factors.push({
        buy: 6,
        sell: 0,
        text: `평단比 ${fmtPct(summary.unrealizedPnlPct)} (추가 매수 검토)`,
        side: "buy",
      });
    } else if (summary.unrealizedPnlPct > 0) {
      sellScore += 3;
    }

    if (resolved.useTimingPctLines && summary.sellTiming20 && price >= summary.sellTiming20) {
      sellScore += 10;
      factors.push({
        buy: 0,
        sell: 10,
        text: `2단계 목표 ${fmt(summary.sellTiming20)} 이상`,
        side: "sell",
      });
    } else if (resolved.useTimingPctLines && summary.sellTiming10 && price >= summary.sellTiming10) {
      sellScore += 6;
      factors.push({
        buy: 0,
        sell: 6,
        text: `1단계 목표 ${fmt(summary.sellTiming10)} 이상`,
        side: "sell",
      });
    }
  }

  if (kospi && quote) {
    const alpha = quote.changeRate - kospi.changeRate;
    if (alpha <= -2) {
      buyScore += 8;
      factors.push({ buy: 8, sell: 0, text: `KOSPI 대비 ${alpha.toFixed(1)}%p`, side: "buy" });
    }
    if (alpha >= 2 && summary.holdingQty > 0) {
      sellScore += 6;
      factors.push({ buy: 0, sell: 6, text: `KOSPI 대비 +${alpha.toFixed(1)}%p`, side: "sell" });
    }
  }

  if (marketContext?.globalIndices.length) {
    const risk = summarizeGlobalRisk(
      marketContext.globalIndices,
      marketContext.macroInstruments,
      marketContext.fxRates
    );
    if (risk.score <= -0.3) {
      if (gateCtx.inBuyZone) {
        buyScore += 4;
        factors.push({ buy: 4, sell: 0, text: `글로벌: ${risk.note}`, side: "buy" });
      } else if (gateCtx.fallingKnife || gateCtx.marketDown) {
        buyScore -= 5;
        factors.push({ buy: 0, sell: 0, text: `글로벌 약세 — ${summary.timing10 ? fmt(summary.timing10) : "—"} 이하까지 대기`, side: "both" });
      }
    }
    if (risk.score >= 0.3 && summary.holdingQty > 0) {
      sellScore += 5;
      factors.push({ buy: 0, sell: 5, text: `글로벌: ${risk.note}`, side: "sell" });
    }
  }

  if (marketContext?.officialIndicators?.length) {
    const official = summarizeOfficialMacro(marketContext.officialIndicators);
    if (official.score <= -0.2) {
      if (gateCtx.inBuyZone) {
        buyScore += 3;
        factors.push({ buy: 3, sell: 0, text: `공식 지표: ${official.note}`, side: "buy" });
      } else if (gateCtx.marketDown) {
        buyScore -= 3;
      }
    }
    if (official.score >= 0.2 && summary.holdingQty > 0) {
      sellScore += 4;
      factors.push({ buy: 0, sell: 4, text: `공식 지표: ${official.note}`, side: "sell" });
    }
  }

  if (marketContext?.marketInvestorFlows?.length) {
    const flow = summarizeMarketInvestorFlow(marketContext.marketInvestorFlows);
    if (flow.note) {
      if (flow.score >= 0.25) {
        buyScore += 5;
        factors.push({ buy: 5, sell: 0, text: `시장 수급: ${flow.note}`, side: "buy" });
      } else if (flow.score <= -0.25 && summary.holdingQty > 0) {
        sellScore += 5;
        factors.push({ buy: 0, sell: 5, text: `시장 수급: ${flow.note}`, side: "sell" });
      } else if (Math.abs(flow.score) >= 0.15) {
        factors.push({
          buy: flow.score > 0 ? 2 : 0,
          sell: flow.score < 0 ? 2 : 0,
          text: `시장 수급: ${flow.note}`,
          side: flow.score > 0 ? "buy" : "sell",
        });
        if (flow.score > 0) buyScore += 2;
        else sellScore += 2;
      }
    }
  }

  if (stockContext) {
    if (stockContext.sentimentScore >= 0.25) {
      buyScore += 10;
      factors.push({ buy: 10, sell: 0, text: `뉴스·공시 ${stockContext.sentimentLabel}`, side: "buy" });
    } else if (stockContext.sentimentScore <= -0.25) {
      sellScore += 10;
      factors.push({ buy: 0, sell: 10, text: `뉴스·공시 ${stockContext.sentimentLabel}`, side: "sell" });
    }
  }

  const kisFx = applyKisMarketFactors(quote, summary.holdingQty);
  buyScore += kisFx.buyDelta;
  sellScore += kisFx.sellDelta;
  for (const kf of kisFx.factors) {
    factors.push(kf);
  }

  const extra = applyExtraVerdictFactors(summary, marketContext, stockExtra, buildCtx);
  buyScore += extra.buyDelta;
  sellScore += extra.sellDelta;
  for (const ef of extra.factors) {
    factors.push({
      buy: ef.buy,
      sell: ef.sell,
      text: ef.text,
      side: ef.sell > ef.buy ? "sell" : "buy",
    });
  }

  const buyFactors = factors.filter((f) => f.buy > 0);
  const sellFactors = factors.filter((f) => f.sell > 0);

  const hasStructuralBuy =
    gateCtx.inBuyZone ||
    factors.some(
      (f) =>
        f.buy > 0 &&
        (f.text.includes("고점") ||
          f.text.includes("목표") ||
          f.text.includes("매도가") ||
          f.text.includes("2단계") ||
          f.text.includes("최근 매수가"))
    );

  const effectiveBuyScore = applyBuyScoreGates(buyScore, gateCtx, hasStructuralBuy);

  const buyMap = mapBuyVerdict(
    effectiveBuyScore,
    gateCtx,
    !!summary.timing10,
    buySignal.status === "zone20" ? "zone20" : buySignal.status === "zone10" ? "zone10" : buySignal.status
  );
  const buyZoneRaw = buildBuyZone(summary, quote, price, peakPrice, resolved, userTargetPrice);
  const buyZone = refineBuyPrices(buyZoneRaw, gateCtx, price, roundPrice);
  const buyDataQ = assessDataQuality(
    quote,
    peakPrice,
    stockContext,
    marketContext,
    summary,
    "buy",
    userTargetPrice,
    stockExtra,
    buildCtx
  );

  const buyReasons = buyFactors.slice(0, 3).map((f) => f.text);
  if (gateCtx.fallingKnife || (gateCtx.aboveBuyLine && gateCtx.marketDown)) {
    buyReasons.unshift(
      summary.timing10
        ? `목표 ${fmt(summary.timing10)}${summary.timing20 ? ` · 더 싸게 ${fmt(summary.timing20)}` : ""} — 지금은 비쌈`
        : "하락장 — 가격 내려올 때까지 대기"
    );
  }
  if (gateCtx.breadthBearish) {
    buyReasons.push("코스피 하락 종목 많음 — 서두르지 말고 나눠서");
  }
  buyReasons.unshift(`주문가 · ${buyZone.limitHint}`);
  for (const note of extra.neutralNotes.slice(0, 2)) {
    if (buyReasons.length < 5) buyReasons.push(note);
  }
  if (stockContext?.disclosures[0]) {
    const t = stockContext.disclosures[0].title;
    buyReasons.push(`최근 공시: ${t.length > 42 ? `${t.slice(0, 42)}…` : t}`);
  }
  if (buyZoneRaw.anchorCount > 0 && buyZone.min < buyZone.max) {
    if (summary.timing10) {
      buyReasons.push(`1단계 목표 ${fmt(summary.timing10)} (최근 매도가 −${resolved.buyTimingPct1}%)`);
    }
    buyReasons.push(`구간 ${buyZoneRaw.anchorCount}개 기준 · 일저가 ${quote?.low ? fmt(quote.low) : "—"}`);
  }

  let sell: SideVerdict;
  if (summary.holdingQty <= 0) {
    const sz = buildSellZone(summary, quote, price, resolved, userTargetPrice);
    sell = {
      stance: "skip",
      timing: "skip",
      headline: "보유 종목 없음",
      when: "—",
      targetPrice: sz.suggested,
      priceRange: { min: sz.min, max: sz.max },
      confidence: 0,
      dataQuality: 0,
      reasons: ["매도 판단은 보유 중일 때 표시됩니다"],
    };
  } else {
    const sellMap = mapSellVerdict(sellScore, gateCtx, summary.holdingQty);
    const sellZoneRaw = buildSellZone(summary, quote, price, resolved, userTargetPrice);
    const sellZone = refineSellPrices(sellZoneRaw, gateCtx, price, roundPrice);
    const sellDataQ = assessDataQuality(
      quote,
      peakPrice,
      stockContext,
      marketContext,
      summary,
      "sell",
      userTargetPrice,
      stockExtra,
      buildCtx
    );
    const sellReasons = sellFactors.slice(0, 4).map((f) => f.text);
    sellReasons.unshift(`주문가 · ${sellZone.limitHint}`);
    for (const note of extra.neutralNotes.slice(0, 2)) {
      if (sellReasons.length < 5) sellReasons.push(note);
    }
    if (stockContext?.disclosures[0]) {
      const t = stockContext.disclosures[0].title;
      sellReasons.push(`최근 공시: ${t.length > 42 ? `${t.slice(0, 42)}…` : t}`);
    }
    if (sellZoneRaw.anchorCount > 0 && sellZone.min < sellZone.max) {
      sellReasons.unshift(`현재 ${fmt(price)} · 보유 ${summary.holdingQty}주`);
      if (summary.sellTiming10) {
        sellReasons.push(`1단계 목표 ${fmt(summary.sellTiming10)} (평단 +${resolved.sellTimingPct1}%)`);
      }
      sellReasons.push(`기준 평단 ${fmt(summary.holdingAvgPrice)} · 보유 ${summary.holdingQty}주`);
    }
    sell = {
      ...sellMap,
      targetPrice: sellZone.suggested,
      priceRange: { min: sellZone.min, max: sellZone.max },
      sellProfitPreview: buildSellProfitPreview(summary, price, resolved),
      confidence: calcConfidence(
        sellScore,
        sellMap.stance,
        sellFactors.length,
        sellDataQ,
        sellZoneRaw.anchorCount,
        !!quote
      ),
      dataQuality: sellDataQ,
      reasons: sellReasons.length ? sellReasons.slice(0, 5) : ["특별한 매도 신호 없음 — 보유 유지"],
    };
  }

  return {
    stockId: summary.stockId,
    stockName: summary.stockName,
    currentPrice: price,
    buy: {
      ...buyMap,
      targetPrice: buyZone.suggested,
      priceRange: { min: buyZone.min, max: buyZone.max },
      confidence: calcConfidence(
        effectiveBuyScore,
        buyMap.stance,
        buyFactors.length,
        buyDataQ,
        buyZoneRaw.anchorCount,
        !!quote
      ),
      dataQuality: buyDataQ,
      reasons: buyReasons.length ? buyReasons : ["시세·매매 기록을 불러오는 중"],
    },
    sell,
  };
}

export function buildAllTradingVerdicts(
  summaries: Record<string, StockSummary>,
  quotes: Record<string, StockQuote> | undefined,
  settings: Partial<ReportSettings> | undefined,
  marketContext: MarketBriefingContext | undefined,
  kospi: KospiBenchmark | undefined,
  peakPrices?: Record<string, number>,
  buildCtx?: VerdictBuildContext
): StockTradingVerdict[] {
  const ctxMap = new Map(marketContext?.stocks.map((s) => [s.stockId, s]) ?? []);
  const resolved = resolveReportSettings(settings);
  const targets = resolved.targetPrices ?? {};
  return Object.values(summaries).map((summary) =>
    buildStockTradingVerdict(
      summary,
      quotes?.[summary.stockId],
      settings,
      ctxMap.get(summary.stockId),
      marketContext,
      kospi,
      peakPrices?.[summary.stockId],
      targets[summary.stockId],
      buildCtx
    )
  );
}
