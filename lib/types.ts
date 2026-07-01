export type TradeType = "buy" | "sell";

import type { ReportSettings } from "./reportSettings";

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
  /** 같은 날 FIFO 순서용 체결시각 (HH:mm) */
  executedTime?: string;
  quantity: number;
  price: number;
  fee: number;
  /** 매도 세금 합계 (거래세+농특세). legacy 단일 필드 */
  tax: number;
  /** 매도 거래세 (선택 — 없으면 tax만 사용) */
  transactionTax?: number;
  /** 매도 농특세 (선택) */
  ruralTax?: number;
  /** 표시·동일일 정렬용 (FIFO는 date + executedTime 기준) */
  createdAt: string;
}

export interface DailySnapshot {
  date: string;
  portfolioTotalPnl: number;
  portfolioTotalReturnRate: number;
  stockPrices: Record<string, number>;
  stockUnrealizedPnl: Record<string, number>;
}

export interface StockPeak {
  price: number;
  asOf: string;
}

export interface AppData {
  stocks: Stock[];
  trades: Trade[];
  currentPrices: Record<string, number>;
  /** 매수 내역 중 '초기 투자금'으로 지정한 trade id 목록 */
  initialCapitalTradeIds: string[];
  /** 일일 브리핑 시그널 설정 */
  reportSettings?: Partial<ReportSettings>;
  /** 일별 포트폴리오 스냅샷 (최근 90일) */
  dailySnapshots?: DailySnapshot[];
  /** 종목별 추적 고점 (매수 시그널용) */
  peakPrices?: Record<string, StockPeak>;
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
  /** 보유분 매입단가 (매수 수수료 포함) */
  holdingAvgPriceWithCost: number;
  unrealizedPnl: number;
  /** 비용 포함 평가손익 */
  unrealizedPnlWithCost: number;
  /** 비용 포함 평가수익률 % */
  unrealizedPnlPct: number;
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
