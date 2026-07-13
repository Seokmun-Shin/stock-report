/**
 * .env.local.research.bak → .env.local + data/local-secrets.json (키 값 출력 안 함)
 * 사용: node scripts/restore-env-from-backup.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const backupPath = path.join(root, ".env.local.research.bak");
const envPath = path.join(root, ".env.local");
const secretsPath = path.join(root, "data", "local-secrets.json");

const SECRET_KEYS = [
  "KIS_APP_KEY",
  "KIS_APP_SECRET",
  "KIS_USE_VTS",
  "DART_API_KEY",
  "FRED_API_KEY",
  "BOK_API_KEY",
];

function parseEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

if (!fs.existsSync(backupPath)) {
  console.error("백업 없음:", backupPath);
  process.exit(1);
}

fs.copyFileSync(backupPath, envPath);
const env = parseEnv(envPath);

const secrets = Object.fromEntries(
  SECRET_KEYS.map((k) => [k, env[k]]).filter(([, v]) => typeof v === "string" && v.trim())
);

if (Object.keys(secrets).length > 0) {
  fs.mkdirSync(path.dirname(secretsPath), { recursive: true });
  fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2), "utf8");
}

const configured = SECRET_KEYS.filter((k) => secrets[k]?.trim()).length;
console.log("복구 완료:");
console.log("  .env.local ← .env.local.research.bak");
console.log(`  data/local-secrets.json (${configured}개 API 키)`);
for (const k of SECRET_KEYS) {
  const ok = !!secrets[k]?.trim();
  console.log(`  ${ok ? "✅" : "○"} ${k}`);
}
console.log(
  `  ${env.NEXT_PUBLIC_SUPABASE_URL?.trim() ? "✅" : "○"} NEXT_PUBLIC_SUPABASE_URL`
);
console.log(
  `  ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ? "✅" : "○"} NEXT_PUBLIC_SUPABASE_ANON_KEY`
);
