import { NextResponse } from "next/server";
import { IS_STANDALONE } from "@/lib/appConfig";
import { guardApiRequest } from "@/lib/server/apiSecurity";
import {
  maskSecret,
  readLocalSecretsFile,
  runtimeSecret,
  writeLocalSecretsFile,
} from "@/lib/server/runtimeSecrets";

const ALLOWED_KEYS = [
  "KIS_APP_KEY",
  "KIS_APP_SECRET",
  "KIS_USE_VTS",
  "DART_API_KEY",
  "FRED_API_KEY",
  "BOK_API_KEY",
] as const;

export async function GET(req: Request) {
  if (!IS_STANDALONE) {
    return NextResponse.json({ error: "단독 실행판에서만 사용할 수 있습니다." }, { status: 404 });
  }
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;

  const file = readLocalSecretsFile();
  return NextResponse.json({
    configured: {
      kis: !!(runtimeSecret("KIS_APP_KEY") && runtimeSecret("KIS_APP_SECRET")),
      dart: !!runtimeSecret("DART_API_KEY"),
      fred: !!runtimeSecret("FRED_API_KEY"),
      bok: !!runtimeSecret("BOK_API_KEY"),
    },
    saved: {
      KIS_APP_KEY: maskSecret(file.KIS_APP_KEY ?? runtimeSecret("KIS_APP_KEY")),
      KIS_APP_SECRET: maskSecret(file.KIS_APP_SECRET ?? runtimeSecret("KIS_APP_SECRET")),
      DART_API_KEY: maskSecret(file.DART_API_KEY ?? runtimeSecret("DART_API_KEY")),
      FRED_API_KEY: maskSecret(file.FRED_API_KEY ?? runtimeSecret("FRED_API_KEY")),
      BOK_API_KEY: maskSecret(file.BOK_API_KEY ?? runtimeSecret("BOK_API_KEY")),
      KIS_USE_VTS: file.KIS_USE_VTS ?? process.env.KIS_USE_VTS ?? "false",
    },
  });
}

export async function POST(req: Request) {
  if (!IS_STANDALONE) {
    return NextResponse.json({ error: "단독 실행판에서만 사용할 수 있습니다." }, { status: 404 });
  }
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;

  let body: Record<string, string>;
  try {
    body = (await req.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "JSON 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const next: Record<string, string> = { ...readLocalSecretsFile() };
  for (const key of ALLOWED_KEYS) {
    if (key in body) {
      const v = String(body[key] ?? "").trim();
      if (v) next[key] = v;
      else delete next[key];
    }
  }

  writeLocalSecretsFile(next);
  return NextResponse.json({ ok: true });
}
