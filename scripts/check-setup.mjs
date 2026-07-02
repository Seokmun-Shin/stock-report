/**
 * 퇴사 전 체크리스트 — 로컬 설정·데이터 점검 (키 값은 출력하지 않음)
 * 사용: node scripts/check-setup.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = path.join(root, ".env.local");

function loadEnv() {
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

function keyStatus(env, key) {
  const v = env[key]?.trim() ?? "";
  if (!v) return { ok: false, note: "미설정" };
  if (/your_|placeholder|example|^xxx$/i.test(v)) return { ok: false, note: "플레이스홀더" };
  return { ok: true, note: `${v.length}자` };
}

function checkGitRemote() {
  try {
    const gitDir = path.join(root, ".git");
    if (!fs.existsSync(gitDir)) return { ok: false, note: "git 미초기화" };
    const config = fs.readFileSync(path.join(gitDir, "config"), "utf8");
    const m = config.match(/\[remote "origin"\][\s\S]*?url = (.+)/);
    if (!m) return { ok: false, note: "origin 없음" };
    return { ok: true, note: m[1].trim() };
  } catch {
    return { ok: false, note: "확인 불가" };
  }
}

function checkVercel() {
  const vercelJson = path.join(root, "vercel.json");
  const hasVercel = fs.existsSync(vercelJson);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  return { hasVercelFile: hasVercel, next: pkg.dependencies?.next ?? pkg.devDependencies?.next };
}

const env = loadEnv();
const rows = [
  ["KIS_APP_KEY", "필수", keyStatus(env, "KIS_APP_KEY")],
  ["KIS_APP_SECRET", "필수", keyStatus(env, "KIS_APP_SECRET")],
  ["DART_API_KEY", "권장", keyStatus(env, "DART_API_KEY")],
  ["FRED_API_KEY", "권장", keyStatus(env, "FRED_API_KEY")],
  ["BOK_API_KEY", "권장", keyStatus(env, "BOK_API_KEY")],
  ["NEXT_PUBLIC_SUPABASE_URL", "권장", keyStatus(env, "NEXT_PUBLIC_SUPABASE_URL")],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "권장", keyStatus(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY")],
];

console.log("=== mtock 퇴사 전 체크리스트 ===\n");
console.log(".env.local:", fs.existsSync(envPath) ? "있음" : "없음");
console.log("");

for (const [key, tier, st] of rows) {
  console.log(`${st.ok ? "✅" : "❌"} [${tier}] ${key}: ${st.note}`);
}

const git = checkGitRemote();
console.log(`\n${git.ok ? "✅" : "⚠️"} Git remote: ${git.note}`);

const vercel = checkVercel();
console.log(`${vercel.hasVercelFile ? "✅" : "ℹ️"} vercel.json: ${vercel.hasVercelFile ? "있음" : "없음 (Next 기본 배포 가능)"}`);
console.log(`ℹ️ Next.js: ${vercel.next}`);

console.log("\n--- API 연동 테스트 (로컬 서버 필요: npm run dev) ---");
console.log("GET /api/stock-prices → configured");
console.log("GET /api/briefing → configured.dart/fred/bok/kis");
