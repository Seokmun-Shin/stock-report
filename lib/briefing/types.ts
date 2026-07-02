/** 외부 데이터 수집·매매 추천 공통 타입 */

export type MacroRegion = "US" | "JP" | "CN" | "TW" | "UK" | "EU" | "GLOBAL" | "KR";

export type MacroNewsTopic = "market" | "economy" | "rates" | "fx" | "geopolitics" | "policy";

export interface BriefingNewsItem {
  title: string;
  link: string;
  publishedAt: string;
  source: string;
  region?: MacroRegion;
  topic?: MacroNewsTopic;
}

export interface BriefingDisclosure {
  date: string;
  title: string;
  corpName: string;
  stockCode: string;
}

export interface GlobalIndexSnapshot {
  symbol: string;
  label: string;
  price: number;
  changeRate: number;
  updatedAt: string;
  region?: MacroRegion;
  category?: "index" | "volatility" | "futures" | "sector" | "crypto";
  unit?: string;
}

export interface MacroInstrumentSnapshot {
  symbol: string;
  label: string;
  category: "rate" | "commodity" | "fx_index" | "risk";
  region: MacroRegion;
  price: number;
  changeRate: number;
  unit?: string;
  updatedAt: string;
}

export interface FxSnapshot {
  pair: string;
  rate: number;
  changeRate: number;
  updatedAt: string;
  region?: MacroRegion;
}

/** FRED · BOK ECOS 공식 경제지표 */
export interface OfficialIndicatorSnapshot {
  id: string;
  label: string;
  region: MacroRegion;
  source: "FRED" | "BOK";
  value: number;
  unit?: string;
  asOf: string;
  changeValue?: number;
  changeLabel?: string;
  updatedAt: string;
}

/** KOSPI·코스닥 시장 전체 투자자 (KIS) */
export interface MarketInvestorFlow {
  market: "KSP" | "KSQ";
  label: string;
  /** 당일·장중 (시세 API) */
  intraday?: {
    foreignNetQty?: number;
    institutionNetQty?: number;
    personalNetQty?: number;
    asOf?: string;
  };
  /** 최근 영업일 확정 (일별 API) */
  daily?: {
    date: string;
    foreignNetQty?: number;
    institutionNetQty?: number;
    personalNetQty?: number;
  }[];
  updatedAt: string;
}

/** KOSPI·KOSDAQ 등락 종목 수 */
export interface MarketBreadthSnapshot {
  label: string;
  advance: number;
  decline: number;
  unchanged: number;
  updatedAt: string;
  source: string;
}

/** 시장 공매도 (KIS 공매도 상위) */
export interface MarketShortSaleRow {
  date: string;
  shortQty?: number;
  shortBalanceQty?: number;
  shortBalanceRate?: number;
  stockCode?: string;
  stockName?: string;
}

export interface StockBriefingContext {
  stockId: string;
  stockName: string;
  stockCode?: string;
  news: BriefingNewsItem[];
  disclosures: BriefingDisclosure[];
  sentimentScore: number;
  sentimentLabel: string;
}

export interface MarketBriefingContext {
  fetchedAt: string;
  sources: { id: string; label: string; ok: boolean; note?: string }[];
  marketNews: BriefingNewsItem[];
  /** 미·일·중·영·EU 등 주요국 뉴스·금리·국제정세 */
  macroNews: BriefingNewsItem[];
  globalIndices: GlobalIndexSnapshot[];
  /** 금리·달러·원자재 */
  macroInstruments: MacroInstrumentSnapshot[];
  fx: FxSnapshot | null;
  fxRates: FxSnapshot[];
  /** FRED(미국) · BOK ECOS(한국) 공식 지표 */
  officialIndicators: OfficialIndicatorSnapshot[];
  /** 코스피·코스닥 시장 전체 투자자 (KIS) */
  marketInvestorFlows?: MarketInvestorFlow[];
  /** KOSPI·KOSDAQ 등락 종목 수 */
  marketBreadth?: MarketBreadthSnapshot[];
  /** 코스피 시장 공매도 (KIS) */
  marketShortSale?: MarketShortSaleRow[];
  stocks: StockBriefingContext[];
  errors: string[];
}

export type TradeUrgency = "now" | "this_week" | "wait";

export interface TradeRecommendation {
  stockId: string;
  stockName: string;
  action: "buy" | "sell" | "hold";
  urgency: TradeUrgency;
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  confidence: number;
  summary: string;
  factors: { source: string; text: string; impact: "positive" | "negative" | "neutral" }[];
  timingNote: string;
}
