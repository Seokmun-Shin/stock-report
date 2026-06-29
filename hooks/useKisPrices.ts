"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppData, Stock } from "@/lib/types";

const AUTO_REFRESH_MS = 60_000;

function formatTime(d: Date): string {
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** KRX 정규장 대략적 여부 (09:00~15:30, 월~금) — 자동 갱신 힌트용 */
export function isKrxMarketOpen(now = new Date()): boolean {
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const day = kst.getDay();
  if (day === 0 || day === 6) return false;
  const mins = kst.getHours() * 60 + kst.getMinutes();
  return mins >= 9 * 60 && mins < 15 * 60 + 30;
}

export function useKisPrices(stocks: Stock[], onApplyPrices: (updates: Record<string, number>) => void) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const onApplyRef = useRef(onApplyPrices);
  onApplyRef.current = onApplyPrices;

  useEffect(() => {
    fetch("/api/stock-prices")
      .then((r) => r.json())
      .then((d) => setConfigured(!!d.configured))
      .catch(() => setConfigured(false));
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
      const res = await fetch("/api/stock-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: coded.map((s) => s.code!.trim()) }),
      });
      const data = (await res.json()) as {
        error?: string;
        prices?: Record<string, number>;
        errors?: Record<string, string>;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "시세 조회 실패");
      }

      const updates: Record<string, number> = {};
      for (const stock of coded) {
        const raw = stock.code!.trim();
        const padded = raw.replace(/\D/g, "").padStart(6, "0");
        const price = data.prices?.[padded] ?? data.prices?.[raw];
        if (price != null) updates[stock.id] = price;
      }

      if (Object.keys(updates).length === 0) {
        const firstErr = data.errors ? Object.values(data.errors)[0] : undefined;
        throw new Error(firstErr ?? "조회된 시세가 없습니다.");
      }

      onApplyRef.current(updates);
      setLastUpdated(new Date());

      const failCount = data.errors ? Object.keys(data.errors).length : 0;
      if (failCount > 0) {
        setError(`${failCount}개 종목 조회 실패 (나머지는 반영됨)`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "시세 조회 실패");
    } finally {
      setLoading(false);
    }
  }, [stocks]);

  useEffect(() => {
    if (!autoRefresh || configured !== true) return;
    const tick = () => {
      if (isKrxMarketOpen()) void refresh();
    };
    tick();
    const id = window.setInterval(tick, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, configured, refresh]);

  return {
    configured,
    loading,
    error,
    lastUpdated,
    autoRefresh,
    setAutoRefresh,
    refresh,
    codedCount: stocks.filter((s) => s.code?.trim()).length,
  };
}

export function applyPriceUpdates(data: AppData, updates: Record<string, number>): AppData {
  return {
    ...data,
    currentPrices: { ...data.currentPrices, ...updates },
  };
}

export { formatTime as formatKisUpdatedTime };
