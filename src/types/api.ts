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

export interface SaveHoldingsRequest {
  holdings: CalculateLeverageRequest['holdings'];
}

export interface GetHoldingsResponse {
  holdings: SaveHoldingsRequest['holdings'] | null;
}

export interface LeverageAnalysisResponse {
  holdings: SaveHoldingsRequest['holdings'];
  prices: Record<Symbol, PriceQuoteResponse>;
  current: {
    leverage: number;
    summary: PortfolioSummary;
    breakdown: BreakdownResponse[];
  };
  atPurchase: {
    leverage: number;
    summary: PortfolioSummary;
    breakdown: BreakdownResponse[];
  };
  rebalance: {
    targetLeverage: number;
    currentLeverage: number;
    leverageDrift: number;
    action: 'none' | 'reduce_leverage' | 'increase_leverage';
    summary: string;
    trades: Array<{
      symbol: Symbol;
      side: 'buy' | 'sell';
      shares: number;
      estimatedAmount: number;
    }>;
    estimatedLeverageAfterRebalance: number | null;
  };
  warnings: string[];
}
