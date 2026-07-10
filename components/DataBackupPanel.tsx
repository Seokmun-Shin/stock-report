"use client";

import { useRef, useState } from "react";
import type { AppData } from "@/lib/types";
import { downloadAppDataBackup, importAppDataFromFile, getLastBackupLabel, markBackupExported } from "@/lib/localDataBackup";
import { AreaCardHeader, BtnExport, BtnImport, PanelCard, UI, warnBanner } from "@/components/ui/PanelCard";

export function DataBackupPanel({
  data,
  onRestore,
}: {
  data: AppData;
  onRestore: (next: AppData) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(() => getLastBackupLabel());

  async function handleImport(file: File) {
    setError(null);
    try {
      const next = await importAppDataFromFile(file);
      if (
        data.stocks.length > 0 &&
        !confirm("현재 기록을 백업 파일로 덮어씁니다. 계속할까요?")
      ) {
        return;
      }
      onRestore(next);
      setRestored(true);
      setTimeout(() => setRestored(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "가져오기 실패");
    }
  }

  function handleExport() {
    downloadAppDataBackup(data);
    markBackupExported();
    setLastBackup(getLastBackupLabel());
  }

  return (
    <PanelCard>
      <AreaCardHeader
        title="다른 기기로 데이터 옮기기"
        subtitle="PC·모바일 각각 설치 후, JSON 파일로 기록을 옮깁니다. 자동 동기화는 없습니다."
      />
      <ol className={`mt-3 list-decimal space-y-1 pl-4 text-sm text-zinc-300 ${UI.micro}`}>
        <li>이 기기: JSON 내보내기</li>
        <li>카톡·메일·USB 등으로 파일 전송</li>
        <li>다른 기기 mtock → JSON 가져오기</li>
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <BtnExport onClick={handleExport}>JSON 내보내기</BtnExport>
        <BtnImport onClick={() => fileRef.current?.click()}>JSON 가져오기</BtnImport>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImport(f);
            e.target.value = "";
          }}
        />
      </div>
      {lastBackup && (
        <p className="mt-2 text-[11px] text-zinc-400">마지막 내보내기: {lastBackup}</p>
      )}
      {error && <p className={`mt-2 text-xs ${warnBanner}`}>{error}</p>}
      {restored && <p className="mt-2 text-xs text-gain">가져오기 완료.</p>}
    </PanelCard>
  );
}
