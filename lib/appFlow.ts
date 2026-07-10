import type { AppTab } from "@/lib/appTabs";
import { tabLabel } from "@/lib/appTabs";

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
    title: tabLabel("verdict"),
    short: "근거 수집 → 시점·금액",
    detail:
      `KIS 시세·시장·뉴스·공시와 내 매매기록을 모아 「${tabLabel("verdict")}」와 목표가·허용 구간을 계산합니다. 「${tabLabel("sources")}」은 입력값 검증, 「${tabLabel("discover")}」은 코스피·코스닥 관심 종목 발굴입니다.`,
    external: false,
  },
  {
    step: 2,
    tab: null,
    title: "체결",
    short: "증권사에서 주문",
    detail: `앱은 주문을 내지 않습니다. 「${tabLabel("verdict")}」 판단을 참고해 HTS·MTS에서 직접 매매합니다.`,
    external: true,
  },
  {
    step: 3,
    tab: "records",
    title: tabLabel("records"),
    short: "체결 내역 입력",
    detail:
      "증권사 확인서 기준으로 매수·매도를 입력합니다. 평단·최근 매도가·보유 수량이 갱신되어 다음 판단의 핵심 데이터가 됩니다.",
    external: false,
  },
  {
    step: 4,
    tab: "report",
    title: tabLabel("report"),
    short: "손익·수익률 확인",
    detail:
      `실현·미실현 손익, 월별·연별 실적, ★ 초기 투자금 대비 수익률을 봅니다. 누적 수익률·전일 대비 변화는 「${tabLabel("verdict")}」 보조 신호로도 씁니다.`,
    external: false,
  },
  {
    step: 5,
    tab: "settings",
    title: "설정",
    short: "전략·연동·데이터",
    detail:
      `매수/매도 % 규칙, 알림, API 연동 상태, CSV 가져오기, 클라우드 동기화를 관리합니다. 바꾼 뒤에는 「${tabLabel("verdict")}」 탭에서 새로고침하세요.`,
    external: false,
  },
];

export function stepForTab(tab: AppTab): AppFlowStep | undefined {
  if (tab === "discover") return APP_FLOW_STEPS.find((s) => s.step === 1);
  return APP_FLOW_STEPS.find((s) => s.tab === tab || s.alsoTab === tab);
}

export function flowStepLabel(step: number): string {
  const found = APP_FLOW_STEPS.find((s) => s.step === step);
  return found ? `${step}. ${found.title}` : `${step}단계`;
}
