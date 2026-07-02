import type { AppTab } from "@/components/AppTabNav";

export type AppFlowStep = {
  step: number;
  tab: AppTab | null;
  /** 같은 단계로 묶는 보조 탭 (예: ① 판단 + 원천) */
  alsoTab?: AppTab;
  title: string;
  short: string;
  detail: string;
  external: boolean;
};

/** mtock 사용 흐름 — 5단계 순환 */
export const APP_FLOW_STEPS: AppFlowStep[] = [
  {
    step: 1,
    tab: "verdict",
    alsoTab: "sources",
    title: "판단",
    short: "원천 수집 → 시점·금액",
    detail:
      "KIS 시세·시장·뉴스·공시와 내 매매기록을 모아 「지금 살까/팔까」와 목표가·허용 구간을 계산합니다. 「원천」은 같은 판단의 입력값을 검증하는 탭입니다.",
    external: false,
  },
  {
    step: 2,
    tab: null,
    title: "체결",
    short: "증권사에서 주문",
    detail: "앱은 주문을 내지 않습니다. 판단을 참고해 HTS·MTS에서 직접 매매합니다.",
    external: true,
  },
  {
    step: 3,
    tab: "records",
    title: "기록",
    short: "체결 내역 입력",
    detail:
      "증권사 확인서 기준으로 매수·매도를 입력합니다. 평단·최근 매도가·보유 수량이 갱신되어 다음 판단의 핵심 데이터가 됩니다.",
    external: false,
  },
  {
    step: 4,
    tab: "report",
    title: "성과",
    short: "손익·수익률 확인",
    detail:
      "실현·미실현 손익, 월별·연별 실적, ★ 초기 투자금 대비 수익률을 봅니다. 누적 수익률·전일 대비 변화는 판단 보조 신호로도 쓰입니다.",
    external: false,
  },
  {
    step: 5,
    tab: "settings",
    title: "설정",
    short: "전략·연동·데이터",
    detail:
      "매수/매도 % 규칙, 알림, API 연동 상태, CSV 가져오기, 클라우드 동기화를 관리합니다. 바꾼 뒤에는 판단 탭에서 새로고침하세요.",
    external: false,
  },
];

export function stepForTab(tab: AppTab): AppFlowStep | undefined {
  return APP_FLOW_STEPS.find((s) => s.tab === tab || s.alsoTab === tab);
}

export function flowStepLabel(step: number): string {
  const found = APP_FLOW_STEPS.find((s) => s.step === step);
  return found ? `${step}. ${found.title}` : `${step}단계`;
}
