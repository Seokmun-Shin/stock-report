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
      "HTS 로그인 → 상단 화면번호 입력란에 아래 번호 중 하나 입력",
      "【추천】0691 주문체결내역 — 체결 건별 (또는 0615 기간 종목별 매매일지 상세)",
      "계좌·조회기간 선택 → 조회 (내역 많으면 스크롤/더보기로 전부 로드)",
      "목록에서 우클릭 → 「Excel 파일로 저장」(또는 엑셀 저장)",
      "저장 파일을 mtock ③ 기록 또는 ⑤ 설정에서 가져오기",
    ],
    note: "메뉴: 계좌 → 주식 계좌/손익 → 기간 종목별 매매일지 상세(0615). M-STOCK은 저장 불가 → PC HTS 사용.",
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
