import { createClient } from "@supabase/supabase-js";
import { IS_STANDALONE } from "@/lib/appConfig";
import { readLocalSecretsFile, withRequestSecrets } from "@/lib/server/runtimeSecrets";

async function loadUserSecretsWithToken(token: string): Promise<Record<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return {};

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return {};

  const { data, error } = await supabase
    .from("user_api_secrets")
    .select("secrets")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error || !data?.secrets || typeof data.secrets !== "object") return {};
  return Object.fromEntries(
    Object.entries(data.secrets as Record<string, unknown>).filter(
      ([, v]) => typeof v === "string" && v.trim()
    )
  ) as Record<string, string>;
}

export function bearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

/** 요청별 사용자 키 (온라인) 또는 로컬 파일 (패키지) */
export async function resolveSecretsForRequest(req: Request): Promise<Record<string, string>> {
  if (IS_STANDALONE) return readLocalSecretsFile();
  const token = bearerToken(req);
  if (!token) return {};
  return loadUserSecretsWithToken(token);
}

export async function runWithRequestSecrets<T>(req: Request, fn: () => T | Promise<T>): Promise<T> {
  const secrets = await resolveSecretsForRequest(req);
  return withRequestSecrets(secrets, () => fn());
}
