/** 글로벌 지수·환율 — macroGlobal 위임 + 리스크 요약 */

import type { FxSnapshot, GlobalIndexSnapshot, MacroInstrumentSnapshot } from "../types";
import {
  fetchExtendedGlobalIndices,
  fetchMacroInstruments,
  fetchMajorFxRates,
  fetchUsdKrwWithChange,
} from "./macroGlobal";

export {
  fetchExtendedGlobalIndices as fetchGlobalIndices,
  fetchMacroInstruments,
  fetchMajorFxRates,
  fetchUsdKrwWithChange as fetchUsdKrw,
};

const REGION_LABEL: Record<string, string> = {
  US: "미국",
  JP: "일본",
  CN: "중국",
  TW: "대만",
  UK: "영국",
  EU: "유럽",
  GLOBAL: "글로벌",
  KR: "한국",
};

export function summarizeGlobalRisk(
  indices: GlobalIndexSnapshot[],
  macro: MacroInstrumentSnapshot[] = [],
  fxRates: FxSnapshot[] = []
): { score: number; note: string } {
  let score = 0;
  const notes: string[] = [];

  const sp = indices.find((i) => i.symbol === "SP500");
  const nasdaq = indices.find((i) => i.symbol === "NASDAQ");
  const rut = indices.find((i) => i.symbol === "RUT");
  const es = indices.find((i) => i.symbol === "ES");
  const nq = indices.find((i) => i.symbol === "NQ");
  const vix = indices.find((i) => i.symbol === "VIX");
  const vix3m = indices.find((i) => i.symbol === "VIX3M");
  const sox = indices.find((i) => i.symbol === "SOX");
  const taiex = indices.find((i) => i.symbol === "TAIEX");
  const btc = indices.find((i) => i.symbol === "BTC");
  const nikkei = indices.find((i) => i.symbol === "NIKKEI");
  const hsi = indices.find((i) => i.symbol === "HSI" || i.symbol === "CSI300");
  const ftse = indices.find((i) => i.symbol === "FTSE");

  if (sp) {
    if (sp.changeRate > 0.5) {
      score += 0.45;
      notes.push(`S&P500 +${sp.changeRate.toFixed(2)}%`);
    } else if (sp.changeRate < -1) {
      score -= 0.45;
      notes.push(`S&P500 ${sp.changeRate.toFixed(2)}%`);
    }
  }

  for (const idx of [nasdaq, rut]) {
    if (!idx) continue;
    if (idx.changeRate <= -1.5) {
      score -= 0.15;
      notes.push(`${idx.label} ${idx.changeRate.toFixed(2)}%`);
    } else if (idx.changeRate >= 1) {
      score += 0.1;
    }
  }

  for (const fut of [es, nq]) {
    if (!fut) continue;
    if (fut.changeRate <= -0.8) {
      score -= 0.12;
      notes.push(`${fut.label} ${fut.changeRate.toFixed(2)}%`);
    } else if (fut.changeRate >= 0.8) {
      score += 0.1;
    }
  }

  if (vix) {
    if (vix.price >= 25) {
      score -= 0.7;
      notes.push(`VIX ${vix.price.toFixed(1)}↑`);
    } else if (vix.price <= 15) {
      score += 0.25;
    }
  }

  if (vix && vix3m && vix3m.price > 0) {
    const term = vix.price - vix3m.price;
    if (term >= 3) {
      score -= 0.2;
      notes.push(`VIX term +${term.toFixed(1)} (근단 공포)`);
    }
  }

  if (sox) {
    if (sox.changeRate <= -2) {
      score -= 0.25;
      notes.push(`반도체 ${sox.changeRate.toFixed(2)}%`);
    } else if (sox.changeRate >= 1.5) {
      score += 0.15;
    }
  }

  if (taiex && taiex.changeRate <= -1.5) {
    score -= 0.12;
    notes.push(`대만 ${taiex.changeRate.toFixed(2)}%`);
  }

  if (btc && Math.abs(btc.changeRate) >= 3) {
    if (btc.changeRate <= -4) {
      score -= 0.1;
      notes.push(`BTC ${btc.changeRate.toFixed(1)}%`);
    } else if (btc.changeRate >= 4) {
      score += 0.08;
    }
  }

  for (const idx of [nikkei, hsi, ftse]) {
    if (!idx) continue;
    const tag = REGION_LABEL[idx.region ?? ""] ?? idx.label;
    if (idx.changeRate <= -1.5) {
      score -= 0.2;
      notes.push(`${tag} ${idx.changeRate.toFixed(2)}%`);
    } else if (idx.changeRate >= 1) {
      score += 0.15;
    }
  }

  const us10y = macro.find((m) => m.symbol === "US10Y");
  const us3m = macro.find((m) => m.symbol === "US3M");
  if (us10y && us10y.changeRate >= 2) {
    score -= 0.15;
    notes.push(`美10년금리 ${us10y.price.toFixed(2)}% (+${us10y.changeRate.toFixed(2)}%p)`);
  }
  if (us10y && us3m && us10y.price - us3m.price < 0) {
    score -= 0.12;
    notes.push(`美 수익률 역전 (${(us10y.price - us3m.price).toFixed(2)}%p)`);
  }

  const dxy = macro.find((m) => m.symbol === "DXY");
  if (dxy && dxy.changeRate >= 0.4) {
    score -= 0.1;
    notes.push(`달러강세 DXY +${dxy.changeRate.toFixed(2)}%`);
  }

  const oil = macro.find((m) => m.symbol === "OIL");
  if (oil && oil.changeRate >= 2) {
    score -= 0.1;
    notes.push(`유가 +${oil.changeRate.toFixed(2)}%`);
  }

  const copper = macro.find((m) => m.symbol === "COPPER");
  if (copper && copper.changeRate <= -1.5) {
    score -= 0.08;
    notes.push(`구리 ${copper.changeRate.toFixed(2)}%`);
  }

  const gold = macro.find((m) => m.symbol === "GOLD");
  if (gold && gold.changeRate >= 1.5 && sp && sp.changeRate < -0.5) {
    score -= 0.08;
    notes.push(`금↑·주식↓ (위험회피)`);
  }

  const usdKrw = fxRates.find((f) => f.pair === "USD/KRW") ?? fxRates[0];
  if (usdKrw && usdKrw.changeRate >= 0.3) {
    score -= 0.08;
    notes.push(`원/달러 +${usdKrw.changeRate.toFixed(2)}%`);
  } else if (usdKrw && usdKrw.changeRate <= -0.3) {
    score += 0.08;
  }

  const jpy = fxRates.find((f) => f.pair === "JPY/KRW");
  if (jpy && jpy.changeRate >= 0.5) {
    score -= 0.05;
    notes.push(`엔/KRW +${jpy.changeRate.toFixed(2)}%`);
  }

  const cny = fxRates.find((f) => f.pair === "CNY/KRW");
  if (cny && cny.changeRate <= -0.4) {
    score -= 0.05;
    notes.push(`위/KRW ${cny.changeRate.toFixed(2)}%`);
  }

  return {
    score,
    note: notes.join(" · ") || "글로벌·거시 중립",
  };
}

export function regionLabel(region?: string) {
  return (region && REGION_LABEL[region]) || region || "—";
}
