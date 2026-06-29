/** 자주 쓰는 종목 — 이름 입력 시 코드 자동 제안 (KIS 시세용) */
const BY_NAME: Record<string, string> = {
  SK하이닉스: "000660",
  "SK hynix": "000660",
  삼성전자: "005930",
  삼성전기: "012610",
  LG에너지솔루션: "373220",
  NAVER: "035420",
  카카오: "035720",
  현대차: "005380",
  기아: "000270",
  HD현대중공업: "329180",
  두산에너빌리티: "034020",
};

export function suggestStockCode(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  if (BY_NAME[trimmed]) return BY_NAME[trimmed];
  const lower = trimmed.toLowerCase();
  for (const [key, code] of Object.entries(BY_NAME)) {
    if (key.toLowerCase() === lower) return code;
  }
  return undefined;
}
