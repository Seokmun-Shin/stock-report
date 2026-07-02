/** KIS Open API — 시세·수급·호가 확장 데이터 */

export interface KisShortSaleRow {
  date: string;
  shortQty?: number;
  shortAmount?: number;
  shortBalanceQty?: number;
  /** 공매도 비중 (%) */
  shortBalanceRate?: number;
}

export interface KisQuoteExtended {
  open?: number;
  volume?: number;
  tradingValue?: number;
  marketCap?: number;
  per?: number;
  pbr?: number;
  eps?: number;
  bps?: number;
  listedShares?: number;
  upperLimit?: number;
  lowerLimit?: number;
  week52High?: number;
  week52Low?: number;
  /** 외국인 보유비율 (%) */
  foreignOwnershipPct?: number;
  /** 업종명 (KIS 시세) */
  sectorName?: string;
  /** 업종 중분류 코드 */
  sectorMidCode?: string;
}

export interface KisInvestorNet {
  personalNetQty?: number;
  foreignNetQty?: number;
  institutionNetQty?: number;
  /** 순매수 거래대금 (백만원, 음수=순매도) */
  personalNetAmount?: number;
  foreignNetAmount?: number;
  institutionNetAmount?: number;
  /** 증권·투신·연기금 등 (일별 API) */
  securitiesNetQty?: number;
  trustNetQty?: number;
  pensionNetQty?: number;
  asOf?: string;
}

/** 일별 확정 — 매수·매도 분리 (investor-trade-by-stock-daily) */
export interface KisInvestorGross {
  date: string;
  foreignBuyQty?: number;
  foreignSellQty?: number;
  institutionBuyQty?: number;
  institutionSellQty?: number;
  personalBuyQty?: number;
  personalSellQty?: number;
  foreignBuyAmount?: number;
  foreignSellAmount?: number;
  institutionBuyAmount?: number;
  institutionSellAmount?: number;
  personalBuyAmount?: number;
  personalSellAmount?: number;
}

export interface KisInvestorDailyRow {
  date: string;
  personalNetQty?: number;
  foreignNetQty?: number;
  institutionNetQty?: number;
  personalNetAmount?: number;
  foreignNetAmount?: number;
  institutionNetAmount?: number;
  foreignBuyQty?: number;
  foreignSellQty?: number;
  institutionBuyQty?: number;
  institutionSellQty?: number;
  personalBuyQty?: number;
  personalSellQty?: number;
}

export interface KisOrderBook {
  askPrice1?: number;
  bidPrice1?: number;
  askQty1?: number;
  bidQty1?: number;
  totalAskQty?: number;
  totalBidQty?: number;
  expectedPrice?: number;
  expectedQty?: number;
}

export interface KisProgramTrade {
  netBuyQty?: number;
  netBuyAmount?: number;
  buyQty?: number;
  sellQty?: number;
  asOf?: string;
}

export interface KisStockExtras {
  extended?: KisQuoteExtended;
  investor?: KisInvestorNet;
  /** 최근 영업일 확정 매수·매도 (일별 API) */
  investorGross?: KisInvestorGross;
  investorDaily?: KisInvestorDailyRow[];
  orderBook?: KisOrderBook;
  program?: KisProgramTrade;
  shortSaleDaily?: KisShortSaleRow[];
  /** 업종 지수 (KIS) */
  sectorIndex?: {
    label: string;
    price: number;
    changeRate: number;
    code: string;
  };
  /** API별 실패 메시지 (시세 제외) */
  errors?: Record<string, string>;
}
