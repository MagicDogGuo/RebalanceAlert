import type { PortfolioSummary, Symbol } from './portfolio';
import type { StockPriceSource } from './stockPrice';

export interface CalculateLeverageRequest {
  holdings: Record<
    Symbol,
    {
      shares: number;
      costPerShare: number;
    }
  >;
}

export interface PriceQuoteResponse {
  close: number;
  date: string;
  source: StockPriceSource;
}

export interface BreakdownResponse {
  symbol: Symbol;
  shares: number;
  marketValue: number;
  weightPercent: number;
  exposureMultiplier: number;
  exposure: number;
}

export interface CalculateLeverageResponse {
  prices: Record<Symbol, PriceQuoteResponse>;
  summary: PortfolioSummary;
  breakdown: BreakdownResponse[];
  warnings: string[];
}

export interface ErrorResponse {
  error: string;
}
