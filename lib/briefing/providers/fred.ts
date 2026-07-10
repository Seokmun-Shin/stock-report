/** FRED — 미국 연준 공식 경제지표 */

import { envSecret } from "@/lib/envSecret";
import type { OfficialIndicatorSnapshot } from "../types";

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

type ChangeMode = "yoy_pct" | "mom_pp" | "none";

interface FredSeriesDef {
  id: string;
  seriesId: string;
  label: string;
  unit: string;
  changeMode: ChangeMode;
}

const FRED_SERIES: FredSeriesDef[] = [
  { id: "us-cpi", seriesId: "CPIAUCSL", label: "CPI (전체)", unit: "지수", changeMode: "yoy_pct" },
  { id: "us-core-cpi", seriesId: "CPILFESL", label: "근원 CPI", unit: "지수", changeMode: "yoy_pct" },
  { id: "us-unemployment", seriesId: "UNRATE", label: "실업률", unit: "%", changeMode: "mom_pp" },
  { id: "us-fed-funds", seriesId: "FEDFUNDS", label: "Fed 기준금리", unit: "%", changeMode: "mom_pp" },
  { id: "us-10y", seriesId: "DGS10", label: "美 10Y 국채(공식)", unit: "%", changeMode: "mom_pp" },
  { id: "us-2y", seriesId: "DGS2", label: "美 2Y 국채", unit: "%", changeMode: "mom_pp" },
  { id: "us-yield-curve", seriesId: "T10Y2Y", label: "美 10Y-2Y 스프레드", unit: "%p", changeMode: "mom_pp" },
  { id: "us-hy-oas", seriesId: "BAMLH0A0HYM2", label: "美 하이일드 OAS", unit: "%", changeMode: "mom_pp" },
  { id: "us-gdp-growth", seriesId: "A191RL1Q225SBEA", label: "GDP(실질·분기)", unit: "%", changeMode: "none" },
  { id: "us-ppi", seriesId: "PPIACO", label: "PPI", unit: "지수", changeMode: "yoy_pct" },
];

export function isFredConfigured(): boolean {
  return !!envSecret("FRED_API_KEY");
}

function parseObs(value: string): number | null {
  if (!value || value === ".") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function fetchFredObservations(seriesId: string, limit: number): Promise<{ date: string; value: number }[]> {
  const apiKey = envSecret("FRED_API_KEY")!;
  const url = new URL(FRED_BASE);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`FRED ${seriesId} (${res.status})`);

  const data = (await res.json()) as {
    observations?: { date: string; value: string }[];
  };

  return (data.observations ?? [])
    .map((o) => ({ date: o.date, value: parseObs(o.value) }))
    .filter((o): o is { date: string; value: number } => o.value != null);
}

function calcChange(mode: ChangeMode, obs: { date: string; value: number }[]): {
  changeValue?: number;
  changeLabel?: string;
} {
  if (obs.length < 2) return {};
  const latest = obs[0]!.value;
  const prev = obs[1]!.value;

  if (mode === "none") return {};
  if (mode === "mom_pp") {
    return { changeValue: latest - prev, changeLabel: "전월比(p.p.)" };
  }
  if (mode === "yoy_pct") {
    const yearAgo = obs[12]?.value ?? obs[obs.length - 1]?.value;
    if (yearAgo == null || yearAgo === 0) return {};
    return {
      changeValue: ((latest - yearAgo) / yearAgo) * 100,
      changeLabel: "전년比(%)",
    };
  }
  return {};
}

export async function fetchFredIndicators(): Promise<OfficialIndicatorSnapshot[]> {
  if (!isFredConfigured()) return [];

  const out: OfficialIndicatorSnapshot[] = [];

  for (const def of FRED_SERIES) {
    try {
      const limit = def.changeMode === "yoy_pct" ? 14 : 3;
      const obs = await fetchFredObservations(def.seriesId, limit);
      if (obs.length === 0) continue;

      const { changeValue, changeLabel } = calcChange(def.changeMode, obs);
      out.push({
        id: def.id,
        label: def.label,
        region: "US",
        source: "FRED",
        value: obs[0]!.value,
        unit: def.unit,
        asOf: obs[0]!.date,
        changeValue,
        changeLabel,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      /* skip failed series */
    }
    await sleep(120);
  }

  return out;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
