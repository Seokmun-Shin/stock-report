/** API 키 필드 — 서버·클라이언트 공통 */

export const API_SECRET_KEYS = [
  "KIS_APP_KEY",
  "KIS_APP_SECRET",
  "KIS_USE_VTS",
  "DART_API_KEY",
  "FRED_API_KEY",
  "BOK_API_KEY",
] as const;

export type ApiSecretKey = (typeof API_SECRET_KEYS)[number];

export type ApiSecretsConfigured = {
  kis: boolean;
  dart: boolean;
  fred: boolean;
  bok: boolean;
};

export function configuredFromSecrets(secrets: Record<string, string | undefined>): ApiSecretsConfigured {
  return {
    kis: !!(secrets.KIS_APP_KEY?.trim() && secrets.KIS_APP_SECRET?.trim()),
    dart: !!secrets.DART_API_KEY?.trim(),
    fred: !!secrets.FRED_API_KEY?.trim(),
    bok: !!secrets.BOK_API_KEY?.trim(),
  };
}
