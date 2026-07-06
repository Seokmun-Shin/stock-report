/** 시장·거시 데이터만 수집 (포트폴리오 종목 불필요) — 종목 발굴·브리핑 보조 */

import type { MarketBriefingContext } from "../types";
import { fetchMarketInvestorFlows } from "@/lib/kis/marketInvestor";
import { fetchKospiShortSaleRanking } from "@/lib/kis/shortSale";
import { isKisConfigured } from "@/lib/kis/clientCore";
import { fetchMarketBreadth } from "./marketBreadth";
import { fetchMacroNews, fetchMarketNews } from "./rss";
import { fetchGlobalIndices, fetchMacroInstruments, fetchMajorFxRates } from "./globalMarket";
import { fetchOfficialIndicators } from "./officialIndicators";

export async function aggregateMarketContextLite(): Promise<MarketBriefingContext> {
  const fetchedAt = new Date().toISOString();
  const errors: string[] = [];
  const sources: MarketBriefingContext["sources"] = [];

  const [marketNewsR, macroNewsR, indicesR, macroR, fxRatesR, officialR, marketFlowR, marketBreadthR, marketShortR] =
    await Promise.allSettled([
      fetchMarketNews(),
      fetchMacroNews(),
      fetchGlobalIndices(),
      fetchMacroInstruments(),
      fetchMajorFxRates(),
      fetchOfficialIndicators(),
      isKisConfigured() ? fetchMarketInvestorFlows() : Promise.resolve([]),
      fetchMarketBreadth(),
      isKisConfigured() ? fetchKospiShortSaleRanking(10) : Promise.resolve([]),
    ]);

  const marketNews = marketNewsR.status === "fulfilled" ? marketNewsR.value : [];
  if (marketNewsR.status === "rejected") errors.push(`시장 뉴스: ${String(marketNewsR.reason)}`);
  sources.push({ id: "rss", label: "Google RSS · 시장", ok: marketNewsR.status === "fulfilled" });

  const macroNews = macroNewsR.status === "fulfilled" ? macroNewsR.value : [];
  if (macroNewsR.status === "rejected") errors.push(`거시 뉴스: ${String(macroNewsR.reason)}`);
  sources.push({ id: "rss-macro", label: "Google RSS · 거시", ok: macroNewsR.status === "fulfilled" });

  const globalIndices = indicesR.status === "fulfilled" ? indicesR.value : [];
  const macroInstruments = macroR.status === "fulfilled" ? macroR.value : [];
  const fxRates = fxRatesR.status === "fulfilled" ? fxRatesR.value : [];
  const fx = fxRates.find((r) => r.pair === "USD/KRW") ?? null;
  const officialIndicators = officialR.status === "fulfilled" ? officialR.value : [];
  const marketInvestorFlows = marketFlowR.status === "fulfilled" ? marketFlowR.value : [];
  const marketBreadth = marketBreadthR.status === "fulfilled" ? marketBreadthR.value : [];
  const marketShortSale =
    marketShortR.status === "fulfilled"
      ? marketShortR.value.map((r) => ({
          date: r.date,
          shortQty: r.shortQty,
          shortBalanceQty: r.shortBalanceQty,
          shortBalanceRate: r.shortBalanceRate,
          stockCode: r.stockCode,
          stockName: r.stockName,
        }))
      : [];

  sources.push({ id: "yahoo", label: "Yahoo · 지수", ok: globalIndices.length > 0 });
  sources.push({ id: "fred-bok", label: "FRED/BOK", ok: officialIndicators.length > 0 });
  sources.push({ id: "kis-flow", label: "KIS · 시장 수급", ok: marketInvestorFlows.length > 0 });
  sources.push({ id: "breadth", label: "Naver · breadth", ok: marketBreadth.length > 0 });

  return {
    fetchedAt,
    sources,
    marketNews,
    macroNews,
    globalIndices,
    macroInstruments,
    fx,
    fxRates,
    officialIndicators,
    marketInvestorFlows: marketInvestorFlows.length > 0 ? marketInvestorFlows : undefined,
    marketBreadth: marketBreadth.length > 0 ? marketBreadth : undefined,
    marketShortSale: marketShortSale.length > 0 ? marketShortSale : undefined,
    stocks: [],
    errors,
  };
}
