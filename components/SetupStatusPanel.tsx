"use client";

import { useEffect, useState } from "react";
import { tabLabel } from "@/lib/appTabs";
import {
  GlassRow,
  listDivide,
  AreaCardHeader,
  PanelCard,
  StatusPill,
  UI,
  warnBanner,
} from "@/components/ui/PanelCard";

interface SetupStatus {
  kis: boolean;
  dart: boolean;
  fred: boolean;
  bok: boolean;
  loading: boolean;
  error: string | null;
}

export function SetupStatusPanel({ standalone = false }: { standalone?: boolean }) {
  const [status, setStatus] = useState<SetupStatus>({
    kis: false,
    dart: false,
    fred: false,
    bok: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [kisRes, briefRes] = await Promise.all([fetch("/api/stock-prices"), fetch("/api/briefing")]);
        const kisJson = (await kisRes.json()) as { configured?: boolean };
        const briefJson = (await briefRes.json()) as {
          configured?: { dart?: boolean; fred?: boolean; bok?: boolean; kis?: boolean };
        };
        if (cancelled) return;
        setStatus({
          kis: !!kisJson.configured,
          dart: !!briefJson.configured?.dart,
          fred: !!briefJson.configured?.fred,
          bok: !!briefJson.configured?.bok,
          loading: false,
          error: null,
        });
      } catch {
        if (!cancelled) {
          setStatus((s) => ({ ...s, loading: false, error: "연동 상태를 불러오지 못했습니다." }));
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = [
    {
      key: "kis",
      label: "KIS Open API",
      tier: standalone ? "권장" : "필수",
      ok: status.kis,
      hint: standalone
        ? "미설정 시 Yahoo 시세 + 수동 입력 · 설정 시 수급·발굴 강화"
        : "APP_KEY + APP_SECRET 둘 다 필요 · 시세·수급",
    },
    { key: "dart", label: "DART", tier: "선택", ok: status.dart, hint: "공시·감성" },
    { key: "fred", label: "FRED", tier: "선택", ok: status.fred, hint: "미국 거시" },
    { key: "bok", label: "BOK ECOS", tier: "선택", ok: status.bok, hint: "한국 거시" },
  ] as const;

  return (
    <PanelCard>
      <AreaCardHeader
        title="API · 연동"
        subtitle={
          standalone ? (
            <>외부 클라우드 없음 · API 미설정 시 Yahoo 시세 + 수동 입력 · 키는 이 PC 파일에만 저장</>
          ) : (
            <>
              서버 환경변수 등록 상태입니다. 로컬은{" "}
              <code className="ui-glass-inset rounded px-1 py-0.5 text-zinc-200">.env.local</code>, 웹(Vercel)은
              Project → Settings → Environment Variables에 동일하게 등록 후 재배포하세요.
            </>
          )
        }
      />
      {status.error && <p className={`mt-2 ${warnBanner}`}>{status.error}</p>}
      <ul className={`mt-3 space-y-2 ${listDivide}`}>
        {rows.map((r) => (
          <li key={r.key}>
            <GlassRow className="!rounded-none !bg-transparent px-0 py-3 first:pt-0">
              <div className="min-w-0">
                <span className="font-medium text-white">{r.label}</span>
                <span className="ml-1.5 text-[10px] text-zinc-300">({r.tier})</span>
                <p className="text-[11px] text-zinc-300">{r.hint}</p>
              </div>
              {status.loading ? (
                <span className="text-xs text-zinc-400">…</span>
              ) : (
                <StatusPill variant={r.ok ? "ok" : "muted"}>
                  {r.ok ? "연결됨" : "미설정"}
                </StatusPill>
              )}
            </GlassRow>
          </li>
        ))}
      </ul>
      <p className={`mt-3 text-[11px] leading-relaxed ${UI.micro}`}>
        {standalone ? (
          <>
            시세 미연동 시 Yahoo Finance 자동 조회 · 종목코드 6자리는 종목 편집에서 · 매매 내역은 「
            {tabLabel("records")}」 탭 또는 CSV
          </>
        ) : (
          <>
            Supabase는 로그인 시 「동기화」 배지로 확인 · 종목코드 6자리는 종목 편집에서 · 매매 내역은 「
            {tabLabel("records")}」 탭 또는 CSV
          </>
        )}
      </p>
    </PanelCard>
  );
}
