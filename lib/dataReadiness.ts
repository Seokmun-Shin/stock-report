import type { AppData, Stock } from "./types";
import type { MarketBriefingContext } from "./briefing/types";

export type ReadinessItem = {
  id: string;
  severity: "warn" | "info";
  message: string;
  action?: string;
};

/** 판단·원천 탭에서 데이터가 비는 주요 원인 점검 */
export function assessDataReadiness(input: {
  data: AppData;
  kisConfigured: boolean | null;
  kisCodedCount: number;
  briefingContext: MarketBriefingContext | null;
  briefingLoading: boolean;
}): ReadinessItem[] {
  const items: ReadinessItem[] = [];
  const { data, kisConfigured, kisCodedCount, briefingContext, briefingLoading } = input;

  const noCode = data.stocks.filter((s) => !s.code?.trim());
  if (noCode.length > 0) {
    items.push({
      id: "stock-code",
      severity: "warn",
      message: `종목코드 미등록 ${noCode.length}개 (${noCode.map((s) => s.name).join(", ")})`,
      action: "종목 이름 옆 「수정」에서 6자리 코드 입력",
    });
  }

  if (kisConfigured === false) {
    items.push({
      id: "kis-env",
      severity: "info",
      message: "KIS 미설정 — Yahoo 시세 폴백 (현재가·지수만, 수급·호가 없음)",
      action: "종목코드 등록 후 「KIS 시세」 또는 「전체 새로고침」",
    });
  } else if (kisConfigured === true && kisCodedCount === 0 && data.stocks.length > 0) {
    items.push({
      id: "kis-code",
      severity: "warn",
      message: "KIS는 설정됐지만 종목코드가 없어 시세 조회 불가",
      action: "종목코드 등록 후 「KIS 시세」 또는 「전체 새로고침」",
    });
  }

  const zeroPrice = data.stocks.filter((s) => !(data.currentPrices[s.id] > 0));
  if (zeroPrice.length > 0) {
    items.push({
      id: "current-price",
      severity: "warn",
      message: `현재가 0원 ${zeroPrice.length}종목 — 손익·판단 신뢰도 낮음`,
      action: kisConfigured === false
        ? "종목코드 등록 후 시세 새로고침 · 또는 판단 탭에서 직접 입력"
        : "「KIS 시세」 또는 판단 탭에서 현재가 직접 입력",
    });
  }

  if (data.trades.length === 0) {
    items.push({
      id: "no-trades",
      severity: "info",
      message: "매매 기록 없음 — 평단·실현손익·타이밍선 미표시",
      action: "③ 기록 탭에서 체결 입력",
    });
  }

  if (!briefingLoading && !briefingContext) {
    items.push({
      id: "briefing",
      severity: "warn",
      message: "시장·뉴스·거시 데이터 미수집",
      action: "「데이터」 또는 「전체 새로고침」",
    });
  } else if (briefingContext) {
    const failed = briefingContext.sources?.filter((s) => !s.ok) ?? [];
    for (const s of failed) {
      if (s.id === "dart" && noCode.length > 0) continue;
      items.push({
        id: `src-${s.id}`,
        severity: "info",
        message: `${s.label}: ${s.note ?? "미수집"}`,
        action: s.note?.includes("미설정") ? "⑤ 설정 → API · 연동 확인" : undefined,
      });
    }
  }

  const noQuotes = data.stocks.filter(
    (s) => s.code?.trim() && !data.stockQuotes?.[s.id] && (data.currentPrices[s.id] ?? 0) > 0
  );
  if (noQuotes.length > 0) {
    items.push({
      id: "stale-quotes",
      severity: "info",
      message: `${noQuotes.length}종목 — 전일가·등락률 등 KIS 상세 시세 없음 (현재가만 있음)`,
      action: "「KIS 시세」로 상세 시세 갱신",
    });
  }

  return items;
}

export function stocksMissingCode(stocks: Stock[]): Stock[] {
  return stocks.filter((s) => !s.code?.trim());
}
