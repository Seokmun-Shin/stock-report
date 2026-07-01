"use client";

import { useRef, useState } from "react";
import type { AppData, Stock } from "@/lib/types";
import { uid } from "@/lib/calc";
import { parseTradeCsv, type ParsedTradeRow } from "@/lib/import/tradeCsv";
import { suggestStockCode } from "@/lib/stockCodes";

export function CsvImportPanel({
  stocks,
  onImport,
}: {
  stocks: Stock[];
  onImport: (rows: ParsedTradeRow[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ParsedTradeRow[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [format, setFormat] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const result = parseTradeCsv(text);
      setPreview(result.rows);
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
    setOpen(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const stockNames = new Set(stocks.map((s) => s.name));
  const newNames = preview ? [...new Set(preview.map((r) => r.stockName).filter((n) => !stockNames.has(n)))] : [];

  return (
    <div className="mt-2">
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
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-xl border border-line bg-white py-2.5 text-sm font-semibold text-ink-muted hover:border-gain hover:text-gain"
      >
        CSV 가져오기 (한투·키움)
      </button>

      {open && preview && (
        <div className="mt-3 rounded-xl border border-gain/30 bg-gain-soft/20 p-4">
          <p className="text-sm font-semibold text-ink">
            가져오기 미리보기 · {preview.length}건
            {format && <span className="ml-2 text-xs font-normal text-ink-muted">({format})</span>}
          </p>
          {newNames.length > 0 && (
            <p className="mt-1 text-xs text-amber-800">
              신규 종목 자동 추가: {newNames.join(", ")}
            </p>
          )}
          {errors.length > 0 && (
            <ul className="mt-2 text-xs text-loss">
              {errors.slice(0, 5).map((e, i) => (
                <li key={i}>· {e}</li>
              ))}
            </ul>
          )}
          <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-line bg-white text-xs">
            <table className="w-full">
              <thead className="bg-surface-dim text-ink-muted">
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
                  <tr key={i} className="border-t border-line">
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
              <p className="px-2 py-1 text-center text-ink-muted">… 외 {preview.length - 20}건</p>
            )}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setPreview(null);
              }}
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-muted"
            >
              취소
            </button>
            <button
              type="button"
              onClick={confirmImport}
              className="rounded-lg bg-gain px-4 py-1.5 text-sm font-medium text-white"
            >
              {preview.length}건 추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function mergeCsvTrades(data: AppData, rows: ParsedTradeRow[]): AppData {
  let next: AppData = { ...data, stocks: [...data.stocks], trades: [...data.trades] };

  for (const row of rows) {
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

  return next;
}
