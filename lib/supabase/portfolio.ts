import type { AppData } from "@/lib/types";
import { migrateAppData } from "@/lib/calc";
import { getSupabase } from "./client";

export async function loadPortfolio(userId: string): Promise<AppData | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("portfolios")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.data) return null;
  return migrateAppData(data.data as Partial<AppData>);
}

export async function savePortfolio(userId: string, appData: AppData): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from("portfolios").upsert(
    {
      user_id: userId,
      data: appData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function onAuthStateChange(callback: (userId: string | null) => void) {
  const supabase = getSupabase();
  if (!supabase) {
    callback(null);
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user?.id ?? null);
  });

  return () => subscription.unsubscribe();
}

export async function getSessionUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}
