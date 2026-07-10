import { createClient } from "@supabase/supabase-js";
import type { ApiSecretKey } from "@/lib/apiSecrets";
import { API_SECRET_KEYS } from "@/lib/apiSecrets";
import { maskSecret } from "@/lib/server/runtimeSecrets";

export async function saveUserSecrets(
  accessToken: string,
  patch: Record<string, string>
): Promise<{ userId: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Supabase가 설정되지 않았습니다.");

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) throw new Error("로그인이 필요합니다.");

  const { data: existing } = await supabase
    .from("user_api_secrets")
    .select("secrets")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  const current =
    existing?.secrets && typeof existing.secrets === "object"
      ? (existing.secrets as Record<string, string>)
      : {};

  const next: Record<string, string> = { ...current };
  for (const key of API_SECRET_KEYS) {
    if (!(key in patch)) continue;
    const v = String(patch[key] ?? "").trim();
    if (v) next[key] = v;
    else delete next[key];
  }

  const { error } = await supabase.from("user_api_secrets").upsert(
    {
      user_id: userData.user.id,
      secrets: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
  return { userId: userData.user.id };
}

export async function readUserSecretsMasked(accessToken: string): Promise<Record<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return {};

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) return {};

  const { data } = await supabase
    .from("user_api_secrets")
    .select("secrets")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  const raw =
    data?.secrets && typeof data.secrets === "object"
      ? (data.secrets as Record<string, string>)
      : {};

  const masked: Record<string, string> = {};
  for (const key of API_SECRET_KEYS) {
    if (key === "KIS_USE_VTS") {
      masked[key] = raw[key] ?? "false";
    } else if (raw[key]) {
      masked[key] = maskSecret(raw[key]);
    }
  }
  return masked;
}

export type { ApiSecretKey };
