"use client";

import type { AlertItem } from "@/lib/alerts";

const KIND_LABEL: Record<AlertItem["kind"], string> = {
  buy: "매수 구간",
  sell: "매도 구간",
  target: "목표가",
};

const KIND_STYLE: Record<AlertItem["kind"], string> = {
  buy: "border-gain/30 bg-gain-soft/40 text-gain",
  sell: "border-loss/30 bg-loss-soft/40 text-loss",
  target: "border-amber-200 bg-amber-50 text-amber-900",
};

export function PortfolioAlertBanner({
  alerts,
  onSelectStock,
}: {
  alerts: AlertItem[];
  onSelectStock?: (stockId: string) => void;
}) {
  if (alerts.length === 0) return null;

  const shown = alerts.slice(0, 5);

  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2.5">
      <p className="text-[11px] font-semibold text-ink-muted">오늘의 매매 구간 알림 · {alerts.length}건</p>
      <ul className="mt-2 space-y-1.5">
        {shown.map((a, i) => (
          <li key={`${a.stockId}-${a.kind}-${i}`}>
            <button
              type="button"
              onClick={() => onSelectStock?.(a.stockId)}
              className={`flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors hover:opacity-90 ${KIND_STYLE[a.kind]}`}
            >
              <span className="shrink-0 rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-bold">
                {KIND_LABEL[a.kind]}
              </span>
              <span className="font-medium leading-snug">{a.message}</span>
            </button>
          </li>
        ))}
      </ul>
      {alerts.length > 5 && (
        <p className="mt-1.5 text-center text-[10px] text-ink-muted">… 외 {alerts.length - 5}건</p>
      )}
    </div>
  );
}
