/** 메인 하단 탭 — 라벨·헤더 단일 출처 (친구 말투·반말 통일) */

export type AppTab = "verdict" | "discover" | "sources" | "records" | "report" | "settings";

export const APP_TABS: { id: AppTab; label: string }[] = [
  { id: "verdict", label: "살까?팔까?" },
  { id: "discover", label: "강추!!" },
  { id: "records", label: "기록해!" },
  { id: "sources", label: "왜?추천?" },
  { id: "report", label: "얼마벌어?" },
  { id: "settings", label: "설정!" },
];

export const APP_TAB_LABEL: Record<AppTab, string> = Object.fromEntries(
  APP_TABS.map((t) => [t.id, t.label])
) as Record<AppTab, string>;

export function tabLabel(tab: AppTab): string {
  return APP_TAB_LABEL[tab];
}

/** AppHeader — 타이틀·한 줄 설명 */
export const APP_TAB_HEADER: Record<AppTab, { title: string; desc: string }> = {
  verdict: {
    title: "살까?팔까?",
    desc: "매수·매도 타이밍 (기록+시세+원천)",
  },
  discover: {
    title: "강추!!",
    desc: "코스피·코스닥 관심 종목 Top 10",
  },
  sources: {
    title: "왜?추천?",
    desc: "강추·판단에 쓰인 데이터 검증",
  },
  records: {
    title: "기록해!",
    desc: "체결·종목 관리 — 타이밍 판단의 재료",
  },
  report: {
    title: "얼마벌어?",
    desc: "실현·평가 손익 · 벤치마크",
  },
  settings: {
    title: "설정!",
    desc: "전략·연동·데이터",
  },
};
