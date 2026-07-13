/**
 * 새로고침 버튼 — 갱신 대상별 라벨
 * 헤더 「전체 새로고침」은 탭별로 아래 항목을 묶어 실행합니다.
 */

export const REFRESH_ACTIONS = {
  /** KIS Open API — 보유 종목 현재가·등락·코스피/코스닥 */
  kis: {
    label: "KIS 시세",
    loading: "시세 조회…",
    hint: "보유 종목 현재가·등락·지수",
  },
  /** /api/briefing — 뉴스·공시·글로벌·금리·원자재·종목 컨텍스트 */
  briefing: {
    label: "뉴스·거시",
    loading: "수집 중…",
    hint: "뉴스·공시·글로벌·거시·종목 데이터",
  },
  /** KIS 순위 발굴 — 강추!! 탭 전용 */
  discovery: {
    label: "발굴 순위",
    loading: "순위 조회…",
    hint: "KIS 거래대금·등락·외국인 Top10",
  },
  /** API 키 패널 — 저장 여부만 재확인 */
  apiStatus: {
    label: "연동 상태",
    loading: "확인 중…",
    hint: "API 키 저장·연결 상태",
  },
  /** 헤더 — 탭별 일괄 갱신 (verdict/sources: kis+briefing, discover: discovery 등) */
  all: {
    label: "전체 새로고침",
    loading: "갱신 중…",
    hint: "이 탭에 필요한 데이터 일괄 갱신",
  },
} as const;

export type RefreshKind = keyof typeof REFRESH_ACTIONS;

export function refreshLabel(kind: RefreshKind, loading = false): string {
  const action = REFRESH_ACTIONS[kind];
  return loading ? action.loading : action.label;
}

export function refreshHint(kind: RefreshKind): string {
  return REFRESH_ACTIONS[kind].hint;
}
