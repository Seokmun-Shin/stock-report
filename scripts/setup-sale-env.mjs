/**
 * 판매용 환경 설정 — .env.sale + API 키는 local-secrets.json
 * 사용: node scripts/setup-sale-env.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const saleExample = path.join(root, ".env.sale.example");
const envPath = path.join(root, ".env.local");
const backupPath = path.join(root, ".env.local.research.bak");
const secretsPath = path.join(root, "data", "local-secrets.json");

const KEY_NAMES = [
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

if (!fs.existsSync(saleExample)) {
  console.error(".env.sale.example 없음");
  process.exit(1);
}

fs.copyFileSync(saleExample, envPath);

const from = fs.existsSync(backupPath) ? backupPath : envPath;
const parsed = parseEnv(from);
const secrets = Object.fromEntries(
  KEY_NAMES.map((k) => [k, parsed[k]]).filter(([, v]) => typeof v === "string" && v.trim())
);

if (Object.keys(secrets).length > 0) {
  fs.mkdirSync(path.dirname(secretsPath), { recursive: true });
  fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2), "utf8");
}

console.log("판매용 설정 완료:");
console.log("  .env.local ← .env.sale.example (STANDALONE)");
console.log(`  data/local-secrets.json ← API ${Object.keys(secrets).length}개`);
console.log("");
console.log("다음: START-SALE.bat 또는 npm run dev");
