"use client";

import type { StockQuote } from "@/lib/types";
import { fmt, fmtPct } from "@/lib/calc";
import { CollapsibleSection, SummaryChip } from "./CollapsibleSection";
import { pickCard } from "./ui/PanelCard";

function fmtRatio(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(2);
}

function fmtCap(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${fmt(n)}억`;
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="shrink-0 text-xs text-zinc-400">{label}</span>
      <span className="text-right text-sm font-semibold tabular-nums text-white">{value}</span>
    </div>
  );
}

export function StockFundamentalsPanel({
  quote,
  stockName,
}: {
  quote?: StockQuote;
  stockName: string;
}) {
  const ext = quote?.kis?.extended;
  const sectorIdx = quote?.kis?.sectorIndex;

  const hasData =
    ext?.per != null ||
    ext?.pbr != null ||
    ext?.marketCap != null ||
    ext?.sectorName ||
    sectorIdx != null;

  if (!hasData) {
    return (
      <article className={`${pickCard} p-4`}>
        <h3 className="text-sm font-semibold text-white">펀더멘털</h3>
        <p className="mt-2 text-xs text-zinc-400">
          PER·업종 등은 KIS 시세 갱신 후 표시됩니다. 상단 「KIS 시세」를 눌러 주세요.
        </p>
      </article>
    );
  }

  const sectorTone =
    sectorIdx && sectorIdx.changeRate > 0
      ? "gain"
      : sectorIdx && sectorIdx.changeRate < 0
        ? "loss"
        : "neutral";

  return (
    <CollapsibleSection
      title="펀더멘털"
      subtitle={`${stockName} · KIS 기준 (투자 조언 아님)`}
      defaultOpen
      summary={
        <>
          {ext?.per != null && <SummaryChip label="PER" value={fmtRatio(ext.per)} />}
          {ext?.pbr != null && <SummaryChip label="PBR" value={fmtRatio(ext.pbr)} />}
          {ext?.sectorName && <SummaryChip label="업종" value={ext.sectorName} />}
          {sectorIdx && (
            <SummaryChip
              label={sectorIdx.label}
              value={fmtPct(sectorIdx.changeRate)}
              tone={sectorTone === "gain" ? "gain" : sectorTone === "loss" ? "loss" : "neutral"}
            />
          )}
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">밸류에이션</p>
          <MetricRow label="PER" value={fmtRatio(ext?.per)} />
          <MetricRow label="PBR" value={fmtRatio(ext?.pbr)} />
          <MetricRow label="EPS" value={ext?.eps != null ? fmt(ext.eps) : "—"} />
          <MetricRow label="BPS" value={ext?.bps != null ? fmt(ext.bps) : "—"} />
          <MetricRow label="시가총액" value={fmtCap(ext?.marketCap)} />
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">시장·업종</p>
          <MetricRow label="업종" value={ext?.sectorName ?? "—"} />
          {sectorIdx ? (
            <MetricRow
              label={`${sectorIdx.label} 지수`}
              value={`${fmt(sectorIdx.price)} (${fmtPct(sectorIdx.changeRate)})`}
            />
          ) : (
            <MetricRow label="업종 지수" value="—" />
          )}
          <MetricRow
            label="52주 고/저"
            value={
              ext?.week52High != null && ext?.week52Low != null
                ? `${fmt(ext.week52High)} / ${fmt(ext.week52Low)}`
                : "—"
            }
          />
          <MetricRow
            label="외국인 보유"
            value={ext?.foreignOwnershipPct != null ? fmtPct(ext.foreignOwnershipPct) : "—"}
          />
        </div>
      </div>
    </CollapsibleSection>
  );
}
