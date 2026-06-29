export type TradeType = "buy" | "sell";

export interface Stock {
  id: string;
  name: string;
  /** KIS 시세 조회용 6자리 종목코드 (예: 삼성전자 005930) */
  code?: string;
}

export interface Trade {
  id: string;
  stockId: string;
  type: TradeType;
  date: string;
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  /** 표시·동일일 정렬용 (FIFO는 date 기준) */
  createdAt: string;
}

export interface AppData {
  stocks: Stock[];
  trades: Trade[];
  currentPrices: Record<string, number>;
  /** 매수 내역 중 '초기 투자금'으로 지정한 trade id 목록 */
  initialCapitalTradeIds: string[];
}

export interface StockSummary {
  stockId: string;
  stockName: string;
  buyAmount: number;
  sellAmount: number;
  tradeCost: number;
  tradeProfit: number;
  netProfit: number;
  returnRate: number;
  lastSellPrice: number | null;
  /** 최근 매도가 대비 −10% 매수선 */
  timing10: number | null;
  /** 최근 매도가 대비 −20% 매수선 */
  timing20: number | null;
  /** 평단 대비 +10% 매도선 */
  sellTiming10: number | null;
  /** 평단 대비 +20% 매도선 */
  sellTiming20: number | null;
  holdingQty: number;
  holdingAvgPrice: number;
  unrealizedPnl: number;
  currentPrice: number;
}

export interface PortfolioSummary {
  buyAmount: number;
  sellAmount: number;
  tradeCost: number;
  netProfitRealized: number;
  returnRateRealized: number;
  unrealizedPnl: number;
  totalPnl: number;
  /** 누적 (실현+미실현) ÷ (매수총액+매매비용) × 100 */
  totalReturnRate: number;
}

/** 선택한 매수 내역 기준 투자 성과 */
export interface InitialCapitalSummary {
  /** 선택 건 합계 (매수금액 + 수수료) */
  initialCapital: number;
  /** 실현 손익 (선택 lot 기준 FIFO) */
  realizedPnl: number;
  /** 미실현 손익 (선택 lot 잔여 보유분) */
  unrealizedPnl: number;
  /** realized + unrealized */
  totalPnl: number;
  /** 회수 현금 (선택 lot 매도 순유입) */
  recoveredCash: number;
  /** 아직 주식으로 묶인 원금 (선택 lot 잔여 매수원가+수수료) */
  stillInvested: number;
  /** 잔여 보유분 시가 평가 */
  holdingMarketValue: number;
  /** 현재 가치 = 회수현금 + 보유 시가 */
  currentValue: number;
  /** totalPnl / initialCapital × 100 */
  returnRate: number;
  selectedCount: number;
}

export type BuyTimingStatus = "watch" | "zone10" | "zone20" | "above";
export type SellTimingStatus = "watch" | "zone10" | "zone20" | "below";

/** @deprecated BuyTimingSignal 사용 */
export type TimingStatus = BuyTimingStatus;

export interface BuyTimingSignal {
  status: BuyTimingStatus;
  label: string;
  hint: string;
}

export interface SellTimingSignal {
  status: SellTimingStatus;
  label: string;
  hint: string;
}

/** @deprecated BuyTimingSignal 사용 */
export type TimingSignal = BuyTimingSignal;
