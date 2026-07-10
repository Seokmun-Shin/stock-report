import { NextResponse } from "next/server";
import { IS_STANDALONE } from "@/lib/appConfig";
import { API_SECRET_KEYS, configuredFromSecrets } from "@/lib/apiSecrets";
import { guardApiRequest } from "@/lib/server/apiSecurity";
import { bearerToken, resolveSecretsForRequest } from "@/lib/server/requestSecrets";
import {
  maskSecret,
  readLocalSecretsFile,
  runtimeSecret,
  withRequestSecrets,
  writeLocalSecretsFile,
} from "@/lib/server/runtimeSecrets";
import { saveUserSecrets } from "@/lib/supabase/userSecrets";

function mergedConfigured() {
  return configuredFromSecrets({
    KIS_APP_KEY: runtimeSecret("KIS_APP_KEY"),
    KIS_APP_SECRET: runtimeSecret("KIS_APP_SECRET"),
    DART_API_KEY: runtimeSecret("DART_API_KEY"),
    FRED_API_KEY: runtimeSecret("FRED_API_KEY"),
    BOK_API_KEY: runtimeSecret("BOK_API_KEY"),
  });
}

function maskedSaved(secrets: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const key of API_SECRET_KEYS) {
    if (key === "KIS_USE_VTS") {
      out[key] = secrets[key] ?? runtimeSecret("KIS_USE_VTS") ?? "false";
    } else {
      const v = secrets[key] ?? runtimeSecret(key);
      if (v) out[key] = maskSecret(v);
    }
  }
  return out;
}

export async function GET(req: Request) {
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;

  const scope = await resolveSecretsForRequest(req);

  return withRequestSecrets(scope, () => {
    const file = IS_STANDALONE ? readLocalSecretsFile() : scope;
    return NextResponse.json({
      mode: IS_STANDALONE ? "local" : "cloud",
      canSave: IS_STANDALONE || !!bearerToken(req),
      configured: mergedConfigured(),
      saved: maskedSaved(file),
    });
  });
}

export async function POST(req: Request) {
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;

  let body: Record<string, string>;
  try {
    body = (await req.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "JSON 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (IS_STANDALONE) {
    const next: Record<string, string> = { ...readLocalSecretsFile() };
    for (const key of API_SECRET_KEYS) {
      if (!(key in body)) continue;
      const v = String(body[key] ?? "").trim();
      if (v) next[key] = v;
      else delete next[key];
    }
    writeLocalSecretsFile(next);
    return NextResponse.json({ ok: true });
  }

  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "로그인 후 API 키를 등록할 수 있습니다." }, { status: 401 });
  }

  try {
    const patch: Record<string, string> = {};
    for (const key of API_SECRET_KEYS) {
      if (key in body) patch[key] = String(body[key] ?? "");
    }
    await saveUserSecrets(token, patch);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "저장 실패" },
      { status: 400 }
    );
  }
}
