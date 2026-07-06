/** 코스피·코스닥 종목 발굴 — KIS 순위 + 시장·거시 컨텍스트 */

import { fmt, fmtPct } from "@/lib/calc";
import type { MarketBriefingContext } from "./types";
import type { KisMarketBoard, KisRankingRow, MarketRankingsBundle } from "@/lib/kis/ranking";
import { summarizeGlobalRisk } from "./providers/globalMarket";
import { summarizeOfficialMacro } from "./providers/officialIndicators";
import { summarizeMarketInvestorFlow } from "./marketFlow";

export type DiscoverySignal = "volume" | "gainer" | "foreign_buy";

export type DiscoveryReasonImpact = "positive" | "neutral" | "negative";

/** 종목별 상세 추천 근거 */
export interface DiscoveryReasonDetail {
  category: "signal" | "price" | "combo" | "market" | "score" | "caution";
  title: string;
  body: string;
  impact: DiscoveryReasonImpact;
}

export interface DiscoveryPick {
  rank: number;
  stockCode: string;
  stockName: string;
  price: number;
  changeRate: number;
  score: number;
  market: KisMarketBoard;
  signals: DiscoverySignal[];
  /** 한 줄 요약 */
  summary: string;
  /** 상세 근거 (UI 표시용) */
  reasonDetails: DiscoveryReasonDetail[];
  /** 하위 호환·간략 목록 */
  reasons: string[];
  inPortfolio?: boolean;
}

export interface DiscoveryMarketGate {
  score: number;
  note: string;
  caution: boolean;
}

export interface StockDiscoveryReport {
  fetchedAt: string;
  gate: DiscoveryMarketGate;
  kospi: DiscoveryPick[];
  kosdaq: DiscoveryPick[];
  rankings: {
    kospi: MarketRankingsBundle;
    kosdaq: MarketRankingsBundle;
  } | null;
  sources: { id: string; label: string; ok: boolean; note?: string }[];
  errors: string[];
}

const MARKET_LABEL: Record<KisMarketBoard, string> = {
  KSP: "코스피",
  KSQ: "코스닥",
};

const SIGNAL_META: Record<
  DiscoverySignal,
  { label: string; weight: number; explain: string }
> = {
  volume: {
    label: "거래대금",
    weight: 1.4,
    explain: "당일 누적 거래대금이 시장 상위권 — 유동성·관심도가 높아 추적 후보로 선정",
  },
  gainer: {
    label: "등락률",
    weight: 1.8,
    explain: "전일 대비 상승률 상위 — 단기 가격 모멘텀이 강한 구간",
  },
  foreign_buy: {
    label: "외국인 순매수",
    weight: 2.2,
    explain: "외국인 순매수 상위 — 글로벌 수급 유입 신호",
  },
};

function rankPoints(rank: number, weight: number): number {
  if (rank <= 0 || rank > 30) return 0;
  return (31 - rank) * weight;
}

function normalizeStockCode(code: string): string {
  return code.replace(/\D/g, "").padStart(6, "0").slice(-6);
}

function fmtCompactWon(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
  if (abs >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만원`;
  return `${n.toLocaleString()}원`;
}

function fmtShares(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 10_000) return `${(n / 10_000).toFixed(1)}만주`;
  return `${n.toLocaleString()}주`;
}

function buildMarketGate(ctx: MarketBriefingContext | null): DiscoveryMarketGate {
  if (!ctx) {
    return { score: 0, note: "시장 데이터 없음 — 새로고침하세요", caution: true };
  }

  const global = summarizeGlobalRisk(ctx.globalIndices, ctx.macroInstruments, ctx.fxRates);
  const macro = summarizeOfficialMacro(ctx.officialIndicators);
  const flow = summarizeMarketInvestorFlow(ctx.marketInvestorFlows ?? []);

  let score = global.score * 0.45 + macro.score * 0.25 + flow.score * 0.3;
  const notes = [global.note, macro.note, flow.note].filter(Boolean);

  const kospiBreadth = ctx.marketBreadth?.find((b) => b.label.includes("KOSPI"));
  if (kospiBreadth && kospiBreadth.decline > kospiBreadth.advance * 1.4) {
    score -= 0.35;
    notes.push(`KOSPI 약세 breadth (${kospiBreadth.decline}↓/${kospiBreadth.advance}↑)`);
  }

  const vix = ctx.globalIndices.find((i) => i.symbol === "VIX");
  if (vix && vix.changeRate > 8) {
    score -= 0.4;
    notes.push(`VIX 급등 ${vix.changeRate.toFixed(1)}%`);
  }

  const caution = score < -0.35;
  const note = notes.slice(0, 3).join(" · ") || (caution ? "시장 환경 주의" : "시장 환경 양호");

  return { score, note, caution };
}

interface SignalSnapshot {
  signal: DiscoverySignal;
  row: KisRankingRow;
  points: number;
}

interface CandidateAcc {
  stockCode: string;
  stockName: string;
  price: number;
  changeRate: number;
  signals: Set<DiscoverySignal>;
  signalSnapshots: SignalSnapshot[];
  rankScore: number;
}

function ingestList(
  map: Map<string, CandidateAcc>,
  rows: KisRankingRow[],
  signal: DiscoverySignal,
  weight: number
) {
  for (const row of rows) {
    const key = normalizeStockCode(row.stockCode);
    const pts = rankPoints(row.rank, weight);

    const existing = map.get(key);
    if (existing) {
      existing.signals.add(signal);
      existing.rankScore += pts;
      existing.signalSnapshots.push({ signal, row, points: pts });
      existing.price = row.price || existing.price;
      existing.changeRate = row.changeRate ?? existing.changeRate;
      if (row.stockName) existing.stockName = row.stockName;
    } else {
      map.set(key, {
        stockCode: key,
        stockName: row.stockName,
        price: row.price,
        changeRate: row.changeRate,
        signals: new Set([signal]),
        signalSnapshots: [{ signal, row, points: pts }],
        rankScore: pts,
      });
    }
  }
}

function describeSignalSnapshot(market: KisMarketBoard, snap: SignalSnapshot): DiscoveryReasonDetail {
  const { signal, row, points } = snap;
  const meta = SIGNAL_META[signal];
  const mkt = MARKET_LABEL[market];
  const parts: string[] = [`${mkt} ${meta.label} 순위 ${row.rank}위`];

  if (row.price > 0) parts.push(`현재가 ${fmt(row.price)}`);
  if (row.changeRate !== 0) parts.push(`전일比 ${fmtPct(row.changeRate)}`);
  if (row.tradeAmount != null && row.tradeAmount > 0) {
    parts.push(`누적 거래대금 ${fmtCompactWon(row.tradeAmount)}`);
  }
  if (row.volume != null && row.volume > 0) {
    parts.push(`거래량 ${fmtShares(row.volume)}`);
  }
  if (row.netBuyQty != null && row.netBuyQty !== 0 && signal === "foreign_buy") {
    parts.push(`외국인 순매수 ${fmtShares(row.netBuyQty)}`);
  }

  parts.push(`순위 가중 +${points.toFixed(1)}점`);
  parts.push(meta.explain);

  return {
    category: "signal",
    title: `${meta.label} ${row.rank}위`,
    body: parts.join(" · "),
    impact: "positive",
  };
}

function describePrice(changeRate: number, bonus: number): DiscoveryReasonDetail | null {
  if (changeRate > 0.3) {
    return {
      category: "price",
      title: "당일 등락 반영",
      body: `전일比 ${fmtPct(changeRate)} 상승 구간 — 모멘텀 가중 +${bonus.toFixed(1)}점`,
      impact: "positive",
    };
  }
  if (changeRate < -7) {
    return {
      category: "price",
      title: "급락 주의",
      body: `전일比 ${fmtPct(changeRate)} — 급락 종목은 발굴 점수에서 -8점`,
      impact: "negative",
    };
  }
  if (changeRate <= 0 && changeRate > -7) {
    return {
      category: "price",
      title: "당일 등락",
      body: `전일比 ${fmtPct(changeRate)} — 순위 진입은 수급·거래대금 기준, 당일 약세`,
      impact: "neutral",
    };
  }
  return null;
}

function describeCombo(signalCount: number, bonus: number): DiscoveryReasonDetail | null {
  if (signalCount < 2) return null;
  const labels =
    signalCount >= 3
      ? "거래대금·등락률·외국인 순매수 3개 순위 모두 상위"
      : "2개 이상 순위(거래대금·등락·외국인) 동시 진입";
  return {
    category: "combo",
    title: signalCount >= 3 ? "복합 신호 (3중)" : "복합 신호 (2중)",
    body: `${labels} — 단기 모멘텀·유동성·외국인 수급이 겹침 · 보너스 +${bonus}점`,
    impact: "positive",
  };
}

function describeMarketContext(
  market: KisMarketBoard,
  gate: DiscoveryMarketGate,
  ctx: MarketBriefingContext | null,
  stockCode: string
): DiscoveryReasonDetail[] {
  const out: DiscoveryReasonDetail[] = [];
  const mkt = MARKET_LABEL[market];
  const flowKey = market === "KSP" ? "KSP" : "KSQ";
  const flow = ctx?.marketInvestorFlows?.find((f) => f.market === flowKey);

  if (flow) {
    const foreign =
      flow.intraday?.foreignNetQty ?? flow.daily?.[0]?.foreignNetQty;
    if (foreign != null && foreign !== 0) {
      const sign = foreign > 0 ? "순매수" : "순매도";
      out.push({
        category: "market",
        title: `${mkt} 시장 외국인`,
        body: `시장 전체 외국인 ${sign} ${fmtShares(foreign)} — 개별 종목 외국인 순위와 함께 참고`,
        impact: foreign > 0 ? "positive" : "negative",
      });
    }
  }

  const breadth = ctx?.marketBreadth?.find((b) =>
    market === "KSP" ? b.label.includes("KOSPI") : b.label.includes("KOSDAQ")
  );
  if (breadth) {
    const ratio = breadth.advance / Math.max(breadth.decline, 1);
    out.push({
      category: "market",
      title: `${mkt} breadth`,
      body: `상승 ${breadth.advance} / 하락 ${breadth.decline} / 보합 ${breadth.unchanged} — ${
        ratio >= 1.2 ? "시장 분위기 우호" : ratio <= 0.7 ? "하락 종목 우세" : "혼조"
      }`,
      impact: ratio >= 1.2 ? "positive" : ratio <= 0.7 ? "negative" : "neutral",
    });
  }

  const shortRow = ctx?.marketShortSale?.find(
    (s) => s.stockCode && normalizeStockCode(s.stockCode) === stockCode
  );
  if (shortRow) {
    out.push({
      category: "caution",
      title: "공매도 상위 주의",
      body: `코스피 공매도 상위 목록 포함${
        shortRow.shortBalanceRate != null ? ` · 공매도 비중 ${shortRow.shortBalanceRate.toFixed(2)}%` : ""
      } — 숏 포지션 리스크 참고`,
      impact: "negative",
    });
  }

  if (gate.caution) {
    out.push({
      category: "caution",
      title: "시장 환경 할인",
      body: `글로벌·거시·수급 종합 점수 ${gate.score.toFixed(2)} (주의 구간) — 종목 점수에 ×0.65 적용`,
      impact: "negative",
    });
  } else if (gate.score > 0.2) {
    out.push({
      category: "market",
      title: "시장 환경",
      body: `글로벌·거시·수급 종합 양호 (점수 ${gate.score.toFixed(2)}) — 발굴 점수 전액 반영`,
      impact: "positive",
    });
  }

  return out;
}

function buildSummary(signals: DiscoverySignal[], signalCount: number, changeRate: number): string {
  const names = signals.map((s) => SIGNAL_META[s].label);
  if (signalCount >= 3) {
    return `거래대금·등락·외국인 3대 순위 동시 상위 — 복합 수급·모멘텀 관심 종목`;
  }
  if (signalCount >= 2) {
    return `${names.join("+")} 순위 겹침 — ${changeRate >= 0 ? "상승" : "보합/하락"} 흐름 속 수급 주목`;
  }
  return `${names[0]} 순위 상위 — ${SIGNAL_META[signals[0]].explain.split("—")[0].trim()}`;
}

function finalizePick(
  c: CandidateAcc,
  bundle: MarketRankingsBundle,
  gate: DiscoveryMarketGate,
  ctx: MarketBriefingContext | null,
  portfolioCodes: Set<string>,
  rawScore: number
): DiscoveryPick {
  const signalCount = c.signals.size;
  const comboBonus = (signalCount >= 2 ? 4 : 0) + (signalCount >= 3 ? 6 : 0);
  const changeBonus = c.changeRate > 0 ? Math.min(4, c.changeRate * 0.35) : 0;
  const changePenalty = c.changeRate < -7 ? 8 : 0;
  const multiplier = gate.caution ? 0.65 : 1;

  const reasonDetails: DiscoveryReasonDetail[] = [];

  const orderedSignals: DiscoverySignal[] = ["foreign_buy", "gainer", "volume"];
  for (const sig of orderedSignals) {
    const snaps = c.signalSnapshots.filter((s) => s.signal === sig);
    if (snaps.length > 0) {
      reasonDetails.push(describeSignalSnapshot(bundle.market, snaps[0]));
    }
  }

  const priceDetail = describePrice(c.changeRate, changeBonus);
  if (priceDetail) reasonDetails.push(priceDetail);

  const comboDetail = describeCombo(signalCount, comboBonus);
  if (comboDetail) reasonDetails.push(comboDetail);

  reasonDetails.push(...describeMarketContext(bundle.market, gate, ctx, c.stockCode));

  reasonDetails.push({
    category: "score",
    title: "종합 점수 산출",
    body: [
      `순위 가중 합 ${c.rankScore.toFixed(1)}점`,
      comboBonus > 0 ? `복수 신호 +${comboBonus}점` : null,
      changeBonus > 0 ? `등락 가중 +${changeBonus.toFixed(1)}점` : null,
      changePenalty > 0 ? `급락 -${changePenalty}점` : null,
      gate.caution ? "시장 할인 ×0.65" : null,
      `→ 최종 ${rawScore.toFixed(1)}점`,
    ]
      .filter(Boolean)
      .join(" · "),
    impact: rawScore >= 15 ? "positive" : rawScore >= 8 ? "neutral" : "negative",
  });

  const reasons = reasonDetails
    .filter((r) => r.category === "signal" || r.category === "combo")
    .map((r) => `${r.title}: ${r.body.split(" · ")[0]}`);

  return {
    rank: 0,
    stockCode: c.stockCode,
    stockName: c.stockName,
    price: c.price,
    changeRate: c.changeRate,
    score: Math.round(rawScore * 10) / 10,
    market: bundle.market,
    signals: [...c.signals],
    summary: buildSummary([...c.signals], signalCount, c.changeRate),
    reasonDetails,
    reasons,
    inPortfolio: portfolioCodes.has(c.stockCode),
  };
}

function scoreMarket(
  bundle: MarketRankingsBundle,
  gate: DiscoveryMarketGate,
  ctx: MarketBriefingContext | null,
  portfolioCodes: Set<string>
): DiscoveryPick[] {
  const map = new Map<string, CandidateAcc>();

  ingestList(map, bundle.volume, "volume", SIGNAL_META.volume.weight);
  ingestList(map, bundle.gainers, "gainer", SIGNAL_META.gainer.weight);
  ingestList(map, bundle.foreignBuy, "foreign_buy", SIGNAL_META.foreign_buy.weight);

  const multiplier = gate.caution ? 0.65 : 1;
  const picks: DiscoveryPick[] = [];

  for (const c of map.values()) {
    let score = c.rankScore;
    const signalCount = c.signals.size;
    if (signalCount >= 2) score += 4;
    if (signalCount >= 3) score += 6;
    if (c.changeRate > 0) score += Math.min(4, c.changeRate * 0.35);
    if (c.changeRate < -7) score -= 8;
    score *= multiplier;

    if (score < 3) continue;

    picks.push(finalizePick(c, bundle, gate, ctx, portfolioCodes, score));
  }

  picks.sort((a, b) => b.score - a.score);
  return picks.slice(0, 10).map((p, i) => ({ ...p, rank: i + 1 }));
}

export function buildStockDiscoveryReport({
  marketContext,
  rankings,
  portfolioCodes = [],
  errors = [],
}: {
  marketContext: MarketBriefingContext | null;
  rankings: { kospi: MarketRankingsBundle; kosdaq: MarketRankingsBundle } | null;
  portfolioCodes?: string[];
  errors?: string[];
}): StockDiscoveryReport {
  const fetchedAt = new Date().toISOString();
  const gate = buildMarketGate(marketContext);
  const codes = new Set(portfolioCodes.map(normalizeStockCode));

  const sources: StockDiscoveryReport["sources"] = [
    {
      id: "kis-rank",
      label: "KIS · 순위 (거래량·등락·외국인)",
      ok: !!rankings,
      note: rankings ? "코스피·코스닥 각 30건" : "KIS 키 또는 API 오류",
    },
    {
      id: "market-context",
      label: "시장·거시·수급",
      ok: !!marketContext,
      note: marketContext ? "브리핑 컨텍스트 재사용" : "데이터 새로고침 필요",
    },
  ];

  if (!rankings) {
    return {
      fetchedAt,
      gate,
      kospi: [],
      kosdaq: [],
      rankings: null,
      sources,
      errors,
    };
  }

  return {
    fetchedAt,
    gate,
    kospi: scoreMarket(rankings.kospi, gate, marketContext, codes),
    kosdaq: scoreMarket(rankings.kosdaq, gate, marketContext, codes),
    rankings,
    sources,
    errors,
  };
}
