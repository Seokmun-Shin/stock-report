"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MarketBriefingContext } from "@/lib/briefing/types";
import type { StockDiscoveryReport } from "@/lib/briefing/stockDiscovery";

const CACHE_KEY = "mtock-discovery-cache";
const CACHE_TTL_MS = 20 * 60 * 1000;

type DiscoveryCache = {
  portfolioKey: string;
  fetchedAt: number;
  report: StockDiscoveryReport;
};

function readCache(portfolioKey: string): DiscoveryCache | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DiscoveryCache;
    if (parsed.portfolioKey !== portfolioKey) return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(portfolioKey: string, report: StockDiscoveryReport) {
  if (typeof sessionStorage === "undefined") return;
  try {
    const payload: DiscoveryCache = { portfolioKey, fetchedAt: Date.now(), report };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function useStockDiscovery(
  portfolioCodes: string[],
  marketContext?: MarketBriefingContext | null
) {
  const portfolioKey = portfolioCodes.join(",");
  const initialCache = readCache(portfolioKey);
  const [report, setReport] = useState<StockDiscoveryReport | null>(initialCache?.report ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(
    initialCache ? new Date(initialCache.fetchedAt) : null
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioCodes,
          marketContext: marketContext ?? undefined,
        }),
      });

      const data = (await res.json()) as StockDiscoveryReport & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "종목 발굴 실패");

      setReport(data);
      setLastFetched(new Date());
      writeCache(portfolioKey, data);

      if (data.errors?.length) {
        setError(data.errors.join(" · "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "종목 발굴 실패");
    } finally {
      setLoading(false);
    }
  }, [portfolioCodes, portfolioKey, marketContext]);

  const autoRef = useRef(false);
  useEffect(() => {
    if (autoRef.current) return;
    autoRef.current = true;
    if (report) return;
    const t = window.setTimeout(() => void refresh(), 4_500);
    return () => window.clearTimeout(t);
  }, [portfolioKey, refresh, report]);

  useEffect(() => {
    const cached = readCache(portfolioKey);
    if (cached) {
      setReport(cached.report);
      setLastFetched(new Date(cached.fetchedAt));
    }
  }, [portfolioKey]);

  return { report, loading, error, lastFetched, refresh };
}
