"use client";

import type { WatchlistItem } from "@/lib/types";
import {
  AreaSectionHeader,
  AreaSectionSubtitle,
  AreaSectionTitle,
  HeaderActionButton,
  panelShell,
} from "@/components/ui/PanelCard";

export function WatchlistPanel({
  items,
  onRemove,
  onAddToPortfolio,
}: {
  items: WatchlistItem[];
  onRemove: (id: string) => void;
  onAddToPortfolio: (code: string, name: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className={panelShell}>
      <AreaSectionHeader>
        <div>
          <AreaSectionTitle>내 관심종목</AreaSectionTitle>
          <AreaSectionSubtitle>매매 기록 없이 추적 · 보유 등록 시 포트폴리오로 이동</AreaSectionSubtitle>
        </div>
      </AreaSectionHeader>

      <ul className="divide-y divide-line border-t border-line">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
              <p className="text-[10px] tabular-nums text-ink-muted">{item.code}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <HeaderActionButton
                onClick={() => onAddToPortfolio(item.code, item.name)}
                title="포트폴리오에 등록"
              >
                + 보유
              </HeaderActionButton>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="rounded-lg px-2 py-1 text-[10px] font-medium text-ink-muted hover:bg-surface-dim hover:text-loss"
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
