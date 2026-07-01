import type { Trade, TradeType } from "./types";

export interface ParsedTradeRow {
  date: string;
  stockName: string;
  type: TradeType;
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  executedTime?: string;
}

export interface CsvParseResult {
  rows: ParsedTradeRow[];
  errors: string[];
  format: "kiwoom" | "kis" | "generic";
}

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseNumber(raw: string): number {
  const n = Number(raw.replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

function normalizeDate(raw: string): string | null {
  const s = raw.trim().replace(/\./g, "-").replace(/\//g, "-");
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  }
  return null;
}

function normalizeTime(raw: string): string | undefined {
  const s = raw.trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  if (/^\d{6}$/.test(s)) return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
  return undefined;
}

function parseTradeType(raw: string): TradeType | null {
  const s = raw.trim().toLowerCase();
  if (/매수|^buy$|^b$|\+/.test(s)) return "buy";
  if (/매도|^sell$|^s$|-/.test(s)) return "sell";
  return null;
}

function findColumn(headers: string[], patterns: RegExp[]): number {
  return headers.findIndex((h) => patterns.some((p) => p.test(h)));
}

function detectFormat(headers: string[]): CsvParseResult["format"] {
  const joined = headers.join("|");
  if (/키움|원주문|주문구분/.test(joined)) return "kiwoom";
  if (/한국투자|HTS|체결일자/.test(joined)) return "kis";
  return "generic";
}

/** 한투·키움 체결 CSV (1종 포맷 — 헤더 자동 인식) */
export function parseTradeCsv(text: string): CsvParseResult {
  const errors: string[] = [];
  const lines = stripBom(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], errors: ["데이터 행이 없습니다."], format: "generic" };
  }

  let headerIdx = lines.findIndex((l) => /종목/.test(l) && /(체결|매매|주문|구분)/.test(l));
  if (headerIdx < 0) headerIdx = 0;

  const headers = parseCsvLine(lines[headerIdx]).map((h) => h.replace(/"/g, "").trim());
  const format = detectFormat(headers);

  const colDate = findColumn(headers, [/체결일/, /주문일/, /일자/, /date/i]);
  const colTime = findColumn(headers, [/체결시/, /시간/, /time/i]);
  const colName = findColumn(headers, [/종목명/, /^종목$/]);
  const colType = findColumn(headers, [/매매/, /매수매도/, /주문구분/, /구분/]);
  const colQty = findColumn(headers, [/체결수량/, /^수량$/, /주문수량/]);
  const colPrice = findColumn(headers, [/체결단가/, /체결가/, /^단가$/]);
  const colFee = findColumn(headers, [/수수료/, /fee/i]);
  const colTax = findColumn(headers, [/제세금/, /세금/, /tax/i]);

  if (colName < 0 || colType < 0 || colQty < 0 || colPrice < 0) {
    return {
      rows: [],
      errors: [
        "필수 열을 찾지 못했습니다. (종목명·매매구분·수량·단가)",
        `인식된 헤더: ${headers.join(", ")}`,
      ],
      format,
    };
  }

  const rows: ParsedTradeRow[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]).map((c) => c.replace(/"/g, "").trim());
    if (cells.length < headers.length / 2) continue;

    const stockName = cells[colName]?.trim();
    const type = parseTradeType(cells[colType] ?? "");
    const quantity = Math.round(parseNumber(cells[colQty] ?? ""));
    const price = Math.round(parseNumber(cells[colPrice] ?? ""));

    if (!stockName || !type) continue;
    if (quantity <= 0 || price <= 0) {
      errors.push(`${i + 1}행: 수량·단가 확인 (${stockName})`);
      continue;
    }

    const dateRaw = colDate >= 0 ? cells[colDate] : "";
    const date = normalizeDate(dateRaw);
    if (!date) {
      errors.push(`${i + 1}행: 날짜 형식 오류 (${dateRaw || "없음"})`);
      continue;
    }

    const fee = colFee >= 0 ? Math.round(parseNumber(cells[colFee] ?? "")) : 0;
    const taxRaw = colTax >= 0 ? Math.round(parseNumber(cells[colTax] ?? "")) : 0;
    const tax = type === "sell" ? taxRaw : 0;
    const executedTime = colTime >= 0 ? normalizeTime(cells[colTime] ?? "") : undefined;

    rows.push({ date, stockName, type, quantity, price, fee, tax, executedTime });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("가져올 체결 내역이 없습니다.");
  }

  return { rows, errors, format };
}
