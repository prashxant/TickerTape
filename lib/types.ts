export interface StockListItem {
  symbol: string;
  name: string | null;
  price: number | null;
  marketCap: number | null;
  peRatio: number | null;
  roe: number | null;
  debtEquity: number | null;
  dividendYield: number | null;
}

export type SearchResultItem = Pick<StockListItem, "symbol" | "name">;

export interface StockQuote {
  longName?: string;
  regularMarketPrice?: number | null;
  trailingPE?: number | null;
  marketCap?: number | null;
  forwardPE?: number | null;
  priceToBook?: number | null;
  dividendYield?: number | null;
  dividendRate?: number | null;
  volume?: number | null;
  averageVolume?: number | null;
  regularMarketDayHigh?: number | null;
  regularMarketDayLow?: number | null;
  regularMarketOpen?: number | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
}

export interface StockFinancialData {
  profitMargins?: number | null;
  grossMargins?: number | null;
  operatingMargins?: number | null;
  ebitda?: number | null;
  revenueGrowth?: number | null;
  earningsGrowth?: number | null;
  totalRevenue?: number | null;
  totalCash?: number | null;
  totalDebt?: number | null;
}

export interface StockDefaultKeyStatistics {
  forwardPE?: number | null;
  priceToBook?: number | null;
}

export interface StockAssetProfile {
  sector?: string;
  industry?: string;
  longBusinessSummary?: string;
}

export interface StockIncomeStatement {
  totalRevenue?: number | null;
  netIncome?: number | null;
}

export interface StockIncomeStatementHistory {
  incomeStatementHistory?: StockIncomeStatement[];
}

export interface StockBalanceSheetStatement {
  totalAssets?: number | null;
  totalLiab?: number | null;
}

export interface StockBalanceSheetHistory {
  balanceSheetStatements?: StockBalanceSheetStatement[];
}

export interface StockCashflowStatement {
  totalCashFromOperatingActivities?: number | null;
  freeCashFlow?: number | null;
}

export interface StockCashflowStatementHistory {
  cashflowStatements?: StockCashflowStatement[];
}

export interface StockSummary {
  financialData?: StockFinancialData;
  defaultKeyStatistics?: StockDefaultKeyStatistics;
  assetProfile?: StockAssetProfile;
  incomeStatementHistory?: StockIncomeStatementHistory;
  balanceSheetHistory?: StockBalanceSheetHistory;
  cashflowStatementHistory?: StockCashflowStatementHistory;
}

export interface StockChartData {
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      close?: Array<number | null>;
    }>;
  };
}

export interface StockApiResponse {
  quote: StockQuote;
  chart: StockChartData;
  summary?: StockSummary;
}
