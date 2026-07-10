"use client";

import { useMemo } from "react";
import { useStockHistory } from "@/hooks/useStockHistory";
import { StockTrendChart } from "@/components/StockTrendChart";
import { buildChartTimingLines } from "@/lib/chartTimingLines";
import type { DailySnapshot, StockSummary, Trade } from "@/lib/types";
import type { ReportSettings } from "@/lib/reportSettings";

export function StockTrendSection({
  stockId,
  stockName,
  code,
  currentPrice,
  dailySnapshots,
  avgCost,
  holdingQty,
  trades,
  summary,
  reportSettings,
}: {
  stockId: string;
  stockName: string;
  code?: string;
  currentPrice: number;
  dailySnapshots?: DailySnapshot[];
  avgCost?: number;
  holdingQty?: number;
  trades?: Trade[];
  summary?: StockSummary | null;
  reportSettings?: Partial<ReportSettings>;
}) {
  const { data, loading, error, range, setRange, interval, setInterval, fetchedAt } = useStockHistory({
    stockId,
    code,
    currentPrice,
    dailySnapshots,
  });

  const timingLines = useMemo(
    () => buildChartTimingLines(summary, reportSettings),
    [summary, reportSettings]
  );

  return (
    <StockTrendChart
      stockName={stockName}
      data={data}
      loading={loading}
      error={error}
      range={range}
      onRangeChange={setRange}
      interval={interval}
      onIntervalChange={setInterval}
      avgCost={avgCost}
      holdingQty={holdingQty}
      trades={trades}
      fetchedAt={fetchedAt}
      timingLines={timingLines}
    />
  );
}
