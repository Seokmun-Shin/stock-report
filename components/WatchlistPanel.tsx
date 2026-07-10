"use client";

import type { WatchlistItem } from "@/lib/types";
import {
  AreaCardHeader,
  BtnCreate,
  BtnDelete,
  listDivide,
  panelBody,
  panelShell,
  pickDetailZone,
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
    <section className={`${panelShell} ${panelBody}`}>
      <AreaCardHeader
        title="내 관심종목"
        subtitle="매매 기록 없이 추적 · 보유 등록 시 포트폴리오로 이동"
      />

      <ul className={`${pickDetailZone} ${listDivide}`}>
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{item.name}</p>
              <p className="text-[10px] tabular-nums text-zinc-300">{item.code}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <BtnCreate
                onClick={() => onAddToPortfolio(item.code, item.name)}
                title="포트폴리오에 등록"
                className="px-2 py-1 text-xs"
              >
                + 보유
              </BtnCreate>
              <BtnDelete onClick={() => onRemove(item.id)} className="px-2 py-1 text-[10px]" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

