/**
 * 매수·매도 타이밍 판단 원천 데이터 — UI 노출용 전체 수집
 */

import type {
  BuyTimingSignal,
  KospiBenchmark,
  SellTimingSignal,
  Stock,
  StockPeak,
  StockQuote,
  StockSummary,
} from "../types";
import type { KisInvestorNet } from "../kis/types";
import { fmt, fmtPct, fmtQty, fmtSigned } from "../calc";
import { resolveReportSettings, type ReportSettings } from "../reportSettings";
import type { MarketBriefingContext, OfficialIndicatorSnapshot, StockBriefingContext, TradeRecommendation } from "./types";
import type { StockTradingVerdict } from "./tradingVerdict";
import { buildTradeRecommendation } from "./tradeRecommendation";
import {
  buildStockVerdictExtra,
  calcSnapshotTrend,
  type VerdictBuildContext,
} from "./verdictExtra";
import { scoreSentiment } from "./providers/rss";
import { regionLabel, summarizeGlobalRisk } from "./providers/globalMarket";
import { summarizeOfficialMacro } from "./providers/officialIndicators";
import { summarizeMarketInvestorFlow } from "./marketFlow";

export type TimingUseTag = "buy" | "sell" | "both";

export interface TimingSourceRow {
  label: string;
  value: string;
  hint?: string;
  missing?: boolean;
}

export interface TimingSourceListItem {
  title: string;
  meta?: string;
  link?: string;
}

export interface TimingSourceSection {
  id: string;
  title: string;
  subtitle?: string;
  /** UI 그룹 (종목·공통 섹션 하위 분류) */
  group?: string;
  usedFor: TimingUseTag[];
  rows: TimingSourceRow[];
  listItems?: TimingSourceListItem[];
}

export interface TimingSourceReport {
  stockId: string;
  stockName: string;
  stockCode?: string;
  /** 종목별 취합·판단 결과 */
  summarySections: TimingSourceSection[];
  /** 종목 고유 원천 (KIS·매매기록·뉴스 등) */
  stockSections: TimingSourceSection[];
  /** 시장 공통 원천 (글로벌·거시·뉴스 등) */
  commonSections: TimingSourceSection[];
  fetchedAt?: string;
  missingCount: number;
}

function row(label: string, value: string | number | null | undefined, hint?: string, usedFor?: TimingUseTag): TimingSourceRow {
  const missing = value == null || value === "" || (typeof value === "number" && !Number.isFinite(value));
  const display =
    missing ? "— (없음)" : typeof value === "number" ? (Number.isInteger(value) && Math.abs(value) < 1e6 ? String(value) : fmt(value)) : String(value);
  return { label, value: display, hint, missing };
}

function pctRow(label: string, value: number | null | undefined, hint?: string): TimingSourceRow {
  if (value == null || !Number.isFinite(value)) return row(label, null, hint);
  return row(label, fmtPct(value), hint);
}

function countMissing(sections: TimingSourceSection[]): number {
  return sections.reduce((n, s) => n + s.rows.filter((r) => r.missing).length, 0);
}

function tag(label: TimingUseTag): TimingUseTag[] {
  return [label];
}

function kstDate(d = new Date()): Date {
  return new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

function isKrMarketSession(): boolean {
  const kst = kstDate();
  const dow = kst.getDay();
  if (dow === 0 || dow === 6) return false;
  const hm = kst.getHours() * 100 + kst.getMinutes();
  return hm >= 900 && hm < 1530;
}

function intradayPlaceholder(hasDaily: boolean): string | null {
  return hasDaily ? "—" : null;
}

function intradayHint(hasDaily: boolean, hasIntraday: boolean): string | undefined {
  if (hasIntraday) return undefined;
  if (!hasDaily) return undefined;
  return isKrMarketSession() ? "장중 API 미응답 · 확정치 참고" : "장외·마감 후 장중 미제공 · 확정치 참고";
}

function calc52wPosition(price: number, high?: number, low?: number): number | null {
  if (!high || !low || high <= low || price <= 0) return null;
  return ((price - low) / (high - low)) * 100;
}

function creditMacroLine(indicators: OfficialIndicatorSnapshot[]): string | null {
  const hy = indicators.find((i) => i.id === "us-hy-oas");
  const curve = indicators.find((i) => i.id === "us-yield-curve");
  const parts: string[] = [];
  if (hy) parts.push(`HY OAS ${hy.value.toFixed(2)}%`);
  if (curve) parts.push(`10Y-2Y ${curve.value.toFixed(2)}%p`);
  return parts.length ? parts.join(" · ") : null;
}

function urgencyKo(u: TradeRecommendation["urgency"]) {
  if (u === "now") return "지금~오늘";
  if (u === "this_week") return "이번 주";
  return "구간 대기";
}

function actionKo(a: TradeRecommendation["action"]) {
  if (a === "buy") return "매수";
  if (a === "sell") return "매도";
  return "관망";
}

function buildTradeRecommendationSection(rec: TradeRecommendation | null): TimingSourceSection | null {
  if (!rec) return null;
  return {
    id: "trade-recommendation",
    title: "통합 매매 추천",
    subtitle: "판단 탭과 동일 엔진 (시세·시장·뉴스·공시·고점·평단)",
    group: "overview",
    usedFor: tag("both"),
    rows: [
      row("추천", actionKo(rec.action), rec.summary, "both"),
      row("시점", urgencyKo(rec.urgency), rec.timingNote, "both"),
      row("추천가", rec.suggestedPrice, `${fmt(rec.priceRange.min)} ~ ${fmt(rec.priceRange.max)}`, "both"),
      row("신뢰도", `${rec.confidence}%`, undefined, "both"),
    ],
    listItems: rec.factors.map((f) => ({
      title: `[${f.source}] ${f.text}`,
      meta: f.impact === "positive" ? "긍정" : f.impact === "negative" ? "부정" : "중립",
    })),
  };
}

function buildSummaryOverviewSection(input: {
  price: number;
  quote?: StockQuote;
  alpha: number | null;
  kosdaqAlpha: number | null;
  kospi?: KospiBenchmark;
  buySignal: BuyTimingSignal;
  sellSignal: SellTimingSignal;
  stockContext?: StockBriefingContext;
  globalRisk: { score: number; note: string } | null;
  officialMacro: { score: number; note: string } | null;
  officialIndicators: OfficialIndicatorSnapshot[];
  marketFlow: { score: number; note: string } | null;
  marketSent: ReturnType<typeof scoreSentiment> | null;
  verdict?: StockTradingVerdict | null;
}): TimingSourceSection {
  const {
    price,
    quote,
    alpha,
    kosdaqAlpha,
    kospi,
    buySignal,
    sellSignal,
    stockContext,
    globalRisk,
    officialMacro,
    officialIndicators,
    marketFlow,
    marketSent,
    verdict,
  } = input;

  const ext = quote?.kis?.extended;
  const pos52 = calc52wPosition(price, ext?.week52High, ext?.week52Low);
  const credit = creditMacroLine(officialIndicators);

  return {
    id: "summary-overview",
    title: "한눈에 보기",
    subtitle: "종목·시장 원천을 종합한 핵심 지표",
    group: "overview",
    usedFor: tag("both"),
    rows: [
      row(
        "현재가 · 전일比",
        quote != null ? `${fmt(price)} (${fmtPct(quote.changeRate)})` : price > 0 ? fmt(price) : null,
        "KIS 시세",
        "both"
      ),
      pctRow("KOSPI 알파", alpha, kospi?.source ? `벤치마크 ${kospi.source.toUpperCase()}` : "종목 − KOSPI (%p)", "both"),
      pctRow("KOSDAQ 알파", kosdaqAlpha, "종목 − KOSDAQ (%p)", "both"),
      ...(pos52 != null
        ? [row("52주 구간", `${pos52.toFixed(0)}%`, `저 ${ext?.week52Low?.toLocaleString()} ~ 고 ${ext?.week52High?.toLocaleString()}`, "both")]
        : []),
      ...(ext?.foreignOwnershipPct != null
        ? [row("외국인 지분", `${ext.foreignOwnershipPct.toFixed(2)}%`, "KIS 시세 확장", "both")]
        : []),
      ...(ext?.sectorName ? [row("업종", ext.sectorName, ext.sectorMidCode ? `코드 ${ext.sectorMidCode}` : undefined, "both")] : []),
      row("매수 타이밍", `${buySignal.label} — ${buySignal.status}`, buySignal.hint, "buy"),
      row("매도 타이밍", `${sellSignal.label} — ${sellSignal.status}`, sellSignal.hint, "sell"),
      row(
        "종목 뉴스·공시",
        stockContext
          ? `${stockContext.sentimentLabel} (${stockContext.sentimentScore.toFixed(2)}) · 뉴스 ${stockContext.news.length} · 공시 ${stockContext.disclosures.length}`
          : null,
        "DART + RSS",
        "both"
      ),
      row(
        "시장 뉴스 감성",
        marketSent ? `${marketSent.label} (${marketSent.score.toFixed(2)})` : null,
        "국내·거시 RSS",
        "both"
      ),
      row(
        "글로벌 리스크",
        globalRisk?.note !== "글로벌·거시 중립" ? globalRisk?.note : globalRisk ? "중립" : null,
        globalRisk ? `점수 ${globalRisk.score.toFixed(2)}` : "데이터 새로고침",
        "both"
      ),
      row(
        "공식 거시",
        officialMacro?.note !== "공식 지표 중립" ? officialMacro?.note : officialMacro ? "중립" : null,
        officialMacro ? `점수 ${officialMacro.score.toFixed(2)}` : "FRED/BOK",
        "both"
      ),
      row("신용·수익률곡선", credit, "FRED 공식", "both"),
      row(
        "코스피 시장 수급",
        marketFlow?.note || null,
        marketFlow ? `점수 ${marketFlow.score.toFixed(2)}` : "KIS + 새로고침",
        "both"
      ),
      ...(verdict
        ? [
            row("매수 판단", verdict.buy.headline, `신뢰도 ${verdict.buy.confidence}%`, "buy"),
            row("매도 판단", verdict.sell.headline, `신뢰도 ${verdict.sell.confidence}%`, "sell"),
          ]
        : []),
    ],
  };
}

function fmtStockQty(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return null;
  return `${n.toLocaleString()}주`;
}

function fmtMillion(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return null;
  return `${n.toLocaleString()}백만`;
}

function fmtKisAsOf(s?: string) {
  if (!s) return null;
  const d = String(s).replace(/\D/g, "");
  if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  if (d.length === 6) return `${d.slice(0, 2)}:${d.slice(2, 4)}:${d.slice(4, 6)}`;
  return s;
}

function fmtGrossPair(buy: number | null | undefined, sell: number | null | undefined) {
  if (buy == null && sell == null) return null;
  const parts: string[] = [];
  if (buy != null) parts.push(`매수 ${buy.toLocaleString()}주`);
  if (sell != null) parts.push(`매도 ${sell.toLocaleString()}주`);
  return parts.join(" · ");
}

function fmtNetHint() {
  return "매수−매도 · 음수=순매도";
}

function hasKisInvestorData(inv: KisInvestorNet): boolean {
  return [
    inv.personalNetQty,
    inv.foreignNetQty,
    inv.institutionNetQty,
    inv.personalNetAmount,
    inv.foreignNetAmount,
    inv.institutionNetAmount,
    inv.securitiesNetQty,
    inv.trustNetQty,
    inv.pensionNetQty,
  ].some((v) => v != null);
}

function investorIntradayRows(inv: KisInvestorNet): TimingSourceRow[] {
  const rows: TimingSourceRow[] = [];
  const pushNet = (label: string, qty?: number, amount?: number) => {
    if (qty != null) rows.push(row(`${label} 순매수`, fmtStockQty(qty), fmtNetHint(), "both"));
    if (amount != null) rows.push(row(`${label} 순매수`, fmtMillion(amount), "거래대금 · 음수=순매도", "both"));
  };
  pushNet("외국인", inv.foreignNetQty, inv.foreignNetAmount);
  pushNet("기관", inv.institutionNetQty, inv.institutionNetAmount);
  pushNet("개인", inv.personalNetQty, inv.personalNetAmount);
  if (inv.securitiesNetQty != null) rows.push(row("증권 순매수", fmtStockQty(inv.securitiesNetQty), fmtNetHint()));
  if (inv.trustNetQty != null) rows.push(row("투신 순매수", fmtStockQty(inv.trustNetQty), fmtNetHint()));
  if (inv.pensionNetQty != null) rows.push(row("연기금 순매수", fmtStockQty(inv.pensionNetQty), fmtNetHint()));
  rows.push(row("기준일", fmtKisAsOf(inv.asOf)));

  const hasInstOrPersonal =
    inv.institutionNetQty != null ||
    inv.institutionNetAmount != null ||
    inv.personalNetQty != null ||
    inv.personalNetAmount != null;
  if (!hasInstOrPersonal) {
    rows.push(
      row(
        "안내",
        "기관·개인 당일 순매수는 KIS 장중 API 미제공",
        "아래 「일별 수급」·「매수·매도」에서 전일 확정 확인",
        "both"
      )
    );
  }
  return rows;
}

function buildKisExtraSections(quote?: StockQuote): TimingSourceSection[] {
  const kis = quote?.kis;
  if (!kis) return [];

  const sections: TimingSourceSection[] = [];
  const ext = kis.extended;

  if (ext) {
    sections.push({
      id: "kis-extended",
      title: "KIS 시세 확장",
      subtitle: "거래량·밸류에이션·52주·상하한",
      group: "kis",
      usedFor: tag("both"),
      rows: [
        row("시가", ext.open, undefined, "both"),
        row("거래량", ext.volume != null ? fmtStockQty(ext.volume) : null, "수급·변동성", "both"),
        row("거래대금", ext.tradingValue != null ? `${ext.tradingValue.toLocaleString()}원` : null),
        row("시가총액", ext.marketCap != null ? `${ext.marketCap.toLocaleString()}억` : null),
        row("PER", ext.per),
        row("PBR", ext.pbr),
        row("EPS", ext.eps),
        row("BPS", ext.bps),
        row("상장주식수", ext.listedShares != null ? fmtStockQty(ext.listedShares) : null),
        row("상한가", ext.upperLimit, undefined, "sell"),
        row("하한가", ext.lowerLimit, undefined, "buy"),
        row("52주 최고", ext.week52High, undefined, "sell"),
        row("52주 최저", ext.week52Low, undefined, "buy"),
        pctRow("외국인 보유비율", ext.foreignOwnershipPct),
      ],
    });
  }

  if (kis.investor && hasKisInvestorData(kis.investor)) {
    sections.push({
      id: "kis-investor",
      title: "KIS 투자자별 순매수",
      subtitle: "당일 장중 · 순매수만 (음수=순매도) · 미집계 항목은 표시 안 함",
      group: "kis",
      usedFor: tag("both"),
      rows: investorIntradayRows(kis.investor),
    });
  }

  if (kis.investorGross) {
    const g = kis.investorGross;
    sections.push({
      id: "kis-investor-gross",
      title: "KIS 투자자별 매수·매도",
      subtitle: `${fmtKisAsOf(g.date) ?? g.date} 확정 · investor-trade-by-stock-daily`,
      group: "kis",
      usedFor: tag("both"),
      rows: [
        row("외국인", fmtGrossPair(g.foreignBuyQty, g.foreignSellQty), undefined, "both"),
        row("기관", fmtGrossPair(g.institutionBuyQty, g.institutionSellQty), undefined, "both"),
        row("개인", fmtGrossPair(g.personalBuyQty, g.personalSellQty), undefined, "both"),
      ],
    });
  }

  if (kis.investorDaily?.length) {
    sections.push({
      id: "kis-investor-daily",
      title: "KIS 일별 투자자 수급",
      subtitle: "최근 10영업일 · 매수·매도 분리는 장 마감(15:40) 후 확정",
      group: "kis",
      usedFor: tag("both"),
      rows: [
        row("조회 건수", kis.investorDaily.length),
      ],
      listItems: kis.investorDaily.map((d) => ({
        title: fmtKisAsOf(d.date) ?? d.date,
        meta: [
          d.foreignNetQty != null ? `외 순 ${fmtStockQty(d.foreignNetQty)}` : null,
          d.institutionNetQty != null ? `기 순 ${fmtStockQty(d.institutionNetQty)}` : null,
          d.personalNetQty != null ? `개 순 ${fmtStockQty(d.personalNetQty)}` : null,
          fmtGrossPair(d.foreignBuyQty, d.foreignSellQty) ? `외 ${fmtGrossPair(d.foreignBuyQty, d.foreignSellQty)}` : null,
          fmtGrossPair(d.institutionBuyQty, d.institutionSellQty) ? `기 ${fmtGrossPair(d.institutionBuyQty, d.institutionSellQty)}` : null,
          fmtGrossPair(d.personalBuyQty, d.personalSellQty) ? `개 ${fmtGrossPair(d.personalBuyQty, d.personalSellQty)}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    });
  }

  if (kis.orderBook) {
    const ob = kis.orderBook;
    const bidAskRatio =
      ob.totalBidQty && ob.totalAskQty && ob.totalAskQty > 0
        ? ob.totalBidQty / ob.totalAskQty
        : null;
    sections.push({
      id: "kis-orderbook",
      title: "KIS 호가 · 예상체결",
      subtitle: "inquire-asking-price-exp-ccn",
      group: "kis",
      usedFor: tag("both"),
      rows: [
        row("매도 1호가", ob.askPrice1, undefined, "sell"),
        row("매수 1호가", ob.bidPrice1, undefined, "buy"),
        row("매도 1호가 잔량", ob.askQty1 != null ? fmtStockQty(ob.askQty1) : null),
        row("매수 1호가 잔량", ob.bidQty1 != null ? fmtStockQty(ob.bidQty1) : null),
        row("총 매도 잔량", ob.totalAskQty != null ? fmtStockQty(ob.totalAskQty) : null),
        row("총 매수 잔량", ob.totalBidQty != null ? fmtStockQty(ob.totalBidQty) : null),
        row("매수/매도 잔량비", bidAskRatio != null ? `${bidAskRatio.toFixed(2)}배` : null, "1.25↑ 매수우위", "both"),
        row("예상체결가", ob.expectedPrice),
        row("예상체결량", ob.expectedQty != null ? fmtStockQty(ob.expectedQty) : null),
      ],
    });
  }

  if (kis.program) {
    const prog = kis.program;
    sections.push({
      id: "kis-program",
      title: "KIS 프로그램 매매",
      subtitle: "program-trade-by-stock",
      group: "kis",
      usedFor: tag("both"),
      rows: [
        row("순매수 수량", prog.netBuyQty != null ? fmtStockQty(prog.netBuyQty) : null, "양수=순매수", "both"),
        row("순매수 대금", prog.netBuyAmount != null ? fmtMillion(prog.netBuyAmount) : null),
        row("매수 수량", prog.buyQty != null ? fmtStockQty(prog.buyQty) : null),
        row("매도 수량", prog.sellQty != null ? fmtStockQty(prog.sellQty) : null),
        row("기준 시각", prog.asOf),
      ],
    });
  }

  if (kis.shortSaleDaily?.length) {
    sections.push({
      id: "kis-short-sale",
      title: "KIS 공매도 일별",
      subtitle: "daily-short-sale · FHPST04830000",
      group: "kis",
      usedFor: tag("both"),
      rows: [
        row("조회 건수", kis.shortSaleDaily.length),
        row(
          "최근 공매도",
          kis.shortSaleDaily[0]?.shortQty != null ? fmtStockQty(kis.shortSaleDaily[0].shortQty) : null,
          kis.shortSaleDaily[0]?.date ? `일자 ${fmtKisAsOf(kis.shortSaleDaily[0].date)}` : undefined
        ),
        row(
          "공매도 거래비중",
          kis.shortSaleDaily[0]?.shortBalanceRate != null
            ? `${kis.shortSaleDaily[0].shortBalanceRate.toFixed(2)}%`
            : kis.shortSaleDaily[0]?.shortQty === 0
              ? "0.00%"
              : null,
          "KIS ssts_vol_rlim · 당일 0주면 장중·미집계 가능"
        ),
      ],
      listItems: kis.shortSaleDaily.map((d) => ({
        title: fmtKisAsOf(d.date) ?? d.date,
        meta: [
          d.shortQty != null ? `공매도 ${fmtStockQty(d.shortQty)}` : null,
          d.shortBalanceQty != null ? `잔고 ${fmtStockQty(d.shortBalanceQty)}` : null,
          d.shortBalanceRate != null ? `${d.shortBalanceRate.toFixed(2)}%` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    });
  }

  if (kis.sectorIndex) {
    const si = kis.sectorIndex;
    sections.push({
      id: "kis-sector-index",
      title: "KIS 업종 지수",
      subtitle: si.label,
      group: "kis",
      usedFor: tag("both"),
      rows: [
        row("업종 지수", si.price.toLocaleString(), fmtPct(si.changeRate)),
        row("업종 코드", si.code),
      ],
    });
  }

  if (kis.errors && Object.keys(kis.errors).length > 0) {
    sections.push({
      id: "kis-errors",
      title: "KIS 부가 API 오류",
      subtitle: "시세는 정상, 아래 항목만 조회 실패",
      group: "kis",
      usedFor: tag("both"),
      rows: Object.entries(kis.errors).map(([key, msg]) => row(key, msg, "재시도·장외·모의투자 제한 가능")),
    });
  }

  return sections;
}

export function buildTimingSourceReport(input: {
  stock: Stock;
  summary: StockSummary;
  quote?: StockQuote;
  settings?: Partial<ReportSettings>;
  buySignal: BuyTimingSignal;
  sellSignal: SellTimingSignal;
  peak?: StockPeak;
  targetPrice?: number;
  stockContext?: StockBriefingContext;
  marketContext?: MarketBriefingContext | null;
  kospi?: KospiBenchmark;
  kosdaq?: KospiBenchmark;
  buildCtx?: VerdictBuildContext;
  verdict?: StockTradingVerdict | null;
}): TimingSourceReport {
  const {
    stock,
    summary,
    quote,
    buySignal,
    sellSignal,
    peak,
    targetPrice,
    stockContext,
    marketContext,
    kospi,
    kosdaq,
    buildCtx,
    verdict,
  } = input;
  const settings = resolveReportSettings(input.settings);
  const price = quote?.price ?? summary.currentPrice;
  const stockExtra = buildStockVerdictExtra(stock.id, summary, buildCtx);
  const { pct: snapshotTrendPct, spanDays } = calcSnapshotTrend(stock.id, summary.currentPrice, buildCtx?.dailySnapshots);

  const dropFromPeak =
    peak?.price && peak.price > 0 && price > 0 ? ((peak.price - price) / peak.price) * 100 : null;

  const alpha =
    kospi && quote ? quote.changeRate - kospi.changeRate : null;

  const kosdaqAlpha =
    kosdaq && quote ? quote.changeRate - kosdaq.changeRate : null;

  const tradeRec = buildTradeRecommendation(
    summary,
    buySignal,
    sellSignal,
    quote,
    settings,
    stockContext,
    marketContext ?? undefined,
    kospi,
    peak?.price,
    {
      verdict,
      userTargetPrice: targetPrice,
      buildCtx,
    }
  );

  const allMarketHeadlines = [
    ...(marketContext?.marketNews ?? []),
    ...(marketContext?.macroNews ?? []),
  ].slice(0, 16);
  const marketSent = allMarketHeadlines.length
    ? scoreSentiment(allMarketHeadlines.map((n) => n.title))
    : null;

  const globalRisk =
    marketContext?.globalIndices?.length || marketContext?.macroInstruments?.length
      ? summarizeGlobalRisk(
          marketContext.globalIndices ?? [],
          marketContext.macroInstruments ?? [],
          marketContext.fxRates ?? []
        )
      : null;

  const officialMacro = marketContext?.officialIndicators?.length
    ? summarizeOfficialMacro(marketContext.officialIndicators)
    : null;

  const marketFlow = marketContext?.marketInvestorFlows?.length
    ? summarizeMarketInvestorFlow(marketContext.marketInvestorFlows)
    : null;

  const semiconSymbols = new Set(["SOX", "TAIEX", "ES", "NQ", "BTC", "VIX3M"]);

  const snapshots = [...(buildCtx?.dailySnapshots ?? [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  const stockEvents = (buildCtx?.stockEvents ?? []).filter((e) => e.stockId === stock.id);

  const stockRawSections: TimingSourceSection[] = [
    {
      id: "kis",
      title: "KIS 시세",
      subtitle: "실시간·전일가·당일 고저",
      group: "kis",
      usedFor: tag("both"),
      rows: [
        row("현재가", price, "판단·타이밍선 기준가", "both"),
        row("전일 종가", quote?.prevClose, "지지·등락률 기준", "both"),
        row("전일比 등락률", quote != null ? fmtPct(quote.changeRate) : null, "급등·급락 신호", "both"),
        row("전일比 등락액", quote?.changeAmount, undefined, "both"),
        row("당일 고가", quote?.high, "매도 구간 앵커", "sell"),
        row("당일 저가", quote?.low, "매수 구간 앵커", "buy"),
        row("시세 갱신 시각", quote?.updatedAt ? new Date(quote.updatedAt).toLocaleString("ko-KR") : null),
        row("종목코드", stock.code, "KIS 조회용 6자리"),
      ],
    },
    ...buildKisExtraSections(quote),
    {
      id: "trades-derived",
      title: "매매 기록 → 파생값",
      subtitle: "FIFO·체결 내역에서 계산",
      group: "portfolio",
      usedFor: tag("both"),
      rows: [
        row("최근 매도가", summary.lastSellPrice, "매수 타이밍 1·2차선 기준", "buy"),
        row("최근 매수가", summary.lastBuyPrice, "추가매수·참고", "buy"),
        row(`매수 1차선 (−${settings.buyTimingPct1}%)`, summary.timing10, "최근 매도가 기준", "buy"),
        row(`매수 2차선 (−${settings.buyTimingPct2}%)`, summary.timing20, "최근 매도가 기준", "buy"),
        row("보유 수량", summary.holdingQty > 0 ? fmtQty(summary.holdingQty) : 0, undefined, "both"),
        row("평단 (수수료 제외)", summary.holdingAvgPrice > 0 ? summary.holdingAvgPrice : null, "매도 목표가 기준", "sell"),
        row("평단 (수수료 포함)", summary.holdingAvgPriceWithCost > 0 ? summary.holdingAvgPriceWithCost : null, "비용 포함 손익", "sell"),
        row(`매도 1차선 (+${settings.sellTimingPct1}%)`, summary.sellTiming10, "평단 기준", "sell"),
        row(`매도 2차선 (+${settings.sellTimingPct2}%)`, summary.sellTiming20, "평단 기준", "sell"),
        row("미실현 손익", summary.unrealizedPnlWithCost !== 0 || summary.holdingQty > 0 ? fmtSigned(summary.unrealizedPnlWithCost) : null, undefined, "sell"),
        pctRow("미실현 수익률", summary.holdingQty > 0 ? summary.unrealizedPnlPct : null, "평단比 %", "sell"),
        pctRow("비용포함 수익률", stockExtra.gainFromCostPct, "매수수수료 포함", "sell"),
        row("누적 실현 순손익", summary.netProfit !== 0 ? fmtSigned(summary.netProfit) : summary.netProfit, undefined, "sell"),
        pctRow("누적 실현 수익률", summary.returnRate, undefined, "sell"),
        row("매수 총액", summary.buyAmount > 0 ? fmt(summary.buyAmount) : null),
        row("매도 총액", summary.sellAmount > 0 ? fmt(summary.sellAmount) : null),
      ],
    },
    {
      id: "peak-target",
      title: "고점 · 목표가",
      group: "portfolio",
      usedFor: tag("both"),
      rows: [
        row("추적 고점", peak?.price, "매수 관심 (−% 알림)", "buy"),
        row("고점 기록일", peak?.asOf),
        pctRow("고점 대비 하락률", dropFromPeak, `알림 기준 −${settings.buyDropFromPeakPct}%`, "buy"),
        row("사용자 목표가", targetPrice, "설정 탭에서 입력 · 미입력 시 (없음)", "sell"),
      ],
    },
    {
      id: "strategy",
      title: "전략 설정 (% 기준)",
      subtitle: "설정 탭에서 변경 가능",
      group: "config",
      usedFor: tag("both"),
      rows: [
        row("% 타이밍선 사용", settings.useTimingPctLines ? "켜짐" : "꺼짐"),
        row("고점 대비 매수 알림", `−${settings.buyDropFromPeakPct}%`, undefined, "buy"),
        row("평단 대비 매도 알림", `+${settings.sellGainFromAvgPct}%`, undefined, "sell"),
        row("매수 1·2차 %", `−${settings.buyTimingPct1}% / −${settings.buyTimingPct2}%`, undefined, "buy"),
        row("매도 1·2차 %", `+${settings.sellTimingPct1}% / +${settings.sellTimingPct2}%`, undefined, "sell"),
        row("브라우저 알림", settings.alertsEnabled ? "켜짐" : "꺼짐"),
      ],
    },
    {
      id: "snapshot-trend",
      title: "일별 스냅샷 · 추세",
      subtitle: "로컬 저장 일별 종가 기록",
      group: "portfolio",
      usedFor: tag("both"),
      rows: [
        row("스냅샷 건수", snapshots.length),
        row("추세 기간", spanDays > 0 ? `${spanDays}일` : null),
        pctRow("스냅샷 추세", snapshotTrendPct, "최근 구간 등락", "both"),
        pctRow("포트폴리오 수익률 변화", buildCtx?.portfolioReturnChange ?? null, "전일 스냅샷 대비 %p", "both"),
      ],
      listItems: snapshots.map((s) => ({
        title: s.date,
        meta: `종목가 ${s.stockPrices[stock.id] != null ? fmt(s.stockPrices[stock.id]) : "—"} · 포트폴리오 ${fmtSigned(s.portfolioTotalPnl)} (${fmtPct(s.portfolioTotalReturnRate)})`,
      })),
    },
    {
      id: "events",
      title: "기업 이벤트",
      subtitle: "분할 · 배당",
      group: "portfolio",
      usedFor: tag("both"),
      rows: stockEvents.length
        ? stockEvents.map((e) =>
            row(
              e.date,
              e.type === "split" ? `분할 ${e.ratio}:1` : e.type === "dividend" ? `배당 ${e.amount?.toLocaleString()}원/주` : e.type,
              e.memo
            )
          )
        : [row("등록된 이벤트", null, "KIS 미제공 · 기록 탭에서 직접 입력")],
    },
    {
      id: "stock-news",
      title: "종목 뉴스 · 공시 · 감성",
      group: "news",
      usedFor: tag("both"),
      rows: [
        row("감성 점수", stockContext != null ? stockContext.sentimentScore.toFixed(2) : null, "−1 ~ +1 · DART+RSS", "both"),
        row("감성 라벨", stockContext?.sentimentLabel),
        row("뉴스 건수", stockContext?.news.length ?? 0, "판단 탭에서 데이터 새로고침"),
        row("공시 건수", stockContext?.disclosures.length ?? 0, "DART_API_KEY + 6자리 종목코드"),
      ],
      listItems: [
        ...(stockContext?.news ?? []).map((n) => ({
          title: n.title,
          meta: `${n.source} · ${n.publishedAt ? new Date(n.publishedAt).toLocaleDateString("ko-KR") : ""}`,
          link: n.link,
        })),
        ...(stockContext?.disclosures ?? []).map((d) => ({
          title: d.title,
          meta: `${d.corpName} · ${d.date}`,
        })),
      ],
    },
  ];

  const summarySections: TimingSourceSection[] = [
    buildSummaryOverviewSection({
      price,
      quote,
      alpha,
      kosdaqAlpha,
      kospi,
      buySignal,
      sellSignal,
      stockContext,
      globalRisk,
      officialMacro,
      officialIndicators: marketContext?.officialIndicators ?? [],
      marketFlow,
      marketSent,
      verdict,
    }),
    {
      id: "signals",
      title: "타이밍선 신호",
      subtitle: "원천값 + 전략 설정으로 산출",
      group: "overview",
      usedFor: tag("both"),
      rows: [
        row("매수 신호", `${buySignal.label} — ${buySignal.status}`, buySignal.hint, "buy"),
        row("매도 신호", `${sellSignal.label} — ${sellSignal.status}`, sellSignal.hint, "sell"),
      ],
    },
  ];

  const tradeRecSection = buildTradeRecommendationSection(tradeRec);
  if (tradeRecSection) summarySections.push(tradeRecSection);

  if (verdict) {
    summarySections.push({
      id: "verdict-output",
      title: "판단 결과 (상세)",
      subtitle: "점수·구간·근거 목록",
      group: "overview",
      usedFor: tag("both"),
      rows: [
        row("매수 판단", verdict.buy.headline, undefined, "buy"),
        row("매수 신뢰도", `${verdict.buy.confidence}%`, undefined, "buy"),
        row("매수 목표가", verdict.buy.targetPrice, undefined, "buy"),
        row("매수 구간", `${fmt(verdict.buy.priceRange.min)} ~ ${fmt(verdict.buy.priceRange.max)}`, undefined, "buy"),
        row("매도 판단", verdict.sell.headline, undefined, "sell"),
        row("매도 신뢰도", `${verdict.sell.confidence}%`, undefined, "sell"),
        row("매도 목표가", verdict.sell.targetPrice, undefined, "sell"),
        row("매도 구간", `${fmt(verdict.sell.priceRange.min)} ~ ${fmt(verdict.sell.priceRange.max)}`, undefined, "sell"),
        pctRow("데이터 충실도 (매수)", verdict.buy.dataQuality * 100, "0~100%", "buy"),
        pctRow("데이터 충실도 (매도)", verdict.sell.dataQuality * 100, "0~100%", "sell"),
      ],
      listItems: [
        ...verdict.buy.reasons.map((r) => ({ title: `[매수] ${r}` })),
        ...verdict.sell.reasons.map((r) => ({ title: `[매도] ${r}` })),
      ],
    });
  }

  const stockSections = stockRawSections;

  const policyNews = (marketContext?.macroNews ?? []).filter(
    (n) => n.topic === "policy" || n.topic === "rates" || n.source.includes("Fed") || n.source.includes("한은")
  );

  const bokUsd = marketContext?.officialIndicators?.find((i) => i.id === "kr-usdkrw");

  const commonSections: TimingSourceSection[] = [
    {
      id: "kospi",
      title: "KOSPI 벤치마크",
      group: "domestic",
      usedFor: tag("both"),
      rows: [
        row("지수", kospi?.price),
        row("전일比", kospi != null ? fmtPct(kospi.changeRate) : null),
        row("원천", kospi?.source ? kospi.source.toUpperCase() : null, "KIS 실패 시 Yahoo 대체"),
        pctRow("종목 알파", alpha, "종목 등락 − KOSPI (%p)", "both"),
        row("갱신 시각", kospi?.updatedAt ? new Date(kospi.updatedAt).toLocaleString("ko-KR") : null),
      ],
    },
    {
      id: "kosdaq",
      title: "KOSDAQ 벤치마크",
      group: "domestic",
      usedFor: tag("both"),
      rows: [
        row("지수", kosdaq?.price),
        row("전일比", kosdaq != null ? fmtPct(kosdaq.changeRate) : null),
        row("원천", kosdaq?.source ? kosdaq.source.toUpperCase() : null, "KIS 실패 시 Yahoo 대체"),
        pctRow("종목 알파", kosdaqAlpha, "종목 등락 − KOSDAQ (%p)", "both"),
        row("갱신 시각", kosdaq?.updatedAt ? new Date(kosdaq.updatedAt).toLocaleString("ko-KR") : null),
      ],
    },
    {
      id: "market-breadth",
      title: "등락 종목 수 (시장 온도)",
      subtitle: "Naver Finance · KOSPI·KOSDAQ",
      group: "domestic",
      usedFor: tag("both"),
      rows: (marketContext?.marketBreadth ?? []).length
        ? (marketContext?.marketBreadth ?? []).flatMap((b) => [
            row(`${b.label} · 상승`, b.advance),
            row(`${b.label} · 하락`, b.decline),
            row(`${b.label} · 보합`, b.unchanged, b.source),
          ])
        : [row("breadth", null, "데이터 새로고침 필요")],
    },
    {
      id: "market-short-sale",
      title: "코스피 공매도 상위",
      subtitle: "KIS ranking/short-sale · 시장 지수 공매도는 API 미제공",
      group: "domestic",
      usedFor: tag("both"),
      rows: (marketContext?.marketShortSale ?? []).length
        ? [
            row("조회 종목", marketContext!.marketShortSale!.length),
            row(
              "1위",
              marketContext!.marketShortSale![0]!.stockName ?? marketContext!.marketShortSale![0]!.stockCode ?? null,
              marketContext!.marketShortSale![0]!.shortQty != null
                ? `공매도 ${fmtStockQty(marketContext!.marketShortSale![0]!.shortQty!)}`
                : undefined
            ),
          ]
        : [row("공매도 상위", null, "KIS 키 · 데이터 새로고침")],
      listItems: (marketContext?.marketShortSale ?? []).map((d) => ({
        title: d.stockName ?? d.stockCode ?? d.date,
        meta: [
          d.stockCode,
          d.shortQty != null ? `공매도 ${d.shortQty.toLocaleString()}주` : null,
          d.shortBalanceRate != null ? `비중 ${d.shortBalanceRate.toFixed(2)}%` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    },
    {
      id: "market-investor-flow",
      title: "코스피·코스닥 시장 수급",
      subtitle: "KIS 시장별 투자자 · 데이터 새로고침",
      group: "domestic",
      usedFor: tag("both"),
      rows: [
        ...(marketFlow?.note
          ? [
              row("시장 수급 요약", marketFlow.note),
              row("수급 점수", marketFlow.score.toFixed(2), "양수=외국인 유입 우호"),
            ]
          : []),
        ...(marketContext?.marketInvestorFlows ?? []).flatMap((f) => {
          const hasDaily = (f.daily?.length ?? 0) > 0;
          const offHoursHint = intradayHint(hasDaily, !!f.intraday);
          const confirmHint =
            f.intraday && !f.daily?.length ? "전일 확정 · 장 마감 후 데이터 새로고침" : undefined;
          const rows = [
            row(
              `${f.label} · 장중 외국인`,
              f.intraday?.foreignNetQty != null
                ? fmtStockQty(f.intraday.foreignNetQty)
                : intradayPlaceholder(hasDaily),
              f.intraday?.asOf ? `기준 ${f.intraday.asOf}` : offHoursHint
            ),
            row(
              `${f.label} · 장중 기관`,
              f.intraday?.institutionNetQty != null
                ? fmtStockQty(f.intraday.institutionNetQty)
                : intradayPlaceholder(hasDaily),
              offHoursHint
            ),
            row(
              `${f.label} · 장중 개인`,
              f.intraday?.personalNetQty != null
                ? fmtStockQty(f.intraday.personalNetQty)
                : intradayPlaceholder(hasDaily),
              offHoursHint
            ),
            row(
              `${f.label} · 확정 외국인`,
              f.daily?.[0]?.foreignNetQty != null
                ? fmtStockQty(f.daily[0].foreignNetQty)
                : f.intraday
                  ? "—"
                  : null,
              f.daily?.[0]?.date ? `일자 ${f.daily[0].date}` : confirmHint
            ),
            row(
              `${f.label} · 확정 기관`,
              f.daily?.[0]?.institutionNetQty != null
                ? fmtStockQty(f.daily[0].institutionNetQty)
                : f.intraday
                  ? "—"
                  : null,
              confirmHint
            ),
            row(
              `${f.label} · 확정 개인`,
              f.daily?.[0]?.personalNetQty != null
                ? fmtStockQty(f.daily[0].personalNetQty)
                : f.intraday
                  ? "—"
                  : null,
              confirmHint
            ),
          ];
          return rows;
        }),
        ...((marketContext?.marketInvestorFlows ?? []).length === 0
          ? [row("시장 수급", null, "KIS 키 설정 후 데이터 새로고침")]
          : []),
      ],
      listItems: (marketContext?.marketInvestorFlows ?? []).flatMap((f) =>
        (f.daily ?? []).slice(0, 5).map((d) => ({
          title: `${f.label} · ${d.date}`,
          meta: [
            d.foreignNetQty != null ? `외국인 ${fmtStockQty(d.foreignNetQty)}` : null,
            d.institutionNetQty != null ? `기관 ${fmtStockQty(d.institutionNetQty)}` : null,
            d.personalNetQty != null ? `개인 ${fmtStockQty(d.personalNetQty)}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
        }))
      ),
    },
    {
      id: "semicon-futures-risk",
      title: "반도체 · 선물 · 리스크 자산",
      subtitle: "SOX·대만·미국 선물·BTC · KOSPI 연동 참고",
      group: "global",
      usedFor: tag("both"),
      rows: (() => {
        const filtered = (marketContext?.globalIndices ?? []).filter((i) => semiconSymbols.has(i.symbol));
        return filtered.length > 0
          ? filtered.map((i) =>
              row(`${regionLabel(i.region)} · ${i.label}`, i.price.toLocaleString(), fmtPct(i.changeRate))
            )
          : [row("지수", null, "데이터 새로고침 필요")];
      })(),
      listItems: (marketContext?.globalIndices ?? [])
        .filter((i) => semiconSymbols.has(i.symbol))
        .map((i) => ({
          title: `${regionLabel(i.region)} · ${i.label}`,
          meta: `${fmtPct(i.changeRate)} · ${i.price.toLocaleString()}`,
        })),
    },
    {
      id: "global",
      title: "글로벌 주가지수",
      subtitle: "미국·일본·중국·영국·유럽 · Yahoo Finance",
      group: "global",
      usedFor: tag("both"),
      rows: globalRisk
        ? [
            row("리스크 요약", globalRisk.note),
            row("리스크 점수", globalRisk.score.toFixed(2), "음수=위험회피 · KOSPI 영향 참고"),
          ]
        : [row("지수 데이터", null, "데이터 새로고침 필요")],
      listItems: (marketContext?.globalIndices ?? []).map((i) => ({
        title: `${regionLabel(i.region)} · ${i.label}`,
        meta: `${fmtPct(i.changeRate)} · ${i.price.toLocaleString()}`,
      })),
    },
    {
      id: "macro-rates-commodities",
      title: "금리 · 달러 · 원자재",
      subtitle: "미국 국채·DXY·금·유가 · KOSPI 변동성·수출에 영향",
      group: "global",
      usedFor: tag("both"),
      rows: (marketContext?.macroInstruments ?? []).length
        ? (marketContext?.macroInstruments ?? []).map((m) =>
            row(
              `${regionLabel(m.region)} · ${m.label}`,
              m.unit === "%" ? `${m.price.toFixed(2)}%` : m.price.toLocaleString(),
              `${fmtPct(m.changeRate)} · ${m.unit ?? ""}`.trim()
            )
          )
        : [row("금리·원자재", null, "데이터 새로고침 필요")],
    },
    {
      id: "fx-major",
      title: "주요국 환율 (KRW)",
      subtitle: "Frankfurter · 전일比 포함",
      group: "global",
      usedFor: tag("both"),
      rows: (marketContext?.fxRates ?? []).length
        ? [
            ...(bokUsd
              ? [
                  row(
                    "BOK · 원/달러(공식)",
                    `${bokUsd.value.toLocaleString()}원`,
                    [`기준 ${bokUsd.asOf}`, bokUsd.changeValue != null ? `전일比 ${bokUsd.changeValue >= 0 ? "+" : ""}${bokUsd.changeValue.toFixed(2)}` : null]
                      .filter(Boolean)
                      .join(" · ")
                  ),
                ]
              : []),
            ...(marketContext?.fxRates ?? []).map((f) =>
              row(
                `${regionLabel(f.region)} · ${f.pair}`,
                f.pair.startsWith("JPY")
                  ? `100엔 ${Math.round(f.rate * 100).toLocaleString()}원`
                  : `${f.rate.toLocaleString(undefined, { maximumFractionDigits: 2 })}원`,
                fmtPct(f.changeRate)
              )
            ),
          ]
        : marketContext?.fx
          ? [
              row("USD/KRW", `${Math.round(marketContext.fx.rate).toLocaleString()}원`, fmtPct(marketContext.fx.changeRate)),
            ]
          : [row("환율", null, "데이터 새로고침 필요")],
    },
    {
      id: "official-indicators",
      title: "공식 경제지표",
      subtitle: "FRED(미국) · 한국은행 ECOS · CPI·GDP·기준금리",
      group: "global",
      usedFor: tag("both"),
      rows: [
        ...(officialMacro
          ? [
              row("거시 요약", officialMacro.note),
              row("거시 점수", officialMacro.score.toFixed(2), "음수=긴축·인플레 우려"),
            ]
          : []),
        ...(marketContext?.officialIndicators ?? []).map((ind) =>
          row(
            `${regionLabel(ind.region)} · ${ind.label}`,
            ind.unit === "%" || ind.unit === "지수"
              ? ind.unit === "%"
                ? `${ind.value.toFixed(2)}%`
                : ind.value.toFixed(2)
              : String(ind.value),
            [
              ind.changeValue != null && ind.changeLabel
                ? `${ind.changeLabel} ${ind.changeValue >= 0 ? "+" : ""}${
                    ind.unit === "%" || ind.changeLabel.includes("p.p.")
                      ? ind.changeValue.toFixed(2)
                      : ind.changeValue.toFixed(2)
                  }${ind.changeLabel.includes("%") ? "%" : ind.changeLabel.includes("p.p.") ? "" : ""}`
                : null,
              `기준 ${ind.asOf}`,
              ind.source,
            ]
              .filter(Boolean)
              .join(" · ")
          )
        ),
        ...((marketContext?.officialIndicators ?? []).length === 0
          ? [row("공식 지표", null, "FRED_API_KEY · BOK_API_KEY 설정 후 새로고침")]
          : []),
      ],
    },
    {
      id: "policy-news",
      title: "통화정책 · Fed/한은",
      subtitle: "Fed RSS · 한은·금리 RSS (거시 뉴스에서 추출)",
      group: "news",
      usedFor: tag("both"),
      rows: [
        row("정책·금리 뉴스", policyNews.length),
        row(
          "미국·Fed",
          policyNews.filter((n) => n.region === "US").length
        ),
        row(
          "한국·한은",
          policyNews.filter((n) => n.region === "KR").length
        ),
      ],
      listItems: policyNews.map((n) => ({
        title: n.title,
        meta: [n.source, n.publishedAt ? new Date(n.publishedAt).toLocaleDateString("ko-KR") : null]
          .filter(Boolean)
          .join(" · "),
        link: n.link,
      })),
    },
    {
      id: "macro-news",
      title: "거시 · 국제정세 뉴스",
      subtitle: "미·일·중·영 금리·경제·지정학 · Google RSS",
      group: "news",
      usedFor: tag("both"),
      rows: [
        row("뉴스 건수", marketContext?.macroNews.length ?? 0),
        row(
          "미국",
          marketContext?.macroNews.filter((n) => n.region === "US").length ?? 0,
          "금리·경제지표"
        ),
        row(
          "일본·중국·영국",
          marketContext?.macroNews.filter((n) => n.region === "JP" || n.region === "CN" || n.region === "UK").length ?? 0
        ),
        row(
          "국제정세·에너지",
          marketContext?.macroNews.filter((n) => n.topic === "geopolitics" || n.source.includes("에너지")).length ?? 0
        ),
        row(
          "통화정책",
          marketContext?.macroNews.filter((n) => n.topic === "policy" || n.topic === "rates").length ?? 0,
          "Fed·한은 RSS"
        ),
      ],
      listItems: (marketContext?.macroNews ?? []).map((n) => ({
        title: n.title,
        meta: [regionLabel(n.region), n.topic, n.source].filter(Boolean).join(" · "),
        link: n.link,
      })),
    },
    {
      id: "market-news",
      title: "시장 뉴스 · 감성",
      subtitle: "국내·미국 증시 헤드라인",
      group: "news",
      usedFor: tag("both"),
      rows: [
        row("시장 감성 점수", marketSent ? marketSent.score.toFixed(2) : null),
        row("시장 감성 라벨", marketSent?.label),
        row("뉴스 건수", marketContext?.marketNews.length ?? 0),
      ],
      listItems: (marketContext?.marketNews ?? []).map((n) => ({
        title: n.title,
        meta: n.source,
        link: n.link,
      })),
    },
    {
      id: "sources",
      title: "데이터 수집 상태",
      subtitle: marketContext?.fetchedAt
        ? `마지막 수집 ${new Date(marketContext.fetchedAt).toLocaleString("ko-KR")}`
        : undefined,
      group: "meta",
      usedFor: tag("both"),
      rows: (marketContext?.sources ?? []).map((s) =>
        row(s.label, s.ok ? "OK" : "실패", s.note)
      ),
      listItems: (marketContext?.errors ?? []).map((e) => ({ title: e, meta: "오류" })),
    },
  ];

  const allSections = [...summarySections, ...stockSections, ...commonSections];

  return {
    stockId: stock.id,
    stockName: stock.name,
    stockCode: stock.code,
    summarySections,
    stockSections,
    commonSections,
    fetchedAt: marketContext?.fetchedAt,
    missingCount: countMissing(allSections),
  };
}
