"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppData, KospiBenchmark, Stock, StockQuote } from "@/lib/types";
import { authedFetch } from "@/lib/client/authedFetch";

function formatTime(d: Date): string {
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** KRX 정규장 대략적 여부 (09:00~15:30, 월~금) — 상태 표시용 */
export function isKrxMarketOpen(now = new Date()): boolean {
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const day = kst.getDay();
  if (day === 0 || day === 6) return false;
  const mins = kst.getHours() * 60 + kst.getMinutes();
  return mins >= 9 * 60 && mins < 15 * 60 + 30;
}

export type QuoteApplyPayload = {
  quotesByStockId: Record<string, StockQuote>;
  kospi?: KospiBenchmark | null;
  kosdaq?: KospiBenchmark | null;
};

export function useKisPrices(
  stocks: Stock[],
  onApply: (payload: QuoteApplyPayload) => void
) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;

  useEffect(() => {
    let cancelled = false;

    async function checkStatus(attempt = 0) {
      try {
        const res = await authedFetch("/api/stock-prices", { cache: "no-store" });
        const d = (await res.json()) as { configured?: boolean };
        if (cancelled) return;
        const ok = !!d.configured;
        setConfigured(ok);
        if (ok) sessionStorage.setItem("kis-configured", "true");
      } catch {
        if (cancelled) return;
        if (attempt < 2) {
          window.setTimeout(() => void checkStatus(attempt + 1), 800);
          return;
        }
        const cached = sessionStorage.getItem("kis-configured") === "true";
        setConfigured(cached ? true : false);
      }
    }

    void checkStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    const coded = stocks.filter((s) => s.code?.trim());
    if (coded.length === 0) {
      setError("종목코드가 등록된 종목이 없습니다. 「이름 수정」에서 6자리 코드를 입력하세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authedFetch("/api/stock-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: coded.map((s) => s.code!.trim()), includeKospi: true }),
      });
      const data = (await res.json()) as {
        error?: string;
        quotes?: Record<string, StockQuote>;
        prices?: Record<string, number>;
        errors?: Record<string, string>;
        kospi?: KospiBenchmark | null;
        kosdaq?: KospiBenchmark | null;
        kospiError?: string;
        kospiWarning?: string;
        indexWarnings?: string[];
        source?: "yahoo" | "kis";
      };

      if (!res.ok) {
        throw new Error(data.error ?? "시세 조회 실패");
      }

      const quotesByStockId: Record<string, StockQuote> = {};
      for (const stock of coded) {
        const raw = stock.code!.trim();
        const padded = raw.replace(/\D/g, "").padStart(6, "0");
        const q = data.quotes?.[padded] ?? data.quotes?.[raw];
        if (q) quotesByStockId[stock.id] = q;
      }

      if (Object.keys(quotesByStockId).length === 0) {
        const firstErr = data.errors ? Object.values(data.errors)[0] : undefined;
        throw new Error(firstErr ?? "조회된 시세가 없습니다.");
      }

      onApplyRef.current({
        quotesByStockId,
        kospi: data.kospi ?? null,
        kosdaq: data.kosdaq ?? null,
      });
      setLastUpdated(new Date());

      const failEntries = data.errors ? Object.entries(data.errors) : [];
      const msgs: string[] = [];
      if (failEntries.length > 0) {
        const detail = failEntries.map(([code, msg]) => `${code}: ${msg}`).join(" · ");
        msgs.push(`종목 시세 ${failEntries.length}건 실패 (${detail})`);
      }
      if (data.kospiWarning) msgs.push(data.kospiWarning);
      else if (data.kospiError) msgs.push(`KOSPI 지수: ${data.kospiError} (알파·벤치마크 제한)`);
      for (const w of data.indexWarnings ?? []) {
        if (!w.startsWith("KOSPI") && !msgs.includes(w)) msgs.push(w);
      }
      if (msgs.length > 0) setError(msgs.join(" · "));
      else if (data.source === "yahoo") setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "시세 조회 실패");
    } finally {
      setLoading(false);
    }
  }, [stocks]);

  return {
    configured,
    loading,
    error,
    lastUpdated,
    refresh,
    codedCount: stocks.filter((s) => s.code?.trim()).length,
  };
}

export function applyQuoteUpdates(data: AppData, payload: QuoteApplyPayload): AppData {
  const currentPrices = { ...data.currentPrices };
  for (const [id, q] of Object.entries(payload.quotesByStockId)) {
    currentPrices[id] = q.price;
  }
  return {
    ...data,
    currentPrices,
    stockQuotes: { ...(data.stockQuotes ?? {}), ...payload.quotesByStockId },
    kospiBenchmark: payload.kospi ?? data.kospiBenchmark,
    kosdaqBenchmark: payload.kosdaq ?? data.kosdaqBenchmark,
  };
}

/** @deprecated applyQuoteUpdates 사용 */
export function applyPriceUpdates(data: AppData, updates: Record<string, number>): AppData {
  return {
    ...data,
    currentPrices: { ...data.currentPrices, ...updates },
  };
}

export { formatTime as formatKisUpdatedTime };
