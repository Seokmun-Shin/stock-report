/**
 * KIS 수급·호가·프로그램 — 매매 판단 점수 반영
 */

import type { StockQuote } from "../types";

interface ScoredFactor {
  buy: number;
  sell: number;
  text: string;
  side: "buy" | "sell" | "both";
}

function fmtQty(n: number) {
  return `${n.toLocaleString()}주`;
}

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function applyKisMarketFactors(
  quote: StockQuote | undefined,
  holdingQty: number
): { buyDelta: number; sellDelta: number; factors: ScoredFactor[] } {
  const factors: ScoredFactor[] = [];
  let buyDelta = 0;
  let sellDelta = 0;
  if (!quote?.kis) return { buyDelta, sellDelta, factors };

  const inv = quote.kis.investor;
  if (inv) {
    if (inv.foreignNetQty != null && inv.foreignNetQty !== 0) {
      const q = inv.foreignNetQty;
      if (q > 0) {
        const pts = q >= 100_000 ? 10 : q >= 10_000 ? 7 : 4;
        buyDelta += pts;
        factors.push({ buy: pts, sell: 0, text: `외국인 순매수 ${fmtQty(q)}`, side: "buy" });
      } else {
        const pts = q <= -100_000 ? 8 : 5;
        sellDelta += pts;
        factors.push({ buy: 0, sell: pts, text: `외국인 순매도 ${fmtQty(Math.abs(q))}`, side: "sell" });
      }
    }
    if (inv.institutionNetQty != null && inv.institutionNetQty !== 0) {
      const q = inv.institutionNetQty;
      if (q > 0) {
        const pts = q >= 50_000 ? 7 : 4;
        buyDelta += pts;
        factors.push({ buy: pts, sell: 0, text: `기관 순매수 ${fmtQty(q)}`, side: "buy" });
      } else if (holdingQty > 0) {
        const pts = 4;
        sellDelta += pts;
        factors.push({ buy: 0, sell: pts, text: `기관 순매도 ${fmtQty(Math.abs(q))}`, side: "sell" });
      }
    }
    if (inv.personalNetQty != null && Math.abs(inv.personalNetQty) >= 100_000) {
      const q = inv.personalNetQty;
      if (q < 0) {
        buyDelta += 3;
        factors.push({ buy: 3, sell: 0, text: `개인 순매도 ${fmtQty(Math.abs(q))} (역발상)`, side: "buy" });
      }
    }
  }

  const prog = quote.kis.program;
  if (prog?.netBuyQty != null && prog.netBuyQty !== 0) {
    if (prog.netBuyQty > 0) {
      buyDelta += 5;
      factors.push({ buy: 5, sell: 0, text: `프로그램 순매수 ${fmtQty(prog.netBuyQty)}`, side: "buy" });
    } else if (holdingQty > 0) {
      sellDelta += 4;
      factors.push({ buy: 0, sell: 4, text: `프로그램 순매도 ${fmtQty(Math.abs(prog.netBuyQty))}`, side: "sell" });
    }
  }

  const ob = quote.kis.orderBook;
  if (ob?.totalBidQty && ob?.totalAskQty && ob.totalAskQty > 0) {
    const ratio = ob.totalBidQty / ob.totalAskQty;
    if (ratio >= 1.25) {
      buyDelta += 4;
      factors.push({
        buy: 4,
        sell: 0,
        text: `호가 잔량 매수우위 (${ratio.toFixed(2)}배)`,
        side: "buy",
      });
    } else if (ratio <= 0.8 && holdingQty > 0) {
      sellDelta += 3;
      factors.push({
        buy: 0,
        sell: 3,
        text: `호가 잔량 매도우위 (${ratio.toFixed(2)}배)`,
        side: "sell",
      });
    }
  }

  const daily = quote.kis.investorDaily;
  if (daily?.length) {
    const recent = daily.slice(0, 5).filter((d) => d.foreignNetQty != null);
    if (recent.length >= 3) {
      const sum = recent.reduce((s, d) => s + (d.foreignNetQty ?? 0), 0);
      if (sum >= 200_000) {
        buyDelta += 6;
        factors.push({
          buy: 6,
          sell: 0,
          text: `외국인 ${recent.length}일 누적 순매수 ${fmtQty(sum)}`,
          side: "buy",
        });
      } else if (sum <= -200_000) {
        const pts = holdingQty > 0 ? 5 : 3;
        sellDelta += pts;
        factors.push({
          buy: 0,
          sell: pts,
          text: `외국인 ${recent.length}일 누적 순매도 ${fmtQty(Math.abs(sum))}`,
          side: "sell",
        });
      }
    }
  }

  const ext = quote.kis.extended;
  if (ext?.week52High && ext?.week52Low && quote.price > 0) {
    const range = ext.week52High - ext.week52Low;
    if (range > 0) {
      const pos = (quote.price - ext.week52Low) / range;
      if (pos >= 0.88 && holdingQty > 0) {
        sellDelta += 4;
        factors.push({
          buy: 0,
          sell: 4,
          text: `52주 고점권 (${(pos * 100).toFixed(0)}% 구간)`,
          side: "sell",
        });
      } else if (pos <= 0.2) {
        buyDelta += 4;
        factors.push({
          buy: 4,
          sell: 0,
          text: `52주 저점권 (${(pos * 100).toFixed(0)}% 구간)`,
          side: "buy",
        });
      }
    }
  }

  if (ext?.foreignOwnershipPct != null) {
    const pct = ext.foreignOwnershipPct;
    if (pct >= 55 && holdingQty > 0) {
      sellDelta += 2;
      factors.push({
        buy: 0,
        sell: 2,
        text: `외국인 지분 ${pct.toFixed(1)}% (매도 민감)`,
        side: "sell",
      });
    } else if (pct >= 40 && pct < 55) {
      buyDelta += 1;
      factors.push({
        buy: 1,
        sell: 0,
        text: `외국인 지분 ${pct.toFixed(1)}%`,
        side: "buy",
      });
    }
  }

  if (ext?.volume && ext.volume >= 1_000_000 && quote.changeRate <= -2) {
    buyDelta += 3;
    factors.push({
      buy: 3,
      sell: 0,
      text: `거래량 ${fmtQty(ext.volume)} · 급락 (${fmtPct(quote.changeRate)})`,
      side: "buy",
    });
  }

  return { buyDelta, sellDelta, factors };
}

export function kisDataQualityBoost(quote: StockQuote | undefined): number {
  if (!quote?.kis) return 0;
  let q = 0;
  if (quote.kis.investor) q += 0.08;
  if (quote.kis.investorDaily?.length) q += 0.06;
  if (quote.kis.orderBook) q += 0.05;
  if (quote.kis.program) q += 0.04;
  if (quote.kis.extended?.volume) q += 0.04;
  if (quote.kis.extended?.foreignOwnershipPct != null) q += 0.03;
  if (quote.kis.extended?.week52High) q += 0.02;
  return q;
}
