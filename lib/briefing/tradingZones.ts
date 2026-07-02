import type { BuyTimingSignal, SellTimingSignal, StockSummary } from "../types";
import { fmt } from "../calc";
import { resolveReportSettings, type ReportSettings } from "../reportSettings";

export type ZoneKind = "buy" | "sell" | "watch";

export interface TradingZone {
  kind: ZoneKind;
  label: string;
  priceLow: number;
  priceHigh: number;
  /** 현재가가 이 구간에 있음 */
  active: boolean;
  action: string;
}

export interface StockTradingPlan {
  stockId: string;
  stockName: string;
  currentPrice: number;
  zones: TradingZone[];
  primaryAction: ZoneKind;
  headline: string;
  detail: string;
}

export function buildStockTradingPlan(
  summary: StockSummary,
  buySignal: BuyTimingSignal,
  sellSignal: SellTimingSignal,
  settingsInput?: Partial<ReportSettings>
): StockTradingPlan {
  const settings = resolveReportSettings(settingsInput);
  const p = summary.currentPrice;

  if (!settings.useTimingPctLines) {
    return {
      stockId: summary.stockId,
      stockName: summary.stockName,
      currentPrice: p,
      zones: [],
      primaryAction: "watch",
      headline: "타이밍선 미사용",
      detail: "뉴스·공시·시장·KIS 기준 통합 추천을 참고하세요.",
    };
  }

  const zones: TradingZone[] = [];

  if (summary.timing20 != null && summary.timing10 != null) {
    zones.push({
      kind: "buy",
      label: `2단계 매수 (−${settings.buyTimingPct2}%)`,
      priceLow: 0,
      priceHigh: summary.timing20,
      active: p <= summary.timing20,
      action: `나눠서 매수 · ${fmt(summary.timing20)} 이하`,
    });
    zones.push({
      kind: "buy",
      label: `1단계 매수 (−${settings.buyTimingPct1}%)`,
      priceLow: summary.timing20 + 1,
      priceHigh: summary.timing10,
      active: p > summary.timing20 && p <= summary.timing10,
      action: `첫 매수 · ${fmt(summary.timing10)} 이하`,
    });
  }

  if (summary.sellTiming10 != null && summary.sellTiming20 != null && summary.holdingQty > 0) {
    zones.push({
      kind: "sell",
      label: `1단계 매도 (+${settings.sellTimingPct1}%)`,
      priceLow: summary.sellTiming10,
      priceHigh: summary.sellTiming20 - 1,
      active: p >= summary.sellTiming10 && p < summary.sellTiming20,
      action: `첫 매도 · ${fmt(summary.sellTiming10)} 이상`,
    });
    zones.push({
      kind: "sell",
      label: `2단계 매도 (+${settings.sellTimingPct2}%)`,
      priceLow: summary.sellTiming20,
      priceHigh: Number.MAX_SAFE_INTEGER,
      active: p >= summary.sellTiming20,
      action: `나눠서 매도 · ${fmt(summary.sellTiming20)} 이상`,
    });
  }

  const inBuy = buySignal.status === "zone10" || buySignal.status === "zone20";
  const inSell = sellSignal.status === "zone10" || sellSignal.status === "zone20";

  zones.push({
    kind: "watch",
    label: "관망",
    priceLow: summary.timing10 ?? 0,
    priceHigh: summary.sellTiming10 ?? p * 1.1,
    active: !inBuy && !inSell,
    action: "매수·매도 목표가 사이 — 급하게 사거나 팔지 않기",
  });

  let primaryAction: ZoneKind = "watch";
  let headline = sellSignal.label;
  let detail = sellSignal.hint;

  if (inBuy) {
    primaryAction = "buy";
    headline = buySignal.label;
    detail = buySignal.hint;
  } else if (inSell) {
    primaryAction = "sell";
    headline = sellSignal.label;
    detail = sellSignal.hint;
  } else if (summary.holdingQty <= 0 && summary.lastSellPrice) {
    detail = `1단계 매수 목표 ${fmt(summary.timing10 ?? 0)} · 현재 ${fmt(p)}`;
  }

  return {
    stockId: summary.stockId,
    stockName: summary.stockName,
    currentPrice: p,
    zones: zones.filter((z) => z.priceLow !== z.priceHigh || z.kind === "watch"),
    primaryAction,
    headline,
    detail,
  };
}
