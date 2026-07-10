"use client";

import { useState } from "react";
import type { ReportSettings } from "@/lib/reportSettings";
import { DEFAULT_REPORT_SETTINGS, resolveReportSettings, formatFeePct, STRATEGY_PRESETS, STRATEGY_PRESET_LABEL, type StrategyPresetId } from "@/lib/reportSettings";
import { tabLabel } from "@/lib/appTabs";
import { SectionTitle } from "./StatCard";
import { BtnSave, BtnReset, BtnTextAction, innerBlock, PanelCard, UI } from "./ui/PanelCard";

type FormState = {
  useTimingPctLines: boolean;
  buyDropFromPeakPct: number;
  sellGainFromAvgPct: number;
  buyTimingPct1: number;
  buyTimingPct2: number;
  sellTimingPct1: number;
  sellTimingPct2: number;
  alertsEnabled: boolean;
  buyTotalFeePct: number;
  sellTotalFeePct: number;
  sellTransactionTaxPct: number;
};

function toForm(resolved: ReportSettings): FormState {
  return {
    useTimingPctLines: resolved.useTimingPctLines ?? true,
    buyDropFromPeakPct: resolved.buyDropFromPeakPct,
    sellGainFromAvgPct: resolved.sellGainFromAvgPct,
    buyTimingPct1: resolved.buyTimingPct1,
    buyTimingPct2: resolved.buyTimingPct2,
    sellTimingPct1: resolved.sellTimingPct1,
    sellTimingPct2: resolved.sellTimingPct2,
    alertsEnabled: resolved.alertsEnabled ?? true,
    buyTotalFeePct: resolved.buyTotalFeePct ?? 0.01362,
    sellTotalFeePct: resolved.sellTotalFeePct ?? 0.01264,
    sellTransactionTaxPct: resolved.sellTransactionTaxPct ?? 0.2,
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
  const [showAlerts, setShowAlerts] = useState(false);

  function save() {
    onSave({ ...resolved, ...form });
  }

  function reset() {
    setForm(toForm(DEFAULT_REPORT_SETTINGS));
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <PanelCard>
      <SectionTitle
        subtitle={
          <>
            아래 %는 <strong className="font-medium text-white">「{tabLabel("verdict")}」 탭의 매수/매도 시점·목표가</strong>에 직접 쓰입니다. 시세·뉴스·수급은
            별도로 더해지며, 이 규칙은 「최근 매도가·평단」 기준 뼈대입니다.
          </>
        }
      >
        매매 전략 (1단계·4단계 판단 규칙)
      </SectionTitle>

      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(STRATEGY_PRESETS) as StrategyPresetId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setForm((f) => ({ ...f, ...STRATEGY_PRESETS[id] }))}
            className="ui-segment-tab rounded-full px-2.5 py-1 hover:border-gain/30 hover:text-white"
          >
            {STRATEGY_PRESET_LABEL[id]}
          </button>
        ))}
        <span className="self-center text-[10px] text-zinc-300">프리셋 선택 후 「적용」</span>
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={form.useTimingPctLines}
          onChange={(e) => set("useTimingPctLines", e.target.checked)}
          className="mt-0.5 rounded border-white/10"
        />
        <span>
          단계별 목표가 사용 (권장)
          <span className="mt-0.5 block text-xs text-zinc-300">
            끄면 「목표까지 보유」「○%↓ 매수」 구간 판단이 약해집니다.
          </span>
        </span>
      </label>

      <div className={`mt-3 space-y-3 ${form.useTimingPctLines ? "" : "pointer-events-none opacity-40"}`}>
        <div>
          <p className="text-xs font-semibold text-gain">매수 — 최근 매도가 대비</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <PctField label="1단계 (−%)" value={form.buyTimingPct1} onChange={(v) => set("buyTimingPct1", v)} />
            <PctField label="2단계 (−%)" value={form.buyTimingPct2} onChange={(v) => set("buyTimingPct2", v)} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-loss">매도 — 보유 평단 대비</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <PctField label="1단계 (+%)" value={form.sellTimingPct1} onChange={(v) => set("sellTimingPct1", v)} />
            <PctField label="2단계 (+%)" value={form.sellTimingPct2} onChange={(v) => set("sellTimingPct2", v)} />
          </div>
        </div>
      </div>

      <div className={`mt-4 ${innerBlock}`}>
        <p className="text-xs font-semibold text-white">매매 비용 (미래에셋 최저 우대 기준)</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-300">
          예상 실현 손익·기록 「수수료/세금 적용」에 반영됩니다. 매수는 세금 없음, 매도는 증권거래세 0.20%가
          추가됩니다.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <FeeField
            label="매수 총 비용 (%)"
            hint="위탁+유관기관 · 세금 0%"
            value={form.buyTotalFeePct}
            onChange={(v) => set("buyTotalFeePct", v)}
          />
          <FeeField
            label="매도 수수료 (%)"
            hint="위탁+유관기관"
            value={form.sellTotalFeePct}
            onChange={(v) => set("sellTotalFeePct", v)}
          />
          <FeeField
            label="매도 증권거래세 (%)"
            hint="코스피/코스닥 공통"
            value={form.sellTransactionTaxPct}
            onChange={(v) => set("sellTransactionTaxPct", v)}
          />
        </div>
        <p className="mt-2 text-[10px] text-zinc-300">
          요약: 살 때 약 {formatFeePct(form.buyTotalFeePct)} · 팔 때 약{" "}
          {formatFeePct(form.sellTotalFeePct + form.sellTransactionTaxPct)} (수수료+세금)
        </p>
      </div>

      <BtnTextAction
        type="button"
        onClick={() => setShowAlerts((v) => !v)}
        className="mt-4 text-xs font-medium"
      >
        {showAlerts ? "알림 설정 접기" : "알림 설정 (선택)"}
      </BtnTextAction>

      {showAlerts && (
        <div className={`mt-2 space-y-2 ${innerBlock}`}>
          <p className="text-[11px] text-zinc-300">브라우저 알림 — 판단과 동일한 목표가 구간에 맞춰 동작합니다.</p>
          <div className="grid grid-cols-2 gap-2">
            <PctField
              label="고점 대비 알림 (−%)"
              value={form.buyDropFromPeakPct}
              onChange={(v) => set("buyDropFromPeakPct", v)}
            />
            <PctField
              label="평단 대비 알림 (+%)"
              value={form.sellGainFromAvgPct}
              onChange={(v) => set("sellGainFromAvgPct", v)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.alertsEnabled}
              onChange={(e) => set("alertsEnabled", e.target.checked)}
              className="rounded border-white/10"
            />
            브라우저 알림 (하루 1회)
          </label>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <BtnSave type="button" onClick={save} className="px-3 py-1.5 text-sm font-medium">
          적용
        </BtnSave>
        <BtnReset type="button" onClick={reset} className="text-sm">
          기본값 (10/20%)
        </BtnReset>
      </div>
    </PanelCard>
  );
}

function FeeField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="text-xs text-zinc-300">
      {label}
      <input
        type="number"
        min={0}
        max={2}
        step={0.00001}
        className={UI.input}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="mt-0.5 block text-[10px]">{hint}</span>
    </label>
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
    <label className="text-xs text-zinc-300">
      {label}
      <input
        type="number"
        min={1}
        max={99}
        className={`${UI.input} max-w-full`}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
