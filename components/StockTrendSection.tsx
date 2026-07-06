"use client";

import { useStockHistory } from "@/hooks/useStockHistory";
import { StockTrendChart } from "@/components/StockTrendChart";
import type { DailySnapshot, Trade } from "@/lib/types";

export function StockTrendSection({
  stockId,
  stockName,
  code,
  currentPrice,
  dailySnapshots,
  avgCost,
  holdingQty,
  trades,
}: {
  stockId: string;
  stockName: string;
  code?: string;
  currentPrice: number;
  dailySnapshots?: DailySnapshot[];
  avgCost?: number;
  holdingQty?: number;
  trades?: Trade[];
}) {
  const { data, loading, error, range, setRange, interval, setInterval, fetchedAt } = useStockHistory({
    stockId,
    code,
    currentPrice,
    dailySnapshots,
  });

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
    />
  );
}
