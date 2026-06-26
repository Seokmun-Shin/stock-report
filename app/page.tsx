"use client";

import { AuthForm } from "@/components/AuthForm";
import { Dashboard } from "@/components/Dashboard";
import { usePortfolioStorage } from "@/hooks/usePortfolioStorage";

export default function HomePage() {
  const { mode, user, data, persist, syncing, syncError, signIn, signUp, signOut, cloudEnabled } =
    usePortfolioStorage();

  if (mode === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-muted">
        불러오는 중…
      </div>
    );
  }

  if (mode === "auth-required") {
    return <AuthForm onSignIn={signIn} onSignUp={signUp} />;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-muted">
        데이터를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <Dashboard
      data={data}
      persist={persist}
      user={user}
      signOut={signOut}
      syncing={syncing}
      syncError={syncError}
      cloudEnabled={cloudEnabled}
    />
  );
}
