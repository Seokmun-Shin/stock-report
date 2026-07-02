/**
 * 매매 추천 — 판단 탭(`tradingVerdict`)과 동일 엔진 기반
 * 기록·원천 탭 prefill / 통합 추천 표시용
 */

import type { BuyTimingSignal, KospiBenchmark, SellTimingSignal, StockQuote, StockSummary } from "../types";
import type { ReportSettings } from "../reportSettings";
import { resolveReportSettings } from "../reportSettings";
import { fmt } from "../calc";
import type { MarketBriefingContext, StockBriefingContext, TradeRecommendation, TradeUrgency } from "./types";
import type { TradeSuggestion } from "./tradeSuggestions";
import { buildTradeSuggestion } from "./tradeSuggestions";
import {
  buildStockTradingVerdict,
  type SideVerdict,
  type StockTradingVerdict,
  type VerdictBuildContext,
  type VerdictTiming,
} from "./tradingVerdict";

function urgencyLabel(u: TradeUrgency): string {
  if (u === "now") return "지금~오늘";
  if (u === "this_week") return "이번 주";
  return "관망·대기";
}

function timingToUrgency(timing: VerdictTiming): TradeUrgency {
  if (timing === "now") return "now";
  if (timing === "this_week") return "this_week";
  return "wait";
}

function pickAction(buy: SideVerdict, sell: SideVerdict): TradeRecommendation["action"] {
  if (buy.stance === "yes" && sell.stance !== "yes") return "buy";
  if (sell.stance === "yes" && buy.stance !== "yes") return "sell";
  if (buy.stance === "yes" && sell.stance === "yes") {
    return sell.confidence >= buy.confidence ? "sell" : "buy";
  }
  return "hold";
}

function reasonImpact(text: string, action: TradeRecommendation["action"], side: "buy" | "sell"): "positive" | "negative" | "neutral" {
  if (action === "hold") return "neutral";
  if (action === side) return "positive";
  if (action === "buy" && side === "sell") return "negative";
  if (action === "sell" && side === "buy") return "negative";
  return "neutral";
}

function verdictToFactors(verdict: StockTradingVerdict, action: TradeRecommendation["action"]): TradeRecommendation["factors"] {
  const factors: TradeRecommendation["factors"] = [
    {
      source: "매수 판단",
      text: verdict.buy.headline,
      impact: reasonImpact(verdict.buy.headline, action, "buy"),
    },
    {
      source: "매도 판단",
      text: verdict.sell.headline,
      impact: reasonImpact(verdict.sell.headline, action, "sell"),
    },
  ];

  for (const r of verdict.buy.reasons.slice(0, 4)) {
    factors.push({ source: "매수", text: r, impact: reasonImpact(r, action, "buy") });
  }
  for (const r of verdict.sell.reasons.slice(0, 4)) {
    factors.push({ source: "매도", text: r, impact: reasonImpact(r, action, "sell") });
  }

  return factors;
}

function resolveVerdict(
  summary: StockSummary,
  quote: StockQuote | undefined,
  settings: Partial<ReportSettings> | undefined,
  stockContext: StockBriefingContext | undefined,
  marketContext: MarketBriefingContext | null | undefined,
  kospi: KospiBenchmark | undefined,
  peakPrice?: number,
  userTargetPrice?: number,
  buildCtx?: VerdictBuildContext,
  precomputed?: StockTradingVerdict | null
): StockTradingVerdict {
  if (precomputed && precomputed.stockId === summary.stockId) return precomputed;
  return buildStockTradingVerdict(
    summary,
    quote,
    settings,
    stockContext,
    marketContext,
    kospi,
    peakPrice,
    userTargetPrice,
    buildCtx
  );
}

export function buildTradeRecommendation(
  summary: StockSummary,
  buySignal: BuyTimingSignal,
  sellSignal: SellTimingSignal,
  quote: StockQuote | undefined,
  settings: Partial<ReportSettings> | undefined,
  stockContext: StockBriefingContext | undefined,
  marketContext: MarketBriefingContext | null | undefined,
  kospi: KospiBenchmark | undefined,
  peakPrice?: number,
  options?: {
    userTargetPrice?: number;
    buildCtx?: VerdictBuildContext;
    verdict?: StockTradingVerdict | null;
  }
): TradeRecommendation {
  void buySignal;
  void sellSignal;

  const resolved = resolveReportSettings(settings);
  const userTarget = options?.userTargetPrice ?? resolved.targetPrices?.[summary.stockId];
  const verdict = resolveVerdict(
    summary,
    quote,
    settings,
    stockContext,
    marketContext,
    kospi,
    peakPrice,
    userTarget,
    options?.buildCtx,
    options?.verdict
  );

  const action = pickAction(verdict.buy, verdict.sell);
  const activeSide = action === "buy" ? verdict.buy : action === "sell" ? verdict.sell : null;
  const urgency = activeSide ? timingToUrgency(activeSide.timing) : ("wait" as TradeUrgency);
  const suggested = activeSide?.targetPrice ?? verdict.currentPrice;
  const priceRange = activeSide?.priceRange ?? {
    min: Math.round(verdict.currentPrice * 0.98),
    max: Math.round(verdict.currentPrice * 1.02),
  };
  const confidence = activeSide?.confidence ?? Math.max(verdict.buy.confidence, verdict.sell.confidence);

  const actionKo = action === "buy" ? "매수" : action === "sell" ? "매도" : "관망";
  const summaryText = `${summary.stockName}: ${actionKo} · ${urgencyLabel(urgency)} · ${fmt(suggested)} (${fmt(priceRange.min)}~${fmt(priceRange.max)})`;
  const factors = verdictToFactors(verdict, action);
  const timingNote =
    activeSide?.reasons[0] ??
    (action === "hold" ? `${verdict.buy.headline} / ${verdict.sell.headline}` : activeSide?.headline ?? "판단 탭과 동일");

  return {
    stockId: summary.stockId,
    stockName: summary.stockName,
    action,
    urgency,
    suggestedPrice: suggested,
    priceRange,
    confidence,
    summary: summaryText,
    factors,
    timingNote,
  };
}

export function buildFullTradeAdvice(
  summary: StockSummary,
  buySignal: BuyTimingSignal,
  sellSignal: SellTimingSignal,
  quote: StockQuote | undefined,
  settings: Partial<ReportSettings> | undefined,
  stockContext: StockBriefingContext | undefined,
  marketContext: MarketBriefingContext | null | undefined,
  kospi: KospiBenchmark | undefined,
  peakPrice?: number,
  options?: {
    userTargetPrice?: number;
    buildCtx?: VerdictBuildContext;
    verdict?: StockTradingVerdict | null;
  }
): { recommendation: TradeRecommendation; suggestion: TradeSuggestion; verdict: StockTradingVerdict } {
  const resolved = resolveReportSettings(settings);
  const userTarget = options?.userTargetPrice ?? resolved.targetPrices?.[summary.stockId];
  const verdict = resolveVerdict(
    summary,
    quote,
    settings,
    stockContext,
    marketContext,
    kospi,
    peakPrice,
    userTarget,
    options?.buildCtx,
    options?.verdict
  );

  const recommendation = buildTradeRecommendation(
    summary,
    buySignal,
    sellSignal,
    quote,
    settings,
    stockContext,
    marketContext,
    kospi,
    peakPrice,
    { userTargetPrice: userTarget, buildCtx: options?.buildCtx, verdict }
  );

  const preferType =
    recommendation.action === "sell" ? "sell" : recommendation.action === "buy" ? "buy" : undefined;

  const suggestion = buildTradeSuggestion(
    summary,
    quote,
    buySignal,
    sellSignal,
    settings,
    preferType,
    recommendation,
    verdict
  );

  return { recommendation, suggestion, verdict };
}

export function buildAllRecommendations(
  summaries: Record<string, StockSummary>,
  buySignals: Record<string, BuyTimingSignal>,
  sellSignals: Record<string, SellTimingSignal>,
  quotes: Record<string, StockQuote> | undefined,
  settings: Partial<ReportSettings> | undefined,
  marketContext: MarketBriefingContext | null | undefined,
  kospi: KospiBenchmark | undefined,
  peakPrices?: Record<string, number>,
  buildCtx?: VerdictBuildContext
): TradeRecommendation[] {
  const ctxMap = new Map(marketContext?.stocks.map((s) => [s.stockId, s]) ?? []);
  const resolved = resolveReportSettings(settings);
  const targets = resolved.targetPrices ?? {};

  return Object.values(summaries).map((summary) =>
    buildTradeRecommendation(
      summary,
      buySignals[summary.stockId] ?? { status: "watch", label: "—", hint: "" },
      sellSignals[summary.stockId] ?? { status: "watch", label: "—", hint: "" },
      quotes?.[summary.stockId],
      settings,
      ctxMap.get(summary.stockId),
      marketContext,
      kospi,
      peakPrices?.[summary.stockId],
      { userTargetPrice: targets[summary.stockId], buildCtx }
    )
  );
}
