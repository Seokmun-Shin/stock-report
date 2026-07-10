"use client";

import type { StockTradingPlan, TradingZone } from "@/lib/briefing/tradingZones";
import { fmt } from "@/lib/calc";
import { gainBlock, innerBlock, lossBlock } from "./ui/PanelCard";

function zoneStyle(kind: TradingZone["kind"], active: boolean) {
  if (!active) return `${innerBlock} text-zinc-300`;
  if (kind === "buy") return `${gainBlock} bg-red-500/10 text-gain`;
  if (kind === "sell") return `${lossBlock} bg-blue-500/10 text-loss`;
  return `${innerBlock} text-white`;
}

export function TimingZonesPanel({ plan, compact }: { plan: StockTradingPlan; compact?: boolean }) {
  if (plan.zones.length === 0) {
    return <p className="text-sm text-zinc-300">매매 구간을 계산하려면 매도·보유 내역이 필요합니다.</p>;
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className={`rounded-lg px-3 py-2 ${zoneStyle(plan.primaryAction, true)}`}>
        <p className="text-sm font-semibold">{plan.headline}</p>
        <p className="mt-0.5 text-xs leading-relaxed opacity-90">{plan.detail}</p>
      </div>

      <div className={`grid gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        {plan.zones.map((z) => (
          <div
            key={z.label}
            className={`rounded-lg px-3 py-2 text-xs ${zoneStyle(z.kind, z.active)} ${z.active ? "ring-1 ring-inset ring-current/20" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{z.label}</span>
              {z.active && <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-bold">현재</span>}
            </div>
            <p className="mt-1 tabular-nums">
              {z.priceHigh >= 1e12
                ? `${fmt(z.priceLow)} ~`
                : z.priceLow <= 0
                  ? `~ ${fmt(z.priceHigh)}`
                  : `${fmt(z.priceLow)} ~ ${fmt(z.priceHigh)}`}
            </p>
            <p className="mt-1 leading-snug opacity-90">{z.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimingZonesBriefRow({ plan }: { plan: StockTradingPlan }) {
  const active = plan.zones.filter((z) => z.active);
  return (
    <span className="text-xs">
      {active.length > 0 ? active.map((z) => z.label).join(", ") : plan.headline}
    </span>
  );
}
