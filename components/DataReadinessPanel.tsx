"use client";

import type { ReadinessItem } from "@/lib/dataReadiness";
import { PanelCard, PageSectionTitle } from "@/components/ui/PanelCard";

export function DataReadinessPanel({ items }: { items: ReadinessItem[] }) {
  if (items.length === 0) {
    return (
      <PanelCard>
        <PageSectionTitle>데이터 연동</PageSectionTitle>
        <p className="mt-2 text-sm text-gain">필수 연동 항목이 모두 준비됐습니다.</p>
      </PanelCard>
    );
  }

  const warns = items.filter((i) => i.severity === "warn");
  const infos = items.filter((i) => i.severity === "info");

  return (
    <PanelCard>
      <PageSectionTitle>데이터 연동 점검</PageSectionTitle>
      <p className="mt-1 text-xs text-ink-muted">
        「— (없음)」「미설정」이 보일 때 아래 항목을 순서대로 확인하세요.
      </p>
      <ul className="mt-3 space-y-2">
        {[...warns, ...infos].map((item) => (
          <li
            key={item.id}
            className={`rounded-lg border px-3 py-2 text-sm ${
              item.severity === "warn"
                ? "border-amber-200 bg-amber-50/80 text-amber-950"
                : "border-line/80 bg-surface-dim/40 text-ink-muted"
            }`}
          >
            <p className="font-medium">{item.message}</p>
            {item.action && <p className="mt-0.5 text-xs opacity-90">→ {item.action}</p>}
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}

export function DataReadinessBanner({ items }: { items: ReadinessItem[] }) {
  const warns = items.filter((i) => i.severity === "warn");
  if (warns.length === 0) return null;

  return (
    <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-xs text-amber-950">
      <p className="font-bold">데이터 연동 {warns.length}건 확인 필요</p>
      <ul className="mt-1 space-y-0.5">
        {warns.slice(0, 3).map((w) => (
          <li key={w.id}>
            · {w.message}
            {w.action ? ` — ${w.action}` : ""}
          </li>
        ))}
        {warns.length > 3 && <li>· 외 {warns.length - 3}건 — ⑤ 설정에서 전체 확인</li>}
      </ul>
    </div>
  );
}
