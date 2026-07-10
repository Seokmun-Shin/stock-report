import type { AppTab } from "@/lib/appTabs";
import { tabLabel } from "@/lib/appTabs";
import type { AppFlowStep } from "@/lib/appFlow";
import type { AppData } from "./types";

/**
 * (매매기록 + 원천) → 손익·상태 확인 → 매매 타이밍
 * — 기록·시세·뉴스가 같은 입력에서 손익(report)과 판단(verdict)이 나옴. 목적은 ③.
 */
export const LEDGER_FLOW_STEPS: AppFlowStep[] = [
  {
    step: 1,
    tab: "records",
    alsoTab: "sources",
    title: tabLabel("records"),
    short: "기록 + 원천",
    detail: `「${tabLabel("records")}」 체결·종목과 「${tabLabel("sources")}」 시세·뉴스·거시를 준비합니다. 둘 다 손익·타이밍 계산의 입력입니다.`,
    external: false,
  },
  {
    step: 2,
    tab: "report",
    title: tabLabel("report"),
    short: "손익·상태",
    detail: "실현·평가 손익과 보유 상태를 확인합니다. 매매 판단 전에 계좌가 어디쯤인지 보는 단계입니다.",
    external: false,
  },
  {
    step: 3,
    tab: "verdict",
    title: tabLabel("verdict"),
    short: "매매 타이밍",
    detail: `기록+원천을 합쳐 살까·팔까를 봅니다. 원천 검증은 「${tabLabel("sources")}」, 발굴은 「${tabLabel("discover")}」.`,
    external: false,
  },
];

export function ledgerStepForTab(tab: AppTab): AppFlowStep | undefined {
  if (tab === "discover") {
    return LEDGER_FLOW_STEPS[2];
  }
  if (tab === "settings") {
    return LEDGER_FLOW_STEPS[0];
  }
  return LEDGER_FLOW_STEPS.find((s) => s.tab === tab || s.alsoTab === tab);
}

/** 데이터가 있으면 타이밍 허브(verdict), 없으면 기록부터 */
export function defaultAppTab(data: Pick<AppData, "stocks">): AppTab {
  return data.stocks.length > 0 ? "verdict" : "records";
}
