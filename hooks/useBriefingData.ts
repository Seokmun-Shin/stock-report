"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Stock } from "@/lib/types";
import type { MarketBriefingContext } from "@/lib/briefing/types";

export function useBriefingData(stocks: Stock[]) {
  const [context, setContext] = useState<MarketBriefingContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const stocksKey = stocks.map((s) => `${s.id}:${s.name}:${s.code ?? ""}`).join("|");

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

      if (data.errors?.length) {
        setError(data.errors.join(" · "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "브리핑 수집 실패");
    } finally {
      setLoading(false);
    }
  }, [stocks]);

  const autoRef = useRef(false);
  useEffect(() => {
    if (autoRef.current) return;
    if (stocks.length === 0) return;
    autoRef.current = true;
    void refresh();
  }, [stocksKey, refresh, stocks.length]);

  return { context, loading, error, lastFetched, refresh };
}
