export const SYMBOLS = ['0050', '00631L'] as const;
export type Symbol = (typeof SYMBOLS)[number];

export const EXPOSURE_MULTIPLIERS: Record<Symbol, number> = {
  '0050': 1,
  '00631L': 2,
};

export interface HoldingInput {
  shares: number;
  costPerShare: number;
}

export type PortfolioHoldings = Record<Symbol, HoldingInput>;

export type PortfolioPrices = Record<Symbol, number>;

export interface AssetBreakdown {
  symbol: Symbol;
  shares: number;
  costPerShare: number;
  currentPrice: number;
  marketValue: number;
  weightPercent: number;
  exposureMultiplier: number;
  exposure: number;
  costBasis: number;
  unrealizedPnL: number;
}

export interface PortfolioSummary {
  totalMarketValue: number;
  totalExposure: number;
  leverage: number;
  totalCost: number;
  unrealizedPnL: number;
  roiPercent: number;
}

export interface PortfolioResult {
  summary: PortfolioSummary;
  breakdown: AssetBreakdown[];
}
