import type { StockEvent, Trade } from "./types";
import { uid } from "./calc";

export function applySplitToTrades(trades: Trade[], event: StockEvent): Trade[] {
  if (event.type !== "split" || !event.ratio || event.ratio <= 1) return trades;

  const ratio = event.ratio;
  return trades.map((t) => {
    if (t.stockId !== event.stockId || t.date > event.date) return t;
    return {
      ...t,
      quantity: Math.round(t.quantity * ratio),
      price: Math.round(t.price / ratio),
    };
  });
}

export function createStockEvent(
  stockId: string,
  type: StockEvent["type"],
  date: string,
  payload: { ratio?: number; amount?: number; memo?: string }
): StockEvent {
  return {
    id: uid(),
    stockId,
    type,
    date,
    ratio: payload.ratio,
    amount: payload.amount,
    memo: payload.memo,
  };
}
