import type { AppData, KospiBenchmark, PortfolioSummary, StockSummary } from "../types";
import { fmtPct, fmtSigned } from "../calc";
import { compareToKospi, computePortfolioDayChange } from "../benchmark";
import type { BuyTimingSignal, SellTimingSignal } from "../types";
import { buildStockTradingPlan, type StockTradingPlan } from "./tradingZones";

/** 브리핑 데이터 원천 (확장 가능) */
export const BRIEFING_SOURCES = [
  { id: "kis-rank", label: "KIS 순위 API", desc: "거래대금·등락률·외국인 순매수 (코스피·코스닥)" },
  { id: "kis", label: "KIS Open API", desc: "시세·투자자·호가·프로그램·KOSPI" },
  { id: "dart", label: "DART Open API", desc: "공시·실적 (DART_API_KEY)" },
  { id: "fred", label: "FRED", desc: "미국 CPI·실업·Fed·GDP (FRED_API_KEY)" },
  { id: "bok", label: "BOK ECOS", desc: "한국 기준금리·CPI·GDP (BOK_API_KEY)" },
  { id: "rss", label: "Google RSS", desc: "국내·미국 시장·거시·국제정세 뉴스" },
  { id: "yahoo", label: "Yahoo Finance", desc: "미·일·중·영·EU 지수·금리·원자재" },
  { id: "fx", label: "Frankfurter", desc: "USD/EUR/JPY/GBP/CNY → KRW" },
  { id: "portfolio", label: "내 매매·FIFO", desc: "평단·실현·보유·타이밍선" },
  { id: "settings", label: "전략 설정", desc: "매수/매도 %·목표가·시그널" },
  { id: "snapshots", label: "일별 스냅샷", desc: "전일 대비 손익·가격" },
] as const;

/** 유료·제휴 필요 — 미연동 */
export const PLANNED_BRIEFING_SOURCES = [
  "FnGuide / WISE 리포트 API",
  "증권사 리서치 PDF",
  "컨센서스 EPS (유료)",
] as const;

export interface MarketBrief {
  reportDate: string;
  sources: typeof BRIEFING_SOURCES;
  kospi: KospiBenchmark | null;
  portfolioDayChange: number | null;
  kospiAlpha: number | null;
  marketSummary: string[];
  stockPlans: StockTradingPlan[];
}

export function buildMarketBrief(
  data: AppData,
  portfolio: PortfolioSummary,
  summaries: Record<string, StockSummary>,
  buySignals: Record<string, BuyTimingSignal>,
  sellSignals: Record<string, SellTimingSignal>
): MarketBrief {
  const portfolioDay = computePortfolioDayChange(data.stocks, summaries, data.stockQuotes);
  const cmp = compareToKospi(portfolioDay, data.kospiBenchmark);
  const kospi = data.kospiBenchmark ?? null;

  const marketSummary: string[] = [];
  if (kospi) {
    marketSummary.push(`KOSPI ${kospi.price.toFixed(2)} (${fmtPct(kospi.changeRate)})`);
  } else {
    marketSummary.push("KOSPI: KIS 새로고침 후 표시");
  }
  if (cmp.portfolio != null) {
    marketSummary.push(`보유 가중 전일比 ${fmtPct(cmp.portfolio)}`);
  }
  if (cmp.alpha != null) {
    marketSummary.push(`벤치마크 대비 ${cmp.alpha >= 0 ? "+" : ""}${cmp.alpha.toFixed(2)}%p`);
  }
  marketSummary.push(`누적 ${fmtSigned(portfolio.totalPnl)} (${fmtPct(portfolio.totalReturnRate)})`);

  const stockPlans = data.stocks
    .map((s) => {
      const sum = summaries[s.id];
      if (!sum) return null;
      return buildStockTradingPlan(
        sum,
        buySignals[s.id] ?? { status: "watch", label: "—", hint: "" },
        sellSignals[s.id] ?? { status: "watch", label: "—", hint: "" },
        data.reportSettings
      );
    })
    .filter((p): p is StockTradingPlan => p != null);

  return {
    reportDate: new Date().toISOString().slice(0, 10),
    sources: BRIEFING_SOURCES,
    kospi,
    portfolioDayChange: cmp.portfolio,
    kospiAlpha: cmp.alpha,
    marketSummary,
    stockPlans,
  };
}

export function formatMarketBriefText(brief: MarketBrief): string {
  const lines: string[] = [
    "",
    "📈 시장 요약",
    brief.marketSummary.join(" · "),
    `데이터: ${brief.sources.map((s) => s.label).join(", ")}`,
  ];

  if (brief.stockPlans.length > 0) {
    lines.push("", "⏱ 매매 타이밍·구간");
    for (const plan of brief.stockPlans) {
      lines.push(`· ${plan.stockName}: ${plan.headline} — ${plan.detail}`);
      for (const z of plan.zones.filter((x) => x.active)) {
        lines.push(`  → ${z.label}: ${z.action}`);
      }
    }
  }

  return lines.join("\n");
}
