"use client";

import { AuthForm } from "@/components/AuthForm";
import { AppPreferencesProvider } from "@/components/AppPreferencesProvider";
import { Dashboard } from "@/components/Dashboard";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { usePortfolioStorage } from "@/hooks/usePortfolioStorage";

export default function HomePage() {
  const {
    mode,
    needsOnboarding,
    completeOnboarding,
    user,
    data,
    persist,
    syncing,
    syncError,
    signIn,
    signUp,
    signOut,
    cloudEnabled,
    standalone,
  } = usePortfolioStorage();

  if (mode === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-400">
        불러오는 중…
      </div>
    );
  }

  if (needsOnboarding) {
    return <WelcomeOnboarding onStart={completeOnboarding} />;
  }

  if (mode === "auth-required") {
    return <AuthForm onSignIn={signIn} onSignUp={signUp} />;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-400">
        데이터를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <AppPreferencesProvider>
      <Dashboard
        data={data}
        persist={persist}
        user={user}
        signOut={signOut}
        syncing={syncing}
        syncError={syncError}
        cloudEnabled={cloudEnabled}
        standalone={standalone}
      />
    </AppPreferencesProvider>
  );
}
