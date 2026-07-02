/** 한국은행 ECOS — 공식 경제지표 */

import type { OfficialIndicatorSnapshot } from "../types";

const ECOS_BASE = "https://ecos.bok.or.kr/api/StatisticSearch";

type BokCycle = "M" | "Q" | "D";

interface BokSeriesDef {
  id: string;
  statCode: string;
  itemCode: string;
  cycle: BokCycle;
  label: string;
  unit: string;
  /** 값 자체가 YoY% 등인 경우 */
  valueIsChange?: boolean;
  changeMode?: "prev_pp";
}

const BOK_SERIES: BokSeriesDef[] = [
  {
    id: "kr-base-rate",
    statCode: "722Y001",
    itemCode: "0101000",
    cycle: "M",
    label: "한국은행 기준금리",
    unit: "%",
    changeMode: "prev_pp",
  },
  {
    id: "kr-cpi-yoy",
    statCode: "901Y010",
    itemCode: "0000000",
    cycle: "M",
    label: "소비자물가(전년比)",
    unit: "%",
    valueIsChange: true,
  },
  {
    id: "kr-gdp-q",
    statCode: "200Y002",
    itemCode: "10111",
    cycle: "Q",
    label: "GDP(실질·전기比)",
    unit: "%",
    changeMode: "prev_pp",
  },
  {
    id: "kr-ind-prod",
    statCode: "901Y014",
    itemCode: "0000000",
    cycle: "M",
    label: "산업생산(전년比)",
    unit: "%",
    valueIsChange: true,
  },
  {
    id: "kr-export-yoy",
    statCode: "901Y013",
    itemCode: "0000000",
    cycle: "M",
    label: "수출(전년比)",
    unit: "%",
    valueIsChange: true,
  },
  {
    id: "kr-kt-10y",
    statCode: "817Y002",
    itemCode: "0102000",
    cycle: "D",
    label: "국고채 10년",
    unit: "%",
    changeMode: "prev_pp",
  },
  {
    id: "kr-usdkrw",
    statCode: "036Y001",
    itemCode: "0000001",
    cycle: "D",
    label: "원/달러(ECOS)",
    unit: "원",
    changeMode: "prev_pp",
  },
];

export function isBokConfigured(): boolean {
  return !!process.env.BOK_API_KEY?.trim();
}

interface BokRow {
  TIME?: string;
  DATA_VALUE?: string;
  UNIT_NAME?: string;
}

function kstYm(): string {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${kst.getFullYear()}${String(kst.getMonth() + 1).padStart(2, "0")}`;
}

function kstYq(): string {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const q = Math.floor(kst.getMonth() / 3) + 1;
  return `${kst.getFullYear()}Q${q}`;
}

function monthsAgo(n: number): string {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  kst.setMonth(kst.getMonth() - n);
  return `${kst.getFullYear()}${String(kst.getMonth() + 1).padStart(2, "0")}`;
}

function quartersAgo(n: number): string {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  kst.setMonth(kst.getMonth() - n * 3);
  const q = Math.floor(kst.getMonth() / 3) + 1;
  return `${kst.getFullYear()}Q${q}`;
}

function dateRange(cycle: BokCycle): { start: string; end: string } {
  if (cycle === "M") return { start: monthsAgo(14), end: kstYm() };
  if (cycle === "Q") return { start: quartersAgo(6), end: kstYq() };
  const end = kstYm() + "01";
  return { start: monthsAgo(2) + "01", end };
}

async function fetchBokRows(def: BokSeriesDef): Promise<BokRow[]> {
  const apiKey = process.env.BOK_API_KEY!.trim();
  const { start, end } = dateRange(def.cycle);
  const url = `${ECOS_BASE}/${apiKey}/json/kr/1/100/${def.statCode}/${def.cycle}/${start}/${end}/${def.itemCode}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`BOK ${def.statCode} (${res.status})`);

  const data = (await res.json()) as {
    StatisticSearch?: { row?: BokRow | BokRow[]; RESULT?: { CODE?: string; MESSAGE?: string } };
  };

  const code = data.StatisticSearch?.RESULT?.CODE;
  if (code && code !== "INFO-000") {
    throw new Error(data.StatisticSearch?.RESULT?.MESSAGE ?? `BOK ${code}`);
  }

  const raw = data.StatisticSearch?.row;
  const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return rows.filter((r) => r.DATA_VALUE != null && r.DATA_VALUE !== "");
}

function parseRows(rows: BokRow[]): { date: string; value: number }[] {
  return rows
    .map((r) => ({
      date: String(r.TIME ?? ""),
      value: Number(r.DATA_VALUE),
    }))
    .filter((r) => r.date && Number.isFinite(r.value))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function fetchBokIndicators(): Promise<OfficialIndicatorSnapshot[]> {
  if (!isBokConfigured()) return [];

  const out: OfficialIndicatorSnapshot[] = [];

  for (const def of BOK_SERIES) {
    const itemCodes =
      def.id === "kr-cpi-yoy"
        ? [def.itemCode, "0100000", ""]
        : def.id === "kr-export-yoy"
          ? [def.itemCode, "0100000"]
          : def.id === "kr-kt-10y"
            ? ["0102000", "0101000", "0103000"]
          : def.id === "kr-usdkrw"
            ? ["0000001", "0000000"]
            : [def.itemCode];

    let parsed: { date: string; value: number }[] = [];
    for (const itemCode of itemCodes) {
      try {
        parsed = parseRows(await fetchBokRows({ ...def, itemCode }));
        if (parsed.length > 0) break;
      } catch {
        /* try next item code */
      }
    }
    if (parsed.length === 0) continue;

    try {
      const latest = parsed[0]!;
      let changeValue: number | undefined;
      let changeLabel: string | undefined;

      if (def.valueIsChange) {
        changeLabel = "공식 발표값";
      } else if (def.changeMode === "prev_pp" && parsed.length >= 2) {
        changeValue = latest.value - parsed[1]!.value;
        changeLabel = def.cycle === "Q" ? "전분기比(p.p.)" : "전월比(p.p.)";
      }

      out.push({
        id: def.id,
        label: def.label,
        region: "KR",
        source: "BOK",
        value: latest.value,
        unit: def.unit,
        asOf: latest.date,
        changeValue,
        changeLabel,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      /* skip */
    }
    await sleep(80);
  }

  return out;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
