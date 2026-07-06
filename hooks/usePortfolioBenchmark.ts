"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DailySnapshot } from "@/lib/types";
import type { HistoryRange } from "@/lib/stockPriceHistory";

export interface PortfolioBenchmarkPayload {
  portfolioIndex: { date: string; index: number }[];
  kospiIndex: { date: string; index: number }[];
  portfolioChangePct: number;
  kospiChangePct: number;
  alpha: number | null;
  range?: HistoryRange;
  fetchedAt?: string;
  message?: string;
}

export function usePortfolioBenchmark(dailySnapshots?: DailySnapshot[]) {
  const [data, setData] = useState<PortfolioBenchmarkPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = dailySnapshots?.map((s) => s.date).join("|") ?? "";
  const fetchRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!dailySnapshots || dailySnapshots.length < 2) {
      setData(null);
      setError(null);
      return;
    }

    const id = ++fetchRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/portfolio-benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailySnapshots }),
      });
      const json = (await res.json()) as PortfolioBenchmarkPayload & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "벤치마크 조회 실패");
      if (id !== fetchRef.current) return;
      setData(json);
    } catch (err) {
      if (id !== fetchRef.current) return;
      setError(err instanceof Error ? err.message : "벤치마크 조회 실패");
      setData(null);
    } finally {
      if (id === fetchRef.current) setLoading(false);
    }
  }, [dailySnapshots, key]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
