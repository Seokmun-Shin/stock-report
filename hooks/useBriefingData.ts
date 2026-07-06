"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Stock } from "@/lib/types";
import type { MarketBriefingContext } from "@/lib/briefing/types";

const CACHE_KEY = "mtock-briefing-cache";
const CACHE_TTL_MS = 30 * 60 * 1000;

type BriefingCache = {
  stocksKey: string;
  fetchedAt: number;
  context: MarketBriefingContext;
};

function readCache(stocksKey: string): BriefingCache | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BriefingCache;
    if (parsed.stocksKey !== stocksKey) return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(stocksKey: string, context: MarketBriefingContext) {
  if (typeof sessionStorage === "undefined") return;
  try {
    const payload: BriefingCache = { stocksKey, fetchedAt: Date.now(), context };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function useBriefingData(stocks: Stock[]) {
  const stocksKey = stocks.map((s) => `${s.id}:${s.name}:${s.code ?? ""}`).join("|");
  const initialCache = readCache(stocksKey);
  const [context, setContext] = useState<MarketBriefingContext | null>(initialCache?.context ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(
    initialCache ? new Date(initialCache.fetchedAt) : null
  );

  const refresh = useCallback(async () => {
    if (stocks.length === 0) {
      setError("등록된 종목이 없습니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stocks: stocks.map((s) => ({ id: s.id, name: s.name, code: s.code })),
        }),
      });

      const data = (await res.json()) as MarketBriefingContext & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "브리핑 수집 실패");

      setContext(data);
      setLastFetched(new Date());
      writeCache(stocksKey, data);

      if (data.errors?.length) {
        setError(data.errors.join(" · "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "브리핑 수집 실패");
    } finally {
      setLoading(false);
    }
  }, [stocks, stocksKey]);

  const autoRef = useRef(false);
  useEffect(() => {
    if (autoRef.current) return;
    if (stocks.length === 0) return;
    autoRef.current = true;
    if (context) return;
    // KIS 시세와 동시 토큰 요청 방지 (Vercel 서버리스 · 1분 1회 제한)
    const t = window.setTimeout(() => void refresh(), 3_000);
    return () => window.clearTimeout(t);
  }, [stocksKey, refresh, stocks.length, context]);

  useEffect(() => {
    const cached = readCache(stocksKey);
    if (cached) {
      setContext(cached.context);
      setLastFetched(new Date(cached.fetchedAt));
    }
  }, [stocksKey]);

  return { context, loading, error, lastFetched, refresh };
}
