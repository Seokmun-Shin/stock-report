"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DailySnapshot } from "@/lib/types";
import type { HistoryInterval, HistoryRange } from "@/lib/stockPriceHistory";

export interface StockHistoryPayload {
  points: { date: string; open: number; high: number; low: number; close: number }[];
  stockIndex: { date: string; index: number }[];
  kospiIndex: { date: string; index: number }[];
  source: "yahoo" | "snapshot";
  range: HistoryRange;
  interval: HistoryInterval;
  periodChangePct: number;
  kospiChangePct: number | null;
  alpha: number | null;
  fetchedAt?: string;
}

export function useStockHistory({
  stockId,
  code,
  currentPrice,
  dailySnapshots,
}: {
  stockId: string;
  code?: string;
  currentPrice: number;
  dailySnapshots?: DailySnapshot[];
}) {
  const [range, setRange] = useState<HistoryRange>("1d");
  const [interval, setInterval] = useState<HistoryInterval>("5m");
  const [data, setData] = useState<StockHistoryPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  const snapshotsKey = dailySnapshots?.length ?? 0;
  const fetchRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!stockId) return;
    const id = ++fetchRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stock-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockId,
          code,
          range,
          interval,
          currentPrice,
          dailySnapshots,
        }),
      });

      const json = (await res.json()) as StockHistoryPayload & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "추이 조회 실패");
      if (id !== fetchRef.current) return;

      setData(json);
      setFetchedAt(json.fetchedAt ? new Date(json.fetchedAt) : new Date());
    } catch (err) {
      if (id !== fetchRef.current) return;
      setError(err instanceof Error ? err.message : "추이 조회 실패");
      setData(null);
      setFetchedAt(null);
    } finally {
      if (id === fetchRef.current) setLoading(false);
    }
  }, [stockId, code, range, interval, currentPrice, dailySnapshots, snapshotsKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, range, setRange, interval, setInterval, refresh, fetchedAt };
}
