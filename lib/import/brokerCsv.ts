/** 증권사별 체결 CSV — mtock 기본: 미래에셋 */

export type BrokerCsvFormat = "mirae" | "kis" | "kiwoom";

export const DEFAULT_BROKER_CSV: BrokerCsvFormat = "mirae";

export const BROKER_CSV_LABEL: Record<BrokerCsvFormat, string> = {
  mirae: "미래에셋",
  kis: "한국투자",
  kiwoom: "키움",
};

export const BROKER_CSV_GUIDE: Record<BrokerCsvFormat, { title: string; steps: string[]; note?: string }> = {
  mirae: {
    title: "미래에셋 카이로스 (HTS)",
    steps: [
      "주식 → 체결내역 조회 (또는 기간·종목별 매매일지 상세)",
      "조회 기간 설정 후 조회",
      "목록에서 우클릭 → 엑셀/CSV 저장",
      "아래 「파일 선택」으로 업로드",
    ],
    note: "체결 건별·매매일지(매수/매도 열) 형식 모두 인식합니다. M-STOCK은 CSV 저장이 없어 HTS를 사용하세요.",
  },
  kis: {
    title: "한국투자 HTS/MTS",
    steps: [
      "체결내역 → 기간 선택 → CSV 저장",
      "아래 「파일 선택」으로 업로드",
    ],
  },
  kiwoom: {
    title: "키움 영웅문",
    steps: [
      "[0433] 체결확인 → CSV 내보내기",
      "아래 「파일 선택」으로 업로드",
    ],
  },
};

const STORAGE_KEY = "stock-report-csv-broker";

export function loadPreferredBroker(): BrokerCsvFormat {
  if (typeof localStorage === "undefined") return DEFAULT_BROKER_CSV;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "mirae" || v === "kis" || v === "kiwoom") return v;
  return DEFAULT_BROKER_CSV;
}

export function savePreferredBroker(broker: BrokerCsvFormat) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, broker);
}
