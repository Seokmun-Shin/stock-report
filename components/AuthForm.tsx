"use client";

import { useEffect, useState } from "react";
import { UI, panelShell, panelBody, insetCard, warnBanner } from "@/components/ui/PanelCard";

const LAST_EMAIL_KEY = "stock-report-last-email";

export function AuthForm({
  onSignIn,
  onSignUp,
}: {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LAST_EMAIL_KEY);
    if (saved) setEmail(saved);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const trimmedEmail = email.trim();
    try {
      if (isSignUp) {
        await onSignUp(trimmedEmail, password);
        localStorage.setItem(LAST_EMAIL_KEY, trimmedEmail);
        setMessage("가입 완료! 이메일 확인 후 로그인하거나, 바로 로그인을 시도해 보세요.");
        setIsSignUp(false);
      } else {
        await onSignIn(trimmedEmail, password);
        localStorage.setItem(LAST_EMAIL_KEY, trimmedEmail);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className={`w-full max-w-sm ${panelShell} ${panelBody}`}>
        <h1 className="text-sm font-bold text-white">주식 매매 리포트</h1>
        <p className="mt-1 text-sm text-zinc-300">로그인하면 사무실·집에서 같은 데이터를 사용합니다.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-zinc-300">아이디 (이메일)</span>
            <input
              type="email"
              required
              autoComplete="username email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={UI.input}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-zinc-300">비밀번호</span>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder="6자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={UI.input}
            />
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="rounded border-white/20"
            />
            비밀번호 표시
          </label>

          {(email || password) && !isSignUp && (
            <div className={insetCard}>
              <p className="font-semibold text-white">입력 확인</p>
              <p className="mt-1 break-all">
                아이디: <span className="font-semibold text-white">{email || "—"}</span>
              </p>
              <p className="mt-0.5 break-all">
                비밀번호:{" "}
                <span className="font-semibold text-white">
                  {password ? (showPassword ? password : "•".repeat(Math.min(password.length, 12))) : "—"}
                </span>
              </p>
            </div>
          )}

          {error && <p className="text-xs text-loss">{error}</p>}
          {message && <p className="text-xs text-gain">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gain py-2.5 text-sm font-bold text-white hover:bg-gain/90 disabled:opacity-50"
          >
            {loading ? "처리 중…" : isSignUp ? "회원가입" : "로그인"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsSignUp((v) => !v);
            setError(null);
            setMessage(null);
          }}
          className="mt-4 w-full text-center text-xs text-zinc-300 hover:text-white"
        >
          {isSignUp ? "이미 계정이 있으신가요? 로그인" : "처음이신가요? 회원가입"}
        </button>

        <div className={`mt-5 ${warnBanner} leading-relaxed`}>
          <strong>로그인이 안 될 때</strong>
          <ol className="mt-1 list-decimal space-y-0.5 pl-4">
            <li>Supabase SQL Editor에서 이메일 인증 처리 (안내 참고)</li>
            <li>Users → <strong>Send password recovery</strong> 로 비밀번호 재설정</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
