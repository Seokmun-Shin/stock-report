/** 판매·연구 공통 — 기록·관리로 매매 타이밍 (가계부식 거래 관리) */

import type { AppTab } from "@/lib/appTabs";
import { APP_TABS, APP_TAB_HEADER } from "@/lib/appTabs";

export const PRODUCT_TAGLINE = "내 주식 거래 관리";

/** 기록은 수단, 타이밍이 목적 */
export const PRODUCT_PURPOSE = "기록·관리 → 매매 타이밍";

/** 하단 탭 — 타이밍 → 발굴 → 기록 순 */
const LEDGER_TAB_ORDER: AppTab[] = ["verdict", "discover", "records", "report", "sources", "settings"];

const LEDGER_HEADERS: Record<AppTab, { title: string; desc: string }> = {
  verdict: {
    title: APP_TAB_HEADER.verdict.title,
    desc: "오늘 매수·매도 타이밍 (기록+시세+원천)",
  },
  records: {
    title: APP_TAB_HEADER.records.title,
    desc: "체결·종목 관리 — 타이밍 판단의 재료",
  },
  report: {
    title: APP_TAB_HEADER.report.title,
    desc: "손익·보유 상태 — 타이밍 보기 전 확인",
  },
  settings: { title: APP_TAB_HEADER.settings.title, desc: "필수 확인 · 전략 · API(선택)" },
  sources: { title: APP_TAB_HEADER.sources.title, desc: "타이밍·강추에 쓰인 원천 데이터" },
  discover: { title: APP_TAB_HEADER.discover.title, desc: "선택 — 종목 발굴 (KIS)" },
};

export function getNavTabs(_standalone = false) {
  return LEDGER_TAB_ORDER.map((id) => APP_TABS.find((t) => t.id === id)!);
}

export function getTabHeader(tab: AppTab, standalone: boolean): { title: string; desc: string } {
  if (standalone && tab === "settings") {
    return {
      title: APP_TAB_HEADER.settings.title,
      desc: "백업 · JSON 옮김 · API(선택)",
    };
  }
  return LEDGER_HEADERS[tab] ?? APP_TAB_HEADER[tab];
}
