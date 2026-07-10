"use client";

import { tabLabel } from "@/lib/appTabs";
import { AreaCardHeader, BtnCreate, PanelCard } from "@/components/ui/PanelCard";

export function EmptyPortfolioGuide({
  onAddStock,
  standalone = false,
}: {
  onAddStock: () => void;
  standalone?: boolean;
}) {
  return (
    <PanelCard>
      <AreaCardHeader
        title="기록·관리부터 시작"
        subtitle="체결을 맞춰 두면 시세·원천과 합쳐 「살까?팔까?」 타이밍 판단이 됩니다."
      />
      <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-zinc-300">
        <li>종목 추가 (이름 + 6자리 코드)</li>
        <li>매수·매도 체결 입력</li>
        <li>
          하단 「{tabLabel("verdict")}」「{tabLabel("sources")}」 탭에서 타이밍·근거 확인
        </li>
      </ol>
      {standalone && (
        <p className="mt-3 text-xs text-zinc-400">다른 기기 데이터는 「{tabLabel("settings")}」 → 백업에서 JSON으로 옮길 수 있습니다.</p>
      )}
      <div className="mt-4">
        <BtnCreate onClick={onAddStock} className="min-h-[2.75rem] touch-manipulation">
          종목 추가
        </BtnCreate>
      </div>
    </PanelCard>
  );
}
