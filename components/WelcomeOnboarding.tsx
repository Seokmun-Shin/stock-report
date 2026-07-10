"use client";

import { BtnCreate, BtnReset, PanelCard } from "@/components/ui/PanelCard";
import { APP_VERSION } from "@/lib/appVersion";
import { PRODUCT_NAME } from "@/lib/appConfig";
import { PRODUCT_TAGLINE, PRODUCT_PURPOSE } from "@/lib/productPositioning";

export function WelcomeOnboarding({
  onStart,
}: {
  onStart: (choice: "demo" | "empty") => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <PanelCard className="w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-wide text-gain">{PRODUCT_NAME}</p>
        <h1 className="mt-2 text-xl font-bold text-white">{PRODUCT_TAGLINE}</h1>
        <p className="mt-1 text-sm font-medium text-gain">{PRODUCT_PURPOSE}</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          매수·매도 체결을 맞춰 두면 시세·뉴스와 합쳐 타이밍 판단이 됩니다. 데이터는 이 기기에만
          저장되며, 다른 PC·모바일로는 JSON 파일로 옮길 수 있습니다.
        </p>
        <ul className="mt-4 space-y-1.5 text-xs text-zinc-400">
          <li>· API·클라우드·Google 계정 불필요</li>
          <li>· 시세는 자동 조회(실패 시 수동 입력)</li>
          <li>· v{APP_VERSION}</li>
        </ul>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <BtnCreate className="flex-1" onClick={() => onStart("empty")}>
            빈 장부로 시작
          </BtnCreate>
          <BtnReset className="flex-1" onClick={() => onStart("demo")}>
            샘플로 먼저 보기
          </BtnReset>
        </div>
      </PanelCard>
    </div>
  );
}
