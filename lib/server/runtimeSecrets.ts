import fs from "fs";
import path from "path";
import { envSecret } from "@/lib/envSecret";
import { IS_STANDALONE } from "@/lib/appConfig";

const SECRETS_FILE = path.join(process.cwd(), "data", "local-secrets.json");

let cached: Record<string, string> | null = null;
let requestScope: Record<string, string> | null = null;

export function withRequestSecrets<T>(secrets: Record<string, string>, fn: () => T): T {
  const prev = requestScope;
  requestScope = secrets;
  try {
    return fn();
  } finally {
    requestScope = prev;
  }
}

function loadFileSecrets(): Record<string, string> {
  if (!IS_STANDALONE) return {};
  if (cached) return cached;
  try {
    if (!fs.existsSync(SECRETS_FILE)) {
      cached = {};
      return cached;
    }
    const raw = fs.readFileSync(SECRETS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    cached = Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => typeof v === "string" && v.trim())
    ) as Record<string, string>;
    return cached;
  } catch {
    cached = {};
    return cached;
  }
}

export function clearSecretsCache() {
  cached = null;
}

/** 환경변수 → 요청 스코프 → (단독판) local-secrets.json 순 — 서버 API 전용 */
export function runtimeSecret(name: string): string | undefined {
  const fromEnv = envSecret(name);
  if (fromEnv) return fromEnv;
  const fromReq = requestScope?.[name]?.trim();
  if (fromReq) return fromReq;
  return loadFileSecrets()[name]?.trim() || undefined;
}

export function readLocalSecretsFile(): Record<string, string> {
  return { ...loadFileSecrets() };
}

export function writeLocalSecretsFile(secrets: Record<string, string>): void {
  if (!IS_STANDALONE) {
    throw new Error("로컬 키 저장은 단독 실행판에서만 가능합니다.");
  }
  const dir = path.dirname(SECRETS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const cleaned = Object.fromEntries(
    Object.entries(secrets).filter(([, v]) => typeof v === "string" && v.trim())
  );
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(cleaned, null, 2), "utf8");
  cached = cleaned;
}

export function maskSecret(value: string | undefined): string {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}${"*".repeat(Math.min(8, value.length - 4))}${value.slice(-2)}`;
}
