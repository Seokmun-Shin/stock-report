import type { AppData, Trade } from "@/lib/types";
import { compareTradesByDateAsc } from "@/lib/calc";
import { resolveReportSettings } from "@/lib/reportSettings";

export interface TimingBacktestRow {
  stockName: string;
  type: "buy" | "sell";
  date: string;
  price: number;
  inZone: boolean;
  referencePrice: number | null;
  referenceLabel: string;
}

export interface TimingBacktestSummary {
  buyTotal: number;
  buyInZone: number;
  sellTotal: number;
  sellInZone: number;
  rows: TimingBacktestRow[];
}

function zoneBuy(price: number, timing10: number | undefined, timing20: number | undefined): boolean {
  if (timing20 && price <= timing20) return true;
  if (timing10 && price <= timing10) return true;
  return false;
}

function zoneSell(price: number, sell10: number | undefined, sell20: number | undefined): boolean {
  if (sell20 && price >= sell20) return true;
  if (sell10 && price >= sell10) return true;
  return false;
}

/** 내 체결 기록 기준 — 당시 타이밍선 대비 구간 준수율 (간단 백테스트) */
export function runTimingBacktest(data: AppData): TimingBacktestSummary {
  const settings = resolveReportSettings(data.reportSettings);
  const rows: TimingBacktestRow[] = [];
  const stockById = new Map(data.stocks.map((s) => [s.id, s]));

  const sorted = [...data.trades].sort(compareTradesByDateAsc);
  const lots: { qty: number; price: number }[] = [];
  let lastSellPrice: Record<string, number> = {};
  let avgCost: Record<string, number> = {};

  for (const t of sorted) {
    const stock = stockById.get(t.stockId);
    if (!stock) continue;

    if (t.type === "buy") {
      const timing10 = lastSellPrice[t.stockId]
        ? Math.round(lastSellPrice[t.stockId] * (1 - settings.buyTimingPct1 / 100))
        : undefined;
      const timing20 = lastSellPrice[t.stockId]
        ? Math.round(lastSellPrice[t.stockId] * (1 - settings.buyTimingPct2 / 100))
        : undefined;
      const inZone = settings.useTimingPctLines && lastSellPrice[t.stockId]
        ? zoneBuy(t.price, timing10, timing20)
        : false;

      rows.push({
        stockName: stock.name,
        type: "buy",
        date: t.date,
        price: t.price,
        inZone,
        referencePrice: timing10 ?? null,
        referenceLabel: lastSellPrice[t.stockId]
          ? `최근 매도 ${lastSellPrice[t.stockId].toLocaleString()} 기준 1·2단계`
          : "매도 기록 없음",
      });

      lots.push({ qty: t.quantity, price: t.price });
      const totalQty = lots.reduce((s, l) => s + l.qty, 0);
      const totalCost = lots.reduce((s, l) => s + l.qty * l.price, 0);
      avgCost[t.stockId] = totalQty > 0 ? totalCost / totalQty : 0;
    } else {
      let remaining = t.quantity;
      while (remaining > 0 && lots.length > 0) {
        const lot = lots[0];
        const take = Math.min(remaining, lot.qty);
        lot.qty -= take;
        remaining -= take;
        if (lot.qty <= 0) lots.shift();
      }
      lastSellPrice[t.stockId] = t.price;

      const avg = avgCost[t.stockId];
      const sell10 = avg ? Math.round(avg * (1 + settings.sellTimingPct1 / 100)) : undefined;
      const sell20 = avg ? Math.round(avg * (1 + settings.sellTimingPct2 / 100)) : undefined;
      const inZone =
        settings.useTimingPctLines && avg > 0 ? zoneSell(t.price, sell10, sell20) : false;

      rows.push({
        stockName: stock.name,
        type: "sell",
        date: t.date,
        price: t.price,
        inZone,
        referencePrice: sell10 ?? null,
        referenceLabel: avg ? `평단 ${Math.round(avg).toLocaleString()} 기준 1·2단계` : "보유 없음",
      });

      const left = lots.reduce((s, l) => s + l.qty, 0);
      if (left <= 0) delete avgCost[t.stockId];
    }
  }

  const buys = rows.filter((r) => r.type === "buy");
  const sells = rows.filter((r) => r.type === "sell");

  return {
    buyTotal: buys.length,
    buyInZone: buys.filter((r) => r.inZone).length,
    sellTotal: sells.length,
    sellInZone: sells.filter((r) => r.inZone).length,
    rows: rows.slice(-20).reverse(),
  };
}
