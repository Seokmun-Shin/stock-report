/** 카드·지표별 한 줄 설명 */

export const PORTFOLIO_HINTS = {
  buyAmount: "전 종목 매수 금액(단가×수량) 합계",
  sellAmount: "전 종목 매도 금액(단가×수량) 합계",
  tradeCost: "수수료·세금 등 매매에 든 비용 전체",
  netProfitRealized: "이미 매도해 확정된 순수익 (FIFO 기준)",
  unrealizedPnl: "아직 보유 중인 주식의 평가 손익",
  returnRate: "(실현+미실현) ÷ (매수총액+매매비용) × 100",
  totalPnl: "실현 순수익 + 미실현 손익 합계",
} as const;

export const INITIAL_CAPITAL_HINTS = {
  selectedCount: "「★」로 지정한 초기 투자 매수 건수",
  initialCapital: "선택 매수 건의 매수금액 + 수수료 합계",
  returnRate: "(실현+미실현) ÷ 투입 원금 × 100",
  recoveredCash: "「★」로 지정한 매수분을 매도해 받은 현금 (매도대금 − 비용)",
  stillInvested: "「★」 매수분 중 아직 팔지 않은 주식에 묶인 원금 (매수금+수수료)",
  holdingMarketValue: "「★」 매수분 중 남은 주식을 현재가로 평가한 금액",
  realizedPnl: "「★」 매수분을 매도해 확정된 손익",
  unrealizedPnl: "「★」 매수분 중 남은 주식의 평가 손익 (현재가−원금)",
  totalPnl: "실현 + 미실현 손익 합계",
  currentValue: "회수 현금 + 보유 시가. 전량 매도 시 회수 현금과 같음",
  fullySoldNote: "★ 지정 매수분을 모두 매도한 상태입니다. 회수 현금 = 투입 원금 + 실현 손익",
} as const;

export const STOCK_SETTLEMENT_HINTS = {
  buyAmount: "이 종목 매수 금액 합계",
  sellAmount: "이 종목 매도 금액 합계",
  tradeCost: "이 종목 수수료·세금 합계",
  netProfit: "매도 순이익 − 매매 비용 (실현 기준)",
  returnRate: "순수익 ÷ (매수총액+비용) × 100",
  holdingQty: "현재 계좌에 남아 있는 주식 수",
} as const;

export const TIMING_HINTS = {
  timing20: "최근 매도가 대비 −20% — 2차 매수 참고선",
  timing10: "최근 매도가 대비 −10% — 1차 매수 참고선",
  lastSellPrice: "가장 최근 매도 체결 단가",
  sellTiming10: "평단 대비 +10% — 1차 매도 참고선",
  sellTiming20: "평단 대비 +20% — 2차 익절 참고선",
  holdingAvgPriceSell: "보유분 평균 매수 단가 (매도선 기준)",
  holdingQty: "현재 보유 주식 수",
  holdingAvgPrice: "보유분 매수 단가 가중평균 (수수료 제외)",
  holdingAvgPriceWithCost: "보유분 매입단가 (매수 수수료 포함)",
  unrealizedPnlWithCost: "보유 시가 − 매입원가(수수료 포함)",
  unrealizedPnlPct: "비용 포함 평가손익 ÷ 매입원가 × 100",
  currentPrice: "미실현 손익·타이밍 판단. KIS 연동 시 「현재가 새로고침」으로 자동 입력",
} as const;
