"use client";

import { useEffect, useRef, useState } from "react";
import { suggestStockCode } from "@/lib/stockCodes";
import type { AppData, Stock, Trade } from "@/lib/types";
import { uid } from "@/lib/calc";
import { parseTradeCsv, type ParsedTradeRow } from "@/lib/import/tradeCsv";
import {
  BROKER_CSV_GUIDE,
  BROKER_CSV_LABEL,
  loadPreferredBroker,
  savePreferredBroker,
  type BrokerCsvFormat,
} from "@/lib/import/brokerCsv";
import { dedupeTradeRows, existingTradeFingerprints } from "@/lib/import/tradeDedup";
import {
  BtnCreateBlock,
  BtnSave,
  BtnCancel,
  BtnTextAction,
  guidePanel,
  previewPanel,
  SegmentTab,
  UI,
} from "@/components/ui/PanelCard";

const BROKERS: BrokerCsvFormat[] = ["mirae", "kis", "kiwoom"];

const MAX_CSV_BYTES = 2 * 1024 * 1024;
const MAX_CSV_ROWS = 5000;

export function CsvImportPanel({
  stocks,
  trades,
  onImport,
}: {
  stocks: Stock[];
  trades: Trade[];
  onImport: (rows: ParsedTradeRow[]) => void;
}) {
  const [broker, setBroker] = useState<BrokerCsvFormat>("mirae");
  const [open, setOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [preview, setPreview] = useState<ParsedTradeRow[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [format, setFormat] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBroker(loadPreferredBroker());
  }, []);

  function selectBroker(next: BrokerCsvFormat) {
    setBroker(next);
    savePreferredBroker(next);
  }

  function handleFile(file: File) {
    if (file.size > MAX_CSV_BYTES) {
      setErrors([`CSV 파일은 ${MAX_CSV_BYTES / (1024 * 1024)}MB 이하여야 합니다.`]);
      setPreview(null);
      setOpen(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const result = parseTradeCsv(text, broker);
      if (result.rows.length > MAX_CSV_ROWS) {
        setErrors([`한 번에 최대 ${MAX_CSV_ROWS}건까지 가져올 수 있습니다.`]);
        setPreview(null);
        setOpen(true);
        return;
      }
      const existing = existingTradeFingerprints(trades, stocks);
      const { unique, skipped } = dedupeTradeRows(result.rows, existing);
      setPreview(unique.length > 0 ? unique : null);
      setDuplicateCount(skipped);
      setErrors(result.errors);
      setFormat(result.format);
      setOpen(true);
    };
    reader.readAsText(file, "UTF-8");
  }

  function confirmImport() {
    if (!preview?.length) return;
    onImport(preview);
    setPreview(null);
    setErrors([]);
    setDuplicateCount(0);
    setOpen(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const stockNames = new Set(stocks.map((s) => s.name));
  const newNames = preview ? [...new Set(preview.map((r) => r.stockName).filter((n) => !stockNames.has(n)))] : [];
  const guide = BROKER_CSV_GUIDE[broker];

  return (
    <div className="mt-2">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {BROKERS.map((b) => (
          <SegmentTab
            key={b}
            active={broker === b}
            onClick={() => selectBroker(b)}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold"
          >
            {BROKER_CSV_LABEL[b]}
          </SegmentTab>
        ))}
      </div>

      <BtnTextAction
        type="button"
        onClick={() => setGuideOpen((v) => !v)}
        className="mb-2 text-xs font-semibold"
      >
        {guideOpen ? "가져오기 안내 접기" : `${BROKER_CSV_LABEL[broker]} CSV 가져오기 안내`}
      </BtnTextAction>

      {guideOpen && (
        <div className={`mb-3 ${guidePanel} text-[11px] leading-relaxed text-zinc-300`}>
          <p className="font-semibold text-white">{guide.title}</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4">
            {guide.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          {guide.note && <p className="mt-2 text-[10px] text-amber-200">{guide.note}</p>}
          <p className="mt-2 text-[10px]">수동 입력과 병행 · 중복 건은 기록 탭에서 삭제</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <BtnCreateBlock type="button" onClick={() => inputRef.current?.click()}>
        {BROKER_CSV_LABEL[broker]} 체결 CSV 가져오기
      </BtnCreateBlock>

      {open && (
        <div className={`mt-3 ${previewPanel}`}>
          {preview && preview.length > 0 ? (
            <>
              <p className="text-sm font-semibold text-white">
                가져오기 미리보기 · {preview.length}건
                {duplicateCount > 0 && (
                  <span className="ml-2 text-xs font-normal text-amber-200">({duplicateCount}건 중복 제외)</span>
                )}
                {format && (
                  <span className="ml-2 text-xs font-normal text-zinc-300">
                    ({BROKER_CSV_LABEL[format as BrokerCsvFormat] ?? format})
                  </span>
                )}
              </p>
              {newNames.length > 0 && (
                <p className="mt-1 text-xs text-amber-200">신규 종목 자동 추가: {newNames.join(", ")}</p>
              )}
              <div className={`${UI.dataTableWrap} mt-2 max-h-40 overflow-y-auto text-xs`}>
                <table className="w-full">
                  <thead className="bg-white/10 text-zinc-300">
                    <tr>
                      <th className="px-2 py-1 text-left">일자</th>
                      <th className="px-2 py-1 text-left">종목</th>
                      <th className="px-2 py-1">구분</th>
                      <th className="px-2 py-1 text-right">수량</th>
                      <th className="px-2 py-1 text-right">단가</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-t border-white/10">
                        <td className="px-2 py-1 tabular-nums">{r.date}</td>
                        <td className="px-2 py-1">{r.stockName}</td>
                        <td className="px-2 py-1 text-center">{r.type === "buy" ? "매수" : "매도"}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{r.quantity}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{r.price.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 20 && (
                  <p className="px-2 py-1 text-center text-zinc-300">… 외 {preview.length - 20}건</p>
                )}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <BtnCancel
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setPreview(null);
                  }}
                />
                <BtnSave type="button" onClick={confirmImport}>
                  {preview.length}건 등록
                </BtnSave>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-loss">가져올 체결 내역을 찾지 못했습니다</p>
              <div className="mt-3 flex justify-end">
                <BtnCancel
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setPreview(null);
                    setErrors([]);
                  }}
                >
                  닫기
                </BtnCancel>
              </div>
            </>
          )}
          {errors.length > 0 && (
            <ul className={`text-xs text-loss ${preview?.length ? "mt-2" : "mt-3"}`}>
              {errors.slice(0, 5).map((e, i) => (
                <li key={i}>· {e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export interface CsvMergeResult {
  data: AppData;
  added: number;
  skippedDuplicates: number;
}

export function mergeCsvTrades(data: AppData, rows: ParsedTradeRow[]): CsvMergeResult {
  const existing = existingTradeFingerprints(data.trades, data.stocks);
  const { unique, skipped } = dedupeTradeRows(rows, existing);
  let next: AppData = { ...data, stocks: [...data.stocks], trades: [...data.trades] };

  for (const row of unique) {
    let stock = next.stocks.find(
      (s) => s.name === row.stockName || s.name.replace(/\s/g, "") === row.stockName.replace(/\s/g, "")
    );

    if (!stock) {
      const id = uid();
      const code = suggestStockCode(row.stockName)?.padStart(6, "0");
      stock = { id, name: row.stockName, code };
      next.stocks.push(stock);
      next = {
        ...next,
        currentPrices: { ...next.currentPrices, [id]: row.price },
      };
    }

    next.trades.push({
      id: uid(),
      stockId: stock.id,
      type: row.type,
      date: row.date,
      executedTime: row.executedTime,
      quantity: row.quantity,
      price: row.price,
      fee: row.fee,
      tax: row.tax,
      createdAt: new Date(`${row.date}T${row.executedTime ?? "12:00"}:00`).toISOString(),
    });
  }

  return { data: next, added: unique.length, skippedDuplicates: skipped };
}
