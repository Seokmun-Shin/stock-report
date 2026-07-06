import type { ParsedTradeRow } from "./tradeCsv";
import type { Trade } from "@/lib/types";

/** 체결 건 중복 판별 키 (같은 날·종목·구분·수량·단가) */
export function tradeRowFingerprint(row: ParsedTradeRow): string {
  const name = row.stockName.replace(/\s/g, "");
  return `${row.date}|${name}|${row.type}|${row.quantity}|${row.price}`;
}

export function existingTradeFingerprints(
  trades: Trade[],
  stocks: { id: string; name: string }[]
): Set<string> {
  const nameById = new Map(stocks.map((s) => [s.id, s.name.replace(/\s/g, "")]));
  const out = new Set<string>();
  for (const t of trades) {
    const name = nameById.get(t.stockId) ?? "";
    out.add(`${t.date}|${name}|${t.type}|${t.quantity}|${t.price}`);
  }
  return out;
}

export function dedupeTradeRows(
  rows: ParsedTradeRow[],
  existing: Set<string>
): { unique: ParsedTradeRow[]; skipped: number } {
  const seen = new Set(existing);
  const unique: ParsedTradeRow[] = [];
  let skipped = 0;
  for (const row of rows) {
    const key = tradeRowFingerprint(row);
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    unique.push(row);
  }
  return { unique, skipped };
}
