"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  AreaCardHeader,
  BtnSave,
  RefreshButton,
  GlassRow,
  PanelCard,
  StatusPill,
  UI,
  guidePanel,
  boxList,
  warnBanner,
} from "@/components/ui/PanelCard";
import { API_KEY_GUIDES } from "@/lib/apiKeyGuides";
import type { ApiSecretsConfigured } from "@/lib/apiSecrets";
import { authedFetch } from "@/lib/client/authedFetch";
import { REFRESH_ACTIONS } from "@/lib/refreshActions";
import { sanitizeExternalUrl } from "@/lib/safeUrl";
import { tabLabel } from "@/lib/appTabs";

interface SecretsState {
  mode: "local" | "cloud";
  canSave: boolean;
  configured: ApiSecretsConfigured;
  saved: Record<string, string>;
}

function GuideSteps({ guideId }: { guideId: string }) {
  const guide = API_KEY_GUIDES.find((g) => g.id === guideId);
  const [open, setOpen] = useState(guideId === "kis");
  if (!guide) return null;

  const portalUrl = sanitizeExternalUrl(guide.portalUrl);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold text-gain hover:underline"
      >
        {open ? "발급 안내 접기" : "키 발급 방법 보기"}
      </button>
      {open && (
        <div className={`mt-2 ${guidePanel}`}>
          <ol className="list-decimal space-y-1.5 pl-4">
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {portalUrl && (
            <p className="mt-2">
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gain hover:underline"
              >
                {guide.portalLabel} ↗
              </a>
            </p>
          )}
          {guide.notes?.map((note) => (
            <p key={note} className="mt-1.5 text-zinc-400">
              · {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function ApiKeysPanel({
  standalone = false,
  cloudEnabled = false,
  user,
}: {
  standalone?: boolean;
  cloudEnabled?: boolean;
  user?: User | null;
}) {
  const [status, setStatus] = useState<SecretsState | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [useVts, setUseVts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const needsLogin = !standalone && cloudEnabled && !user;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch("/api/secrets");
      if (!res.ok) throw new Error("API 키 상태를 불러올 수 없습니다.");
      const json = (await res.json()) as SecretsState;
      setStatus(json);
      setUseVts(json.saved.KIS_USE_VTS === "true");
      setForm({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [user?.id, standalone]);

  async function save() {
    if (needsLogin) {
      setError("로그인 후 저장할 수 있습니다.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: Record<string, string> = { ...form, KIS_USE_VTS: useVts ? "true" : "false" };
      const res = await authedFetch("/api/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "저장 실패");
      }
      setMessage(
        `저장했습니다. 「${REFRESH_ACTIONS.kis.label}」「${REFRESH_ACTIONS.briefing.label}」를 눌러 반영하세요.`
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  const storageHint = standalone
    ? "키는 이 PC의 data/local-secrets.json에만 저장됩니다."
    : user
      ? "키는 본인 Supabase 계정에만 저장됩니다 (다른 사용자와 공유되지 않음)."
      : "로그인하면 화면에서 키를 등록할 수 있습니다.";

  return (
    <PanelCard>
      <AreaCardHeader
        title="API · 연동"
        subtitle={`외부 데이터 연동 · ${storageHint} 입력하지 않아도 기록·손익은 사용할 수 있습니다.`}
      />

      {needsLogin && (
        <p className={`mt-2 ${warnBanner}`}>
          클라우드 사용 중입니다. API 키를 등록하려면 먼저 로그인하세요. (서버 관리자가 환경변수로 넣은 키가 있으면
          「연결됨」으로 표시될 수 있습니다.)
        </p>
      )}
      {error && <p className={`mt-2 text-xs ${warnBanner}`}>{error}</p>}
      {message && <p className="mt-2 text-xs text-gain">{message}</p>}

      <div className={`mt-4 ${boxList}`}>
        {API_KEY_GUIDES.map((guide) => {
          const ok = status?.configured[guide.id];
          return (
            <section key={guide.id} className="p-3 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white">
                    {guide.label}
                    <span className="ml-1.5 text-[10px] font-normal text-zinc-400">({guide.tier})</span>
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-300">{guide.summary}</p>
                </div>
                <StatusPill variant={ok ? "ok" : "muted"}>
                  {loading ? "…" : ok ? "연결됨" : "미설정"}
                </StatusPill>
              </div>

              <GuideSteps guideId={guide.id} />

              <div className="mt-3 space-y-2">
                {guide.fields.map((f) => (
                  <label key={f.key} className="block">
                    <span className="text-xs font-medium text-white">{f.label}</span>
                    {status?.saved[f.key] && !form[f.key] && (
                      <span className="ml-2 text-[10px] text-zinc-500">저장됨: {status.saved[f.key]}</span>
                    )}
                    <input
                      type="password"
                      autoComplete="off"
                      disabled={needsLogin}
                      placeholder={status?.saved[f.key] ? "변경 시에만 입력" : f.placeholder}
                      className="ui-glass-input mt-1 w-full"
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>
            </section>
          );
        })}

        <GlassRow className="!rounded-lg px-3 py-2">
          <div>
            <span className="text-xs font-medium text-white">모의투자(VTS) 사용</span>
            <p className="text-[10px] text-zinc-400">KIS 모의투자 앱 키일 때만 켜세요</p>
          </div>
          <input
            type="checkbox"
            disabled={needsLogin}
            checked={useVts}
            onChange={(e) => setUseVts(e.target.checked)}
          />
        </GlassRow>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <BtnSave type="button" onClick={() => void save()} disabled={saving || needsLogin}>
          {saving ? "저장 중…" : "API 키 저장"}
        </BtnSave>
        <RefreshButton kind="apiStatus" loading={loading} onClick={() => void load()} disabled={loading} />
      </div>

      <p className={`mt-3 text-[11px] leading-relaxed ${UI.micro}`}>
        {standalone
          ? `키 저장 후 「${REFRESH_ACTIONS.kis.label}」「${REFRESH_ACTIONS.briefing.label}」로 반영 · 종목코드 6자리는 종목 편집 · 매매 내역은 「${tabLabel("records")}」 또는 CSV`
          : `Supabase 동기화는 로그인 시 「동기화」 배지로 확인 · 종목코드 6자리는 종목 편집 · 매매 내역은 「${tabLabel("records")}」 또는 CSV`}
      </p>
    </PanelCard>
  );
}
