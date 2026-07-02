/**
 * 판단 보조 — 스냅샷·이벤트·시장뉴스·환율·비용포함손익·실현성과
 * 기존 시그널과 중복 시 더 강한 쪽만 반영 (최적화)
 */

import type { DailySnapshot, StockEvent, StockSummary } from "../types";
import type { FxSnapshot, MarketBriefingContext } from "./types";
import { fmtPct } from "../calc";
import { scoreSentiment } from "./providers/rss";

export interface VerdictBuildContext {
  dailySnapshots?: DailySnapshot[];
  stockEvents?: StockEvent[];
  portfolioReturnChange?: number | null;
}

export interface StockVerdictExtra {
  snapshotTrendPct: number | null;
  snapshotSpanDays: number;
  gainFromCostPct: number | null;
  returnRate: number;
  netProfit: number;
  recentEventNotes: string[];
}

interface ExtraFactor {
  buy: number;
  sell: number;
  text: string;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** 최근 N일 스냅샷 기준 가격 추세 */
export function calcSnapshotTrend(
  stockId: string,
  currentPrice: number,
  snapshots?: DailySnapshot[],
  maxPoints = 7
): { pct: number | null; spanDays: number } {
  const list = [...(snapshots ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, maxPoints);
  if (list.length < 2 || currentPrice <= 0) return { pct: null, spanDays: 0 };

  const oldest = list[list.length - 1];
  const oldPrice = oldest.stockPrices[stockId];
  if (!oldPrice || oldPrice <= 0) return { pct: null, spanDays: 0 };

  const ms = new Date(list[0].date).getTime() - new Date(oldest.date).getTime();
  const spanDays = Math.max(1, Math.round(ms / 86_400_000));

  return {
    pct: ((currentPrice - oldPrice) / oldPrice) * 100,
    spanDays,
  };
}

export function buildStockVerdictExtra(
  stockId: string,
  summary: StockSummary,
  ctx: VerdictBuildContext | undefined
): StockVerdictExtra {
  const { pct, spanDays } = calcSnapshotTrend(stockId, summary.currentPrice, ctx?.dailySnapshots);

  const gainFromCostPct =
    summary.holdingQty > 0 && summary.holdingAvgPriceWithCost > 0
      ? ((summary.currentPrice - summary.holdingAvgPriceWithCost) / summary.holdingAvgPriceWithCost) * 100
      : null;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recentEventNotes: string[] = [];
  for (const ev of ctx?.stockEvents ?? []) {
    if (ev.stockId !== stockId || ev.date < cutoffStr) continue;
    if (ev.type === "split" && ev.ratio) {
      recentEventNotes.push(`${ev.date} ${ev.ratio}:1 분할`);
    } else if (ev.type === "dividend" && ev.amount) {
      recentEventNotes.push(`${ev.date} 배당 ${ev.amount.toLocaleString()}원/주`);
    }
  }

  return {
    snapshotTrendPct: pct,
    snapshotSpanDays: spanDays,
    gainFromCostPct,
    returnRate: summary.returnRate,
    netProfit: summary.netProfit,
    recentEventNotes,
  };
}

function scoreMarketNews(marketContext: MarketBriefingContext | undefined) {
  const headlines = [
    ...(marketContext?.marketNews ?? []).slice(0, 8),
    ...(marketContext?.macroNews ?? []).slice(0, 8),
  ].map((n) => n.title);
  if (!headlines.length) return null;
  return scoreSentiment(headlines);
}

function scoreFx(
  fx: FxSnapshot | null | undefined,
  fxRates?: FxSnapshot[]
): { buy: number; sell: number; note: string | null } {
  const usd = fx ?? fxRates?.find((f) => f.pair === "USD/KRW");
  if (!usd?.rate || usd.rate <= 0) return { buy: 0, sell: 0, note: null };

  let buy = 0;
  let sell = 0;
  const notes: string[] = [];

  if (usd.changeRate >= 0.4) {
    sell += 3;
    notes.push(`${usd.pair} +${usd.changeRate.toFixed(2)}% (원약세)`);
  } else if (usd.changeRate <= -0.4) {
    buy += 2;
    notes.push(`${usd.pair} ${usd.changeRate.toFixed(2)}% (원강세)`);
  }

  if (usd.rate >= 1380) {
    buy += 3;
    notes.push(`${usd.pair} ${Math.round(usd.rate).toLocaleString()} (고환율)`);
  } else if (usd.rate <= 1280) {
    sell += 2;
    notes.push(`${usd.pair} ${Math.round(usd.rate).toLocaleString()} (저환율)`);
  }

  const jpy = fxRates?.find((f) => f.pair === "JPY/KRW");
  if (jpy && jpy.changeRate >= 0.6) {
    sell += 1;
    notes.push(`JPY/KRW +${jpy.changeRate.toFixed(2)}%`);
  }

  const cny = fxRates?.find((f) => f.pair === "CNY/KRW");
  if (cny && cny.changeRate <= -0.5) {
    sell += 1;
    notes.push(`CNY/KRW ${cny.changeRate.toFixed(2)}%`);
  }

  return { buy, sell, note: notes.length ? notes.join(" · ") : null };
}

/** 비용 포함·순 평단 대비 익절 — 기존 unrealizedPnlPct와 중복 시 더 강한 신호만 */
export function mergeCostGainSignal(
  price: number,
  summary: StockSummary,
  sellThresholdPct: number,
  existingSellScore: number,
  existingBuyScore: number
): { buyDelta: number; sellDelta: number; text: string | null; skipPlainUnrealized: boolean } {
  if (summary.holdingQty <= 0 || !summary.holdingAvgPriceWithCost) {
    return { buyDelta: 0, sellDelta: 0, text: null, skipPlainUnrealized: false };
  }

  const costPct = ((price - summary.holdingAvgPriceWithCost) / summary.holdingAvgPriceWithCost) * 100;
  const plainPct = summary.unrealizedPnlPct;
  const useCost = Math.abs(costPct) >= Math.abs(plainPct) || Math.abs(costPct - plainPct) > 0.5;

  if (!useCost) return { buyDelta: 0, sellDelta: 0, text: null, skipPlainUnrealized: false };

  if (costPct >= sellThresholdPct) {
    const extra = existingSellScore >= 20 ? 4 : 10;
    return {
      buyDelta: 0,
      sellDelta: extra,
      text: `비용포함 평단比 ${fmtPct(costPct)} (이익 구간)`,
      skipPlainUnrealized: true,
    };
  }
  if (costPct <= -8 && existingBuyScore < 14) {
    return {
      buyDelta: 4,
      sellDelta: 0,
      text: `비용포함 평단比 ${fmtPct(costPct)} (나눠서 매도 검토)`,
      skipPlainUnrealized: true,
    };
  }
  return { buyDelta: 0, sellDelta: 0, text: null, skipPlainUnrealized: false };
}

export function applyExtraVerdictFactors(
  summary: StockSummary,
  marketContext: MarketBriefingContext | undefined,
  stockExtra: StockVerdictExtra,
  buildCtx: VerdictBuildContext | undefined
): { buyDelta: number; sellDelta: number; factors: ExtraFactor[]; neutralNotes: string[] } {
  const factors: ExtraFactor[] = [];
  const neutralNotes: string[] = [];
  let buyDelta = 0;
  let sellDelta = 0;

  if (stockExtra.snapshotTrendPct != null && summary.currentPrice > 0) {
    const t = stockExtra.snapshotTrendPct;
    const days = stockExtra.snapshotSpanDays;
    if (t <= -5) {
      buyDelta += 6;
      factors.push({
        buy: 6,
        sell: 0,
        text: `최근 ${days}일 추세 ${fmtPct(t)} (저점권)`,
      });
    } else if (t >= 8 && summary.holdingQty > 0) {
      sellDelta += 5;
      factors.push({
        buy: 0,
        sell: 5,
        text: `최근 ${days}일 추세 +${t.toFixed(1)}% (고점권)`,
      });
    } else if (Math.abs(t) >= 3) {
      neutralNotes.push(`최근 ${days}일 추세 ${t >= 0 ? "+" : ""}${t.toFixed(1)}%`);
    }
  }

  if (summary.holdingQty > 0 && summary.returnRate >= 12 && summary.netProfit > 0) {
    sellDelta += 3;
    factors.push({
      buy: 0,
      sell: 3,
      text: `누적 실현수익률 ${fmtPct(summary.returnRate)} (매도 여력)`,
    });
  }

  if (stockExtra.recentEventNotes.length > 0) {
    const note = stockExtra.recentEventNotes[0];
    if (note.includes("분할")) {
      buyDelta += 2;
      factors.push({ buy: 2, sell: 0, text: `기업이벤트: ${note}` });
    } else if (note.includes("배당")) {
      neutralNotes.push(`기업이벤트: ${note}`);
    }
  }

  const marketSent = scoreMarketNews(marketContext);
  if (marketSent) {
    if (marketSent.score >= 0.35) {
      buyDelta += 5;
      factors.push({ buy: 5, sell: 0, text: `시장 뉴스 ${marketSent.label}` });
    } else if (marketSent.score <= -0.35) {
      sellDelta += 4;
      factors.push({ buy: 0, sell: 4, text: `시장 뉴스 ${marketSent.label}` });
    }
  }

  const fx = scoreFx(marketContext?.fx ?? null, marketContext?.fxRates);
  if (fx.note) {
    buyDelta += fx.buy;
    sellDelta += fx.sell;
    if (fx.buy > 0 || fx.sell > 0) {
      factors.push({ buy: fx.buy, sell: fx.sell, text: fx.note });
    }
  }

  if (buildCtx?.portfolioReturnChange != null && Math.abs(buildCtx.portfolioReturnChange) >= 0.5) {
    const ch = buildCtx.portfolioReturnChange;
    if (ch <= -1 && summary.holdingQty > 0) {
      sellDelta += 2;
      factors.push({ buy: 0, sell: 2, text: `포트폴리오 수익률 ${ch >= 0 ? "+" : ""}${ch.toFixed(1)}%p (리스크 관리)` });
    } else if (ch >= 1) {
      buyDelta += 2;
      factors.push({ buy: 2, sell: 0, text: `포트폴리오 수익률 +${ch.toFixed(1)}%p (여유)` });
    }
  }

  return {
    buyDelta: clamp(buyDelta, 0, 18),
    sellDelta: clamp(sellDelta, 0, 18),
    factors,
    neutralNotes,
  };
}

export function extraDataQualityBoost(
  stockExtra: StockVerdictExtra,
  marketContext: MarketBriefingContext | undefined,
  buildCtx: VerdictBuildContext | undefined
): number {
  let q = 0;
  if (stockExtra.snapshotTrendPct != null) q += 0.06;
  if (stockExtra.gainFromCostPct != null) q += 0.05;
  if (stockExtra.recentEventNotes.length) q += 0.04;
  if (marketContext?.marketNews.length || marketContext?.macroNews?.length) q += 0.06;
  if (marketContext?.fxRates?.length) q += 0.03;
  if (buildCtx?.dailySnapshots && buildCtx.dailySnapshots.length >= 3) q += 0.04;
  return q;
}
