import type { TradeRecommendation } from "@/lib/briefing/types";

export function actionLabel(action: TradeRecommendation["action"]) {
  if (action === "buy") return "매수";
  if (action === "sell") return "매도";
  return "관망";
}

export function urgencyLabel(u: TradeRecommendation["urgency"]) {
  if (u === "now") return "지금~오늘";
  if (u === "this_week") return "이번 주";
  return "구간 대기";
}

export function actionBadgeClass(action: TradeRecommendation["action"]) {
  if (action === "buy") return "bg-gain text-white";
  if (action === "sell") return "bg-loss text-white";
  return "bg-slate-500 text-white";
}

export function actionSoftClass(action: TradeRecommendation["action"]) {
  if (action === "buy") return "ui-gain-chip rounded-xl bg-red-500/10 text-gain";
  if (action === "sell") return "ui-loss-chip rounded-xl bg-blue-500/10 text-loss";
  return "ui-inner-block rounded-xl text-zinc-300";
}

export function actionTextClass(action: TradeRecommendation["action"]) {
  if (action === "buy") return "text-gain";
  if (action === "sell") return "text-loss";
  return "text-zinc-300";
}

export function ActionBadge({ action, size = "sm" }: { action: TradeRecommendation["action"]; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span className={`inline-flex shrink-0 rounded-md font-bold ${cls} ${actionBadgeClass(action)}`}>
      {actionLabel(action)}
    </span>
  );
}
