"use client";

import { useEffect, useState } from "react";
import type { Stock } from "@/lib/types";
import { suggestStockCode } from "@/lib/stockCodes";
import { BtnCancel, BtnSave, UI, panelBody, panelShell } from "@/components/ui/PanelCard";

export function StockEditModal({
  stock,
  onSave,
  onClose,
}: {
  stock: Stock;
  onSave: (name: string, code?: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(stock.name);
  const [code, setCode] = useState(stock.code ?? "");
  const [codeManual, setCodeManual] = useState(!!stock.code);

  useEffect(() => {
    setName(stock.name);
    setCode(stock.code ?? "");
    setCodeManual(!!stock.code);
  }, [stock]);

  function handleNameChange(v: string) {
    setName(v);
    if (!codeManual) setCode(suggestStockCode(v) ?? "");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const codeRaw = code.trim().replace(/\D/g, "");
    onSave(trimmed, codeRaw ? codeRaw.padStart(6, "0") : undefined);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className={`w-full max-w-md ${panelShell} ${panelBody}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white">종목 수정</h3>
        <p className="mt-1 text-sm text-zinc-300">종목명·코드(KIS 시세용)를 변경합니다.</p>

        <label className="mt-4 block text-sm font-medium text-zinc-300">
          종목명
          <input
            className={`${UI.input} text-base`}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            autoFocus
            required
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-zinc-300">
          종목코드 (6자리, 선택)
          <input
            className={`${UI.input} text-base`}
            value={code}
            placeholder="005930"
            onChange={(e) => {
              setCode(e.target.value);
              setCodeManual(e.target.value.trim().length > 0);
            }}
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <BtnCancel onClick={onClose} className="px-4 py-2" />
          <BtnSave className="px-4 py-2" />
        </div>
      </form>
    </div>
  );
}
