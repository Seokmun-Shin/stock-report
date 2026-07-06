import type { Trade, TradeType } from "@/lib/types";
import type { BrokerCsvFormat } from "./brokerCsv";

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
  format: BrokerCsvFormat | "generic";
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

function detectFormat(headers: string[]): BrokerCsvFormat | "generic" {
  const joined = headers.join("|");
  if (/미래|mirae|카이로스|kairos/i.test(joined)) return "mirae";
  if (/매수\s*수량|매수수량/.test(joined) && /매도\s*수량|매도수량/.test(joined)) return "mirae";
  if (/키움|원주문|주문구분/.test(joined)) return "kiwoom";
  if (/한국투자|체결일자/.test(joined) && /HTS/.test(joined)) return "kis";
  if (/체결일자/.test(joined) && /한국투자/.test(joined)) return "kis";
  return "generic";
}

function isMiraeJournal(headers: string[]): boolean {
  const buyQty = findColumn(headers, [/매수\s*수량/, /매수수량/]);
  const sellQty = findColumn(headers, [/매도\s*수량/, /매도수량/]);
  const name = findColumn(headers, [/종목명/, /^종목$/]);
  return buyQty >= 0 && sellQty >= 0 && name >= 0;
}

function columnMapForFormat(format: BrokerCsvFormat, headers: string[]) {
  const isMirae = format === "mirae";
  return {
    colDate: findColumn(headers, [/체결일/, /주문일/, /^일자$/, /매매일/, /date/i]),
    colTime: findColumn(headers, [/체결시/, /^시간$/, /time/i]),
    colName: findColumn(headers, [/종목명/, /^종목$/]),
    colType: findColumn(headers, [/매매\s*구분/, /매수매도/, /주문구분/, /^구분$/]),
    colQty: findColumn(
      headers,
      isMirae
        ? [/체결\s*수량/, /체결수량/, /^수량$/, /주문수량/]
        : [/체결수량/, /^수량$/, /주문수량/]
    ),
    colPrice: findColumn(
      headers,
      isMirae
        ? [/체결\s*단가/, /체결단가/, /체결\s*가/, /^단가$/]
        : [/체결단가/, /체결가/, /^단가$/]
    ),
    colFee: findColumn(headers, [/수수료/, /매매\s*비용/, /fee/i]),
    colTax: findColumn(headers, [/제세금/, /세금/, /tax/i]),
  };
}

function parseMiraeJournal(
  lines: string[],
  headerIdx: number,
  headers: string[],
  errors: string[]
): ParsedTradeRow[] {
  const colDate = findColumn(headers, [/^일자$/, /체결일/, /매매일/]);
  const colName = findColumn(headers, [/종목명/, /^종목$/]);
  const colBuyQty = findColumn(headers, [/매수\s*수량/, /매수수량/]);
  const colBuyPrice = findColumn(headers, [/매수\s*평균/, /매수평균/, /매수\s*단가/]);
  const colSellQty = findColumn(headers, [/매도\s*수량/, /매도수량/]);
  const colSellPrice = findColumn(headers, [/매도\s*평균/, /매도평균/, /매도\s*단가/]);
  const colCost = findColumn(headers, [/매매\s*비용/, /수수료/]);

  const rows: ParsedTradeRow[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]).map((c) => c.replace(/"/g, "").trim());
    if (cells.length < headers.length / 2) continue;

    const stockName = cells[colName]?.trim();
    if (!stockName || /합계|총계|소계/.test(stockName)) continue;

    const dateRaw = colDate >= 0 ? cells[colDate] : "";
    const date = normalizeDate(dateRaw);
    if (!date) {
      errors.push(`${i + 1}행: 날짜 형식 오류 (${dateRaw || "없음"})`);
      continue;
    }

    const totalCost = colCost >= 0 ? Math.round(parseNumber(cells[colCost] ?? "")) : 0;
    const buyQty = colBuyQty >= 0 ? Math.round(parseNumber(cells[colBuyQty] ?? "")) : 0;
    const sellQty = colSellQty >= 0 ? Math.round(parseNumber(cells[colSellQty] ?? "")) : 0;
    const buyPrice = colBuyPrice >= 0 ? Math.round(parseNumber(cells[colBuyPrice] ?? "")) : 0;
    const sellPrice = colSellPrice >= 0 ? Math.round(parseNumber(cells[colSellPrice] ?? "")) : 0;

    const amountSum = buyQty * buyPrice + sellQty * sellPrice;
    const buyFee =
      buyQty > 0 && buyPrice > 0
        ? Math.round(totalCost * ((buyQty * buyPrice) / Math.max(amountSum, 1)))
        : 0;
    const sellFeeRest = Math.max(totalCost - buyFee, 0);

    if (buyQty > 0 && buyPrice > 0) {
      rows.push({
        date,
        stockName,
        type: "buy",
        quantity: buyQty,
        price: buyPrice,
        fee: buyFee,
        tax: 0,
      });
    }
    if (sellQty > 0 && sellPrice > 0) {
      rows.push({
        date,
        stockName,
        type: "sell",
        quantity: sellQty,
        price: sellPrice,
        fee: sellFeeRest,
        tax: 0,
      });
    }
  }

  return rows;
}

function parseExecutionRows(
  lines: string[],
  headerIdx: number,
  headers: string[],
  format: BrokerCsvFormat,
  errors: string[]
): ParsedTradeRow[] {
  const cols = columnMapForFormat(format, headers);

  if (cols.colName < 0 || cols.colType < 0 || cols.colQty < 0 || cols.colPrice < 0) {
    errors.push(
      "필수 열을 찾지 못했습니다. (종목명·매매구분·수량·단가)",
      `인식된 헤더: ${headers.join(", ")}`
    );
    return [];
  }

  const rows: ParsedTradeRow[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]).map((c) => c.replace(/"/g, "").trim());
    if (cells.length < headers.length / 2) continue;

    const stockName = cells[cols.colName]?.trim();
    const type = parseTradeType(cells[cols.colType] ?? "");
    const quantity = Math.round(parseNumber(cells[cols.colQty] ?? ""));
    const price = Math.round(parseNumber(cells[cols.colPrice] ?? ""));

    if (!stockName || /합계|총계|소계/.test(stockName)) continue;
    if (!type) continue;
    if (quantity <= 0 || price <= 0) {
      errors.push(`${i + 1}행: 수량·단가 확인 (${stockName})`);
      continue;
    }

    const dateRaw = cols.colDate >= 0 ? cells[cols.colDate] : "";
    const date = normalizeDate(dateRaw);
    if (!date) {
      errors.push(`${i + 1}행: 날짜 형식 오류 (${dateRaw || "없음"})`);
      continue;
    }

    const fee = cols.colFee >= 0 ? Math.round(parseNumber(cells[cols.colFee] ?? "")) : 0;
    const taxRaw = cols.colTax >= 0 ? Math.round(parseNumber(cells[cols.colTax] ?? "")) : 0;
    const tax = type === "sell" ? taxRaw : 0;
    const executedTime = cols.colTime >= 0 ? normalizeTime(cells[cols.colTime] ?? "") : undefined;

    rows.push({ date, stockName, type, quantity, price, fee, tax, executedTime });
  }

  return rows;
}

/** 증권사 체결 CSV 파싱 — preferred: 사용자 선택 (기본 미래에셋) */
export function parseTradeCsv(text: string, preferred: BrokerCsvFormat = "mirae"): CsvParseResult {
  const errors: string[] = [];
  const lines = stripBom(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], errors: ["데이터 행이 없습니다."], format: "generic" };
  }

  let headerIdx = lines.findIndex((l) => /종목/.test(l) && /(체결|매매|주문|구분|매수|매도|일자)/.test(l));
  if (headerIdx < 0) headerIdx = 0;

  const headers = parseCsvLine(lines[headerIdx]).map((h) => h.replace(/"/g, "").trim());
  const detected = detectFormat(headers);
  const format: BrokerCsvFormat = detected !== "generic" ? detected : preferred;

  let rows: ParsedTradeRow[] = [];

  if (format === "mirae" && isMiraeJournal(headers)) {
    rows = parseMiraeJournal(lines, headerIdx, headers, errors);
  } else {
    rows = parseExecutionRows(lines, headerIdx, headers, format, errors);
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("가져올 체결 내역이 없습니다.");
  }

  return { rows, errors, format };
}
