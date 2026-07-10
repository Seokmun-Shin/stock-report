"use client";

import type { ReadinessItem } from "@/lib/dataReadiness";
import {
  PanelCard,
  AreaCardHeader,
  warnBanner,
  innerBlock,
  listDivide,
} from "@/components/ui/PanelCard";

export function DataReadinessPanel({ items }: { items: ReadinessItem[] }) {
  if (items.length === 0) {
    return (
      <PanelCard>
        <AreaCardHeader title="필수 확인" subtitle="타이밍·손익에 필요한 항목이 준비됐습니다." />
        <p className="mt-2 text-sm text-gain">추가 설정 없이 사용할 수 있습니다.</p>
      </PanelCard>
    );
  }

  const warns = items.filter((i) => i.severity === "warn");
  const infos = items.filter((i) => i.severity === "info");

  return (
    <PanelCard>
      <AreaCardHeader
        title="필수 확인"
        subtitle="아래를 순서대로 하면 기록·타이밍·원천 데이터가 정확해집니다. API는 선택입니다."
      />
      <ul className={`mt-3 ${listDivide}`}>
        {[...warns, ...infos].map((item) => (
          <li
            key={item.id}
            className={`py-2.5 text-sm ${item.severity === "warn" ? `${warnBanner} !rounded-lg` : innerBlock}`}
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
    <div className={`mb-3 ${warnBanner}`}>
      <p className="font-bold">확인 {warns.length}건 — 타이밍·손익 정확도에 영향</p>
      <ul className="ui-warn-body mt-1 space-y-0.5 text-xs">
        {warns.slice(0, 3).map((w) => (
          <li key={w.id}>· {w.message}</li>
        ))}
        {warns.length > 3 && <li>· 외 {warns.length - 3}건 — 「설정!」에서 전체 확인</li>}
      </ul>
    </div>
  );
}

