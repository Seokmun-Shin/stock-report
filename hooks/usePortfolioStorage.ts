"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { AppData } from "@/lib/types";
import { migrateAppData } from "@/lib/calc";
import { SEED, STORAGE_KEY } from "@/lib/seed";
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

function readLocalData(): AppData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("stock-report-v1");
  if (!raw) return null;
  try {
    const parsed = migrateAppData(JSON.parse(raw));
    return parsed.stocks.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeLocalCache(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function usePortfolioStorage() {
  const [mode, setMode] = useState<StorageMode>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userIdRef = useRef<string | null>(null);

  const loadCloudForUser = useCallback(async (userId: string) => {
    setSyncing(true);
    setSyncError(null);
    try {
      let cloud = await loadPortfolio(userId);
      const local = readLocalData();

      if (!cloud || cloud.stocks.length === 0) {
        cloud = local ?? SEED;
        await savePortfolio(userId, cloud);
      } else if (local && local.trades.length > cloud.trades.length) {
        const merge = confirm(
          "이 기기에 더 많은 매매 내역이 있습니다.\n클라우드 데이터를 이 기기 데이터로 덮어쓸까요?"
        );
        if (merge) {
          cloud = local;
          await savePortfolio(userId, local);
        }
      }

      writeLocalCache(cloud);
      setData(cloud);
      setMode("cloud");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "클라우드 불러오기 실패";
      setSyncError(msg);
      setData(readLocalData() ?? SEED);
      setMode("cloud");
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const local = readLocalData() ?? SEED;
      writeLocalCache(local);
      setData(local);
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

  const persist = useCallback(
    (next: AppData) => {
      setData(next);
      writeLocalCache(next);
      setSyncError(null);

      if (!userIdRef.current || !isSupabaseConfigured()) return;

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const uid = userIdRef.current;
        if (!uid) return;
        setSyncing(true);
        try {
          await savePortfolio(uid, next);
        } catch (e) {
          setSyncError(e instanceof Error ? e.message : "저장 실패");
        } finally {
          setSyncing(false);
        }
      }, 400);
    },
    []
  );

  return {
    mode,
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
    cloudEnabled: isSupabaseConfigured(),
  };
}
