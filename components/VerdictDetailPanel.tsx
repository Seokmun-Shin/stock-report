"use client";

import { useState } from "react";
import type { SideVerdict, VerdictGateDetail } from "@/lib/briefing/tradingVerdict";

function GateChips({ gates }: { gates: VerdictGateDetail }) {
  const items: { label: string; on: boolean; warn?: boolean }[] = [
    { label: "매수 구간", on: gates.inBuyZone },
    { label: "매도 구간", on: gates.inSellZone },
    { label: "매수선 위", on: gates.aboveBuyLine, warn: true },
    { label: "매도선 아래", on: gates.belowSellLine },
    { label: "낙하 칼", on: gates.fallingKnife, warn: true },
    { label: "시장 약세", on: gates.breadthBearish, warn: true },
    { label: "지수 하락", on: gates.marketDown, warn: true },
  ];
  const active = items.filter((i) => i.on);
  if (active.length === 0) return <p className="text-[11px] text-ink-muted">특별한 시장 게이트 없음</p>;

  return (
    <div className="flex flex-wrap gap-1">
      {active.map((i) => (
        <span
          key={i.label}
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
            i.warn ? "bg-amber-100 text-amber-900" : "bg-surface-dim text-ink-muted"
          }`}
        >
          {i.label}
        </span>
      ))}
    </div>
  );
}

function SideDetailBlock({ title, verdict, accent }: { title: string; verdict: SideVerdict; accent: string }) {
  const d = verdict.detail;
  if (!d || verdict.stance === "skip") return null;

  return (
    <div className="rounded-lg border border-line/80 bg-surface-dim/30 px-3 py-2.5">
      <p className={`text-xs font-bold ${accent}`}>{title}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] tabular-nums text-ink-muted">
        <span>
          점수 <strong className="text-ink">{d.effectiveScore ?? d.rawScore}</strong>
          {d.effectiveScore != null && d.effectiveScore !== d.rawScore && (
            <span className="ml-1 text-[10px]">(원 {d.rawScore})</span>
          )}
        </span>
        <span>
          확신도 <strong className="text-ink">{verdict.confidence}%</strong>
        </span>
        <span>
          데이터 <strong className="text-ink">{Math.round(verdict.dataQuality * 100)}%</strong>
        </span>
        {verdict.timing !== "skip" && (
          <span>
            시점 <strong className="text-ink">{verdict.when}</strong>
          </span>
        )}
      </div>
      {d.gates && (
        <div className="mt-2">
          <GateChips gates={d.gates} />
        </div>
      )}
      {d.factors.length > 0 && (
        <ul className="mt-2 space-y-1 text-[11px] leading-snug text-ink-muted">
          {d.factors.slice(0, 6).map((f, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="min-w-0 flex-1">{f.text}</span>
              <span className="shrink-0 tabular-nums">
                {f.buy > 0 && <span className="text-gain">+{f.buy}</span>}
                {f.sell > 0 && <span className="text-loss"> +{f.sell}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function VerdictDetailPanel({ buy, sell }: { buy: SideVerdict; sell: SideVerdict }) {
  const [open, setOpen] = useState(false);
  const hasDetail =
    (buy.detail && buy.stance !== "skip") || (sell.detail && sell.stance !== "skip");
  if (!hasDetail) return null;

  return (
    <div className="rounded-xl border border-line bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-semibold text-gain hover:bg-surface-dim/30"
      >
        판단 근거 상세 (점수·게이트·요인)
        <span className="text-ink-muted">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-line px-3 py-3">
          <SideDetailBlock title="매수" verdict={buy} accent="text-gain" />
          <SideDetailBlock title="매도" verdict={sell} accent="text-loss" />
          <p className="text-[10px] leading-relaxed text-ink-muted">
            점수는 시세·매매기록·시장 데이터를 합산한 참고값입니다. 투자 조언·수익 보장이 아닙니다.
          </p>
        </div>
      )}
    </div>
  );
}
