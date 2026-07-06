"use client";

import { useEffect, useState } from "react";
import { PanelCard, PageSectionTitle } from "@/components/ui/PanelCard";

interface SetupStatus {
  kis: boolean;
  dart: boolean;
  fred: boolean;
  bok: boolean;
  loading: boolean;
  error: string | null;
}

export function SetupStatusPanel() {
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
    { key: "kis", label: "KIS Open API", tier: "필수", ok: status.kis, hint: "APP_KEY + APP_SECRET 둘 다 필요 · 시세·수급" },
    { key: "dart", label: "DART", tier: "권장", ok: status.dart, hint: "공시·감성" },
    { key: "fred", label: "FRED", tier: "권장", ok: status.fred, hint: "미국 거시" },
    { key: "bok", label: "BOK ECOS", tier: "권장", ok: status.bok, hint: "한국 거시" },
  ] as const;

  return (
    <PanelCard>
      <PageSectionTitle>API · 연동</PageSectionTitle>
      <p className="mt-1 text-xs text-ink-muted">
        서버 환경변수 등록 상태입니다. 로컬은 <code className="rounded bg-surface-dim px-1">.env.local</code>, 웹(Vercel)은
        Project → Settings → Environment Variables에 동일하게 등록 후 재배포하세요.
      </p>
      {status.error && <p className="mt-2 text-xs text-amber-800">{status.error}</p>}
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.key} className="flex items-start justify-between gap-2 rounded-lg border border-line/80 bg-surface-dim/50 px-3 py-2 text-sm">
            <div>
              <span className="font-medium text-ink">{r.label}</span>
              <span className="ml-1.5 text-[10px] text-ink-muted">({r.tier})</span>
              <p className="text-[11px] text-ink-muted">{r.hint}</p>
            </div>
            <span className={`shrink-0 text-xs font-bold ${status.loading ? "text-ink-muted" : r.ok ? "text-gain" : "text-loss"}`}>
              {status.loading ? "…" : r.ok ? "연결됨" : "미설정"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
        Supabase는 로그인 시 「동기화」 배지로 확인 · 종목코드 6자리는 종목 편집에서 · 매매 내역은 「기록」 탭 또는 CSV
      </p>
    </PanelCard>
  );
}
