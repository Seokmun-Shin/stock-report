/** process.env 만 — 클라이언트 번들 안전 (fs 없음). 패키지판 파일 키는 server/runtimeSecrets */

export function envSecret(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}
