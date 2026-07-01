"use client";

import { useState } from "react";
import type { ReportSettings } from "@/lib/reportSettings";
import { DEFAULT_REPORT_SETTINGS, resolveReportSettings } from "@/lib/reportSettings";
import { SectionTitle } from "./StatCard";

type FormState = {
  buyDropFromPeakPct: number;
  sellGainFromAvgPct: number;
  buyTimingPct1: number;
  buyTimingPct2: number;
  sellTimingPct1: number;
  sellTimingPct2: number;
  alertsEnabled: boolean;
};

function toForm(resolved: ReportSettings): FormState {
  return {
    buyDropFromPeakPct: resolved.buyDropFromPeakPct,
    sellGainFromAvgPct: resolved.sellGainFromAvgPct,
    buyTimingPct1: resolved.buyTimingPct1,
    buyTimingPct2: resolved.buyTimingPct2,
    sellTimingPct1: resolved.sellTimingPct1,
    sellTimingPct2: resolved.sellTimingPct2,
    alertsEnabled: resolved.alertsEnabled ?? false,
  };
}

export function StrategySettingsForm({
  settings,
  onSave,
}: {
  settings: Partial<ReportSettings> | undefined;
  onSave: (next: ReportSettings) => void;
}) {
  const resolved = resolveReportSettings(settings);
  const [form, setForm] = useState<FormState>(() => toForm(resolved));

  function save() {
    onSave({
      ...resolved,
      ...form,
    });
  }

  function reset() {
    setForm(toForm(DEFAULT_REPORT_SETTINGS));
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="rounded-xl border border-line bg-surface-dim/30 p-3">
      <SectionTitle>전략·시그널 설정</SectionTitle>
      <p className="mt-1 text-xs text-ink-muted">일일 브리핑·타이밍 레이더·알림에 공통 적용</p>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <PctField label="고점 대비 매수 (−%)" value={form.buyDropFromPeakPct} onChange={(v) => set("buyDropFromPeakPct", v)} />
        <PctField label="평단 대비 매도 (+%)" value={form.sellGainFromAvgPct} onChange={(v) => set("sellGainFromAvgPct", v)} />
        <PctField label="매수 1차 (−%)" value={form.buyTimingPct1} onChange={(v) => set("buyTimingPct1", v)} />
        <PctField label="매수 2차 (−%)" value={form.buyTimingPct2} onChange={(v) => set("buyTimingPct2", v)} />
        <PctField label="매도 1차 (+%)" value={form.sellTimingPct1} onChange={(v) => set("sellTimingPct1", v)} />
        <PctField label="매도 2차 (+%)" value={form.sellTimingPct2} onChange={(v) => set("sellTimingPct2", v)} />
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={form.alertsEnabled}
          onChange={(e) => set("alertsEnabled", e.target.checked)}
          className="rounded border-line"
        />
        브라우저 알림 (시그널·목표가, 하루 1회)
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={save} className="rounded-lg bg-gain px-3 py-1.5 text-sm font-medium text-white">
          적용
        </button>
        <button type="button" onClick={reset} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-muted">
          기본값
        </button>
      </div>
    </div>
  );
}

function PctField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="text-xs text-ink-muted">
      {label}
      <input
        type="number"
        min={1}
        max={99}
        className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-right tabular-nums"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
