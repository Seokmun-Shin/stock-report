/** 외부 데이터 통합 수집 */

import type { MarketBriefingContext, StockBriefingContext } from "../types";
import { fetchRecentDisclosures, isDartConfigured, scoreDisclosureSentiment } from "./dart";
import {
  fetchGlobalIndices,
  fetchMacroInstruments,
  fetchMajorFxRates,
} from "./globalMarket";
import { fetchOfficialIndicators, isBokConfigured, isFredConfigured } from "./officialIndicators";
import { fetchMacroNews, fetchMarketNews, fetchStockNews, scoreSentiment } from "./rss";
import { fetchMarketInvestorFlows } from "@/lib/kis/marketInvestor";
import { fetchKospiShortSaleRanking } from "@/lib/kis/shortSale";
import { isKisConfigured } from "@/lib/kis/clientCore";
import { fetchMarketBreadth } from "./marketBreadth";

export interface BriefingStockInput {
  id: string;
  name: string;
  code?: string;
}

export async function aggregateBriefingContext(stocks: BriefingStockInput[]): Promise<MarketBriefingContext> {
  const fetchedAt = new Date().toISOString();
  const errors: string[] = [];
  const sources: MarketBriefingContext["sources"] = [];

  const codes = stocks.map((s) => s.code?.trim()).filter((c): c is string => !!c);

  const [marketNewsR, macroNewsR, indicesR, macroR, fxRatesR, officialR, marketFlowR, marketBreadthR, marketShortR, dartR, ...stockNewsR] =
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
      codes.length > 0 && isDartConfigured() ? fetchRecentDisclosures(codes) : Promise.resolve([]),
      ...stocks.map((s) => fetchStockNews(s.name)),
    ]);

  const marketNews = marketNewsR.status === "fulfilled" ? marketNewsR.value : [];
  if (marketNewsR.status === "rejected") errors.push(`시장 뉴스: ${String(marketNewsR.reason)}`);
  sources.push({ id: "rss", label: "Google RSS · 시장", ok: marketNewsR.status === "fulfilled" });

  const macroNews = macroNewsR.status === "fulfilled" ? macroNewsR.value : [];
  if (macroNewsR.status === "rejected") errors.push(`거시·국제 뉴스: ${String(macroNewsR.reason)}`);
  sources.push({
    id: "rss-macro",
    label: "Google RSS · 거시·국제",
    ok: macroNewsR.status === "fulfilled",
    note: macroNews.length > 0 ? `${macroNews.length}건` : undefined,
  });

  const globalIndices = indicesR.status === "fulfilled" ? indicesR.value : [];
  if (indicesR.status === "rejected") errors.push(`글로벌 지수: ${String(indicesR.reason)}`);
  sources.push({
    id: "yahoo",
    label: "Yahoo Finance · 지수",
    ok: globalIndices.length > 0,
    note: globalIndices.length === 0 ? "조회 실패" : `${globalIndices.length}개`,
  });

  const macroInstruments = macroR.status === "fulfilled" ? macroR.value : [];
  if (macroR.status === "rejected") errors.push(`금리·원자재: ${String(macroR.reason)}`);
  sources.push({
    id: "yahoo-macro",
    label: "Yahoo Finance · 금리·원자재",
    ok: macroInstruments.length > 0,
    note: macroInstruments.length > 0 ? `${macroInstruments.length}개` : "조회 실패",
  });

  const fxRates = fxRatesR.status === "fulfilled" ? fxRatesR.value : [];
  const fx = fxRates.find((r) => r.pair === "USD/KRW") ?? null;
  if (fxRatesR.status === "rejected") errors.push(`환율: ${String(fxRatesR.reason)}`);
  sources.push({
    id: "fx",
    label: "Frankfurter · 주요환율",
    ok: fxRates.length > 0 || !!fx,
    note: fxRates.length > 0 ? `${fxRates.length}통화` : undefined,
  });

  const officialIndicators = officialR.status === "fulfilled" ? officialR.value : [];
  if (officialR.status === "rejected") errors.push(`공식 지표: ${String(officialR.reason)}`);
  sources.push({
    id: "fred",
    label: "FRED · 미국 공식",
    ok: isFredConfigured() && officialIndicators.some((i) => i.source === "FRED"),
    note: !isFredConfigured()
      ? "FRED_API_KEY 미설정"
      : officialIndicators.filter((i) => i.source === "FRED").length > 0
        ? `${officialIndicators.filter((i) => i.source === "FRED").length}개`
        : "조회 실패",
  });
  sources.push({
    id: "bok",
    label: "BOK ECOS · 한국 공식",
    ok: isBokConfigured() && officialIndicators.some((i) => i.source === "BOK"),
    note: !isBokConfigured()
      ? "BOK_API_KEY 미설정"
      : officialIndicators.filter((i) => i.source === "BOK").length > 0
        ? `${officialIndicators.filter((i) => i.source === "BOK").length}개`
        : "조회 실패",
  });

  const marketInvestorFlows = marketFlowR.status === "fulfilled" ? marketFlowR.value : [];
  if (marketFlowR.status === "rejected") errors.push(`시장 수급: ${String(marketFlowR.reason)}`);

  const marketBreadth = marketBreadthR.status === "fulfilled" ? marketBreadthR.value : [];
  if (marketBreadthR.status === "rejected") errors.push(`시장 breadth: ${String(marketBreadthR.reason)}`);

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
  if (marketShortR.status === "rejected") errors.push(`공매도 상위: ${String(marketShortR.reason)}`);

  sources.push({
    id: "breadth",
    label: "Naver · 등락 종목 수",
    ok: marketBreadth.length > 0,
    note: marketBreadth.length > 0 ? `${marketBreadth.length}개 지수` : "조회 실패",
  });

  sources.push({
    id: "kis-short-rank",
    label: "KIS · 코스피 공매도 상위",
    ok: isKisConfigured() && marketShortSale.length > 0,
    note: !isKisConfigured()
      ? "KIS 키 미설정"
      : marketShortSale.length > 0
        ? `${marketShortSale.length}종목`
        : "조회 실패",
  });

  let allDisclosures: Awaited<ReturnType<typeof fetchRecentDisclosures>> = [];
  if (isDartConfigured()) {
    if (dartR.status === "fulfilled") allDisclosures = dartR.value;
    else errors.push(`DART: ${String(dartR.reason)}`);
    sources.push({ id: "dart", label: "DART 공시", ok: dartR.status === "fulfilled" });
  } else {
    sources.push({
      id: "dart",
      label: "DART 공시",
      ok: false,
      note: "DART_API_KEY 미설정",
    });
  }

  sources.push({
    id: "kis",
    label: "KIS Open API",
    ok: isKisConfigured(),
    note: isKisConfigured()
      ? marketInvestorFlows.length > 0
        ? "시세·수급·시장흐름"
        : "시세·투자자·호가·프로그램 (KIS 새로고침)"
      : "KIS 키 미설정",
  });
  sources.push({ id: "portfolio", label: "내 매매·FIFO", ok: true, note: "로컬 포트폴리오" });

  const stockContexts: StockBriefingContext[] = stocks.map((stock, i) => {
    const newsResult = stockNewsR[i];
    const news = newsResult?.status === "fulfilled" ? newsResult.value : [];
    const code = stock.code?.replace(/\D/g, "").padStart(6, "0");
    const disclosures = code
      ? allDisclosures.filter((d) => d.stockCode === code).slice(0, 5)
      : [];

    const newsSent = scoreSentiment(news.map((n) => n.title));
    const discSent = scoreDisclosureSentiment(disclosures);
    const combined = newsSent.score * 0.6 + discSent * 0.4;

    let sentimentLabel = "중립";
    if (combined >= 0.25) sentimentLabel = "긍정";
    else if (combined <= -0.25) sentimentLabel = "부정";

    return {
      stockId: stock.id,
      stockName: stock.name,
      stockCode: stock.code,
      news,
      disclosures,
      sentimentScore: combined,
      sentimentLabel,
    };
  });

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
    stocks: stockContexts,
    errors,
  };
}
