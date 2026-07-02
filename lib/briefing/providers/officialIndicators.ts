/** FRED + BOK ECOS 공식 지표 통합 */

import type { OfficialIndicatorSnapshot } from "../types";
import { fetchBokIndicators, isBokConfigured } from "./bokEcos";
import { fetchFredIndicators, isFredConfigured } from "./fred";

export { isFredConfigured, isBokConfigured };

export async function fetchOfficialIndicators(): Promise<OfficialIndicatorSnapshot[]> {
  const [fred, bok] = await Promise.allSettled([fetchFredIndicators(), fetchBokIndicators()]);

  const out: OfficialIndicatorSnapshot[] = [];
  if (fred.status === "fulfilled") out.push(...fred.value);
  if (bok.status === "fulfilled") out.push(...bok.value);
  return out;
}

export function summarizeOfficialMacro(indicators: OfficialIndicatorSnapshot[]): {
  score: number;
  note: string;
} {
  let score = 0;
  const notes: string[] = [];

  const usCpi = indicators.find((i) => i.id === "us-cpi");
  if (usCpi?.changeValue != null) {
    if (usCpi.changeValue >= 3.5) {
      score -= 0.25;
      notes.push(`美CPI YoY ${usCpi.changeValue.toFixed(1)}%↑`);
    } else if (usCpi.changeValue <= 2) {
      score += 0.1;
    }
  }

  const fed = indicators.find((i) => i.id === "us-fed-funds");
  if (fed?.changeValue != null && fed.changeValue > 0) {
    score -= 0.15;
    notes.push(`Fed 금리 +${fed.changeValue.toFixed(2)}%p`);
  }

  const krCpi = indicators.find((i) => i.id === "kr-cpi-yoy");
  if (krCpi?.value != null) {
    if (krCpi.value >= 3) {
      score -= 0.15;
      notes.push(`韓 CPI ${krCpi.value.toFixed(1)}%`);
    } else if (krCpi.value <= 2) {
      score += 0.05;
    }
  }

  const krGdp = indicators.find((i) => i.id === "kr-gdp-q");
  if (krGdp?.value != null && krGdp.value < 0) {
    score -= 0.2;
    notes.push(`韓 GDP ${krGdp.value.toFixed(1)}%`);
  }

  const hyOas = indicators.find((i) => i.id === "us-hy-oas");
  if (hyOas?.value != null) {
    if (hyOas.changeValue != null && hyOas.changeValue >= 0.3) {
      score -= 0.25;
      notes.push(`美 HY OAS ${hyOas.value.toFixed(2)}% (+${hyOas.changeValue.toFixed(2)}%p)`);
    } else if (hyOas.value >= 5) {
      score -= 0.15;
      notes.push(`美 HY OAS ${hyOas.value.toFixed(2)}%`);
    }
  }

  const yieldCurve = indicators.find((i) => i.id === "us-yield-curve");
  if (yieldCurve?.value != null && yieldCurve.value < 0) {
    score -= 0.2;
    notes.push(`美 10Y-2Y ${yieldCurve.value.toFixed(2)}%p (역전)`);
  } else if (yieldCurve?.changeValue != null && yieldCurve.changeValue <= -0.2) {
    score -= 0.1;
    notes.push(`美 장단기 스프레드 축소`);
  }

  const krExport = indicators.find((i) => i.id === "kr-export-yoy");
  if (krExport?.value != null) {
    if (krExport.value <= -5) {
      score -= 0.15;
      notes.push(`韓 수출 ${krExport.value.toFixed(1)}%`);
    } else if (krExport.value >= 5) {
      score += 0.1;
      notes.push(`韓 수출 +${krExport.value.toFixed(1)}%`);
    }
  }

  const krKt10y = indicators.find((i) => i.id === "kr-kt-10y");
  if (krKt10y?.changeValue != null && krKt10y.changeValue >= 0.15) {
    score -= 0.1;
    notes.push(`韓 10Y +${krKt10y.changeValue.toFixed(2)}%p`);
  }

  return { score, note: notes.join(" · ") || "공식 지표 중립" };
}
