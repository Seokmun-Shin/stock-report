"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { AppData } from "@/lib/types";
import { migrateAppData } from "@/lib/calc";
import { EMPTY, SEED, STORAGE_KEY } from "@/lib/seed";
import { IS_STANDALONE, ONBOARDING_KEY } from "@/lib/appConfig";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { toAuthError } from "@/lib/supabase/authErrors";
import {
  loadPortfolio,
  onAuthStateChange,
  savePortfolio,
  signIn as supabaseSignIn,
  signOut,
  signUp as supabaseSignUp,
} from "@/lib/supabase/portfolio";

export type StorageMode = "loading" | "local" | "cloud" | "auth-required";
export type OnboardingChoice = "demo" | "empty";

function stamp(data: AppData): AppData {
  return { ...data, updatedAt: new Date().toISOString() };
}

function portfolioTimestamp(data: AppData | null | undefined): number {
  if (!data?.updatedAt) return 0;
  const t = Date.parse(data.updatedAt);
  return Number.isFinite(t) ? t : 0;
}

function readLocalData(): AppData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("stock-report-v1");
  if (!raw) return null;
  try {
    return migrateAppData(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocalCache(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function isOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function usePortfolioStorage() {
  const [mode, setMode] = useState<StorageMode>("loading");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userIdRef = useRef<string | null>(null);
  const pendingCloudRef = useRef<AppData | null>(null);

  const flushCloudSave = useCallback(async (uid: string, payload: AppData) => {
    setSyncing(true);
    setSyncError(null);
    try {
      await savePortfolio(uid, payload);
      pendingCloudRef.current = null;
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSyncing(false);
    }
  }, []);

  const loadCloudForUser = useCallback(async (userId: string) => {
    setSyncing(true);
    setSyncError(null);
    try {
      const cloud = await loadPortfolio(userId);
      const local = readLocalData();

      let next: AppData;

      if (cloud === null) {
        // 클라우드 행 없음 — 로컬이 있으면 올리고, 없으면 빈 포트폴리오 (SEED로 되살리지 않음)
        next = stamp(local ?? EMPTY);
        await savePortfolio(userId, next);
      } else {
        const cloudTs = portfolioTimestamp(cloud);
        const localTs = portfolioTimestamp(local);
        // 최신 updatedAt 우선. 종목 0개 클라우드도 유효한 상태 (삭제 반영)
        if (local && localTs > cloudTs) {
          next = { ...local, updatedAt: local.updatedAt ?? new Date().toISOString() };
          await savePortfolio(userId, next);
        } else {
          next = cloud.updatedAt ? cloud : stamp(cloud);
        }
      }

      writeLocalCache(next);
      setData(next);
      setMode("cloud");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "클라우드 불러오기 실패";
      setSyncError(msg);
      setData(readLocalData() ?? EMPTY);
      setMode("cloud");
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (IS_STANDALONE || !isSupabaseConfigured()) {
      const local = readLocalData();
      if (IS_STANDALONE && !isOnboarded() && !local) {
        setNeedsOnboarding(true);
        setMode("local");
        return;
      }
      const initial = local ?? (IS_STANDALONE ? EMPTY : SEED);
      writeLocalCache(initial);
      setData(initial);
      setMode("local");
      return;
    }

    const unsub = onAuthStateChange(async (uid) => {
      userIdRef.current = uid;
      if (!uid) {
        setUser(null);
        setData(null);
        setMode("auth-required");
        return;
      }

      const supabase = getSupabase();
      const { data: sessionData } = await supabase!.auth.getSession();
      setUser(sessionData.session?.user ?? null);
      await loadCloudForUser(uid);
    });

    return () => {
      unsub();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [loadCloudForUser]);

  useEffect(() => {
    function flushPending() {
      const uid = userIdRef.current;
      const pending = pendingCloudRef.current;
      if (!uid || !pending || IS_STANDALONE || !isSupabaseConfigured()) return;
      void savePortfolio(uid, pending);
    }
    window.addEventListener("beforeunload", flushPending);
    window.addEventListener("pagehide", flushPending);
    return () => {
      window.removeEventListener("beforeunload", flushPending);
      window.removeEventListener("pagehide", flushPending);
    };
  }, []);

  const completeOnboarding = useCallback((choice: OnboardingChoice) => {
    const next = stamp(choice === "demo" ? SEED : EMPTY);
    localStorage.setItem(ONBOARDING_KEY, "1");
    writeLocalCache(next);
    setData(next);
    setNeedsOnboarding(false);
    setMode("local");
  }, []);

  const persist = useCallback(
    (next: AppData, options?: { immediate?: boolean }) => {
      const stamped = stamp(next);
      setData(stamped);
      writeLocalCache(stamped);
      setSyncError(null);

      if (IS_STANDALONE || !userIdRef.current || !isSupabaseConfigured()) return;

      pendingCloudRef.current = stamped;
      if (saveTimer.current) clearTimeout(saveTimer.current);

      const uid = userIdRef.current;
      if (options?.immediate) {
        void flushCloudSave(uid, stamped);
        return;
      }

      saveTimer.current = setTimeout(() => {
        void flushCloudSave(uid, stamped);
      }, 400);
    },
    [flushCloudSave]
  );

  return {
    mode,
    needsOnboarding,
    completeOnboarding,
    user,
    data,
    persist,
    syncing,
    syncError,
    signIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabaseSignIn(email, password);
        if (error) throw toAuthError(error);
        if (!data.session?.user) throw new Error("로그인 세션을 만들 수 없습니다.");
        userIdRef.current = data.session.user.id;
        setUser(data.session.user);
        await loadCloudForUser(data.session.user.id);
      } catch (e) {
        throw toAuthError(e);
      }
    },
    signUp: async (email: string, password: string) => {
      const { data, error } = await supabaseSignUp(email, password);
      if (error) throw toAuthError(error);
      if (data.session?.user) {
        userIdRef.current = data.session.user.id;
        setUser(data.session.user);
        await loadCloudForUser(data.session.user.id);
      }
    },
    signOut: async () => {
      await signOut();
    },
    cloudEnabled: !IS_STANDALONE && isSupabaseConfigured(),
    standalone: IS_STANDALONE,
  };
}
