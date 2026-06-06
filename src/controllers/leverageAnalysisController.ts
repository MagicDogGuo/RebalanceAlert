import type { Request, Response } from 'express';
import { buildCalculateResponse } from './calculateController';
import { calculateLeverageAnalysis, SavedHoldingsNotFoundError } from '../models/portfolio';
import { fetchStockPrices } from '../services/stockPriceService';
import { getSavedHoldings } from '../services/portfolioStorageService';
import type { LeverageAnalysisResponse } from '../types/api';
import type { PortfolioResult } from '../types/portfolio';
import type { FetchStockPricesResult } from '../types/stockPrice';

function mapBreakdown(result: PortfolioResult): LeverageAnalysisResponse['current']['breakdown'] {
  return result.breakdown.map((item) => ({
    symbol: item.symbol,
    shares: item.shares,
    marketValue: item.marketValue,
    weightPercent: item.weightPercent,
    exposureMultiplier: item.exposureMultiplier,
    exposure: item.exposure,
  }));
}

function mapAnalysisSection(result: PortfolioResult): LeverageAnalysisResponse['current'] {
  return {
    leverage: result.summary.leverage,
    summary: result.summary,
    breakdown: mapBreakdown(result),
  };
}

export function buildLeverageAnalysisResponse(
  holdings: NonNullable<Awaited<ReturnType<typeof getSavedHoldings>>>,
  stockPrices: FetchStockPricesResult,
  analysis: ReturnType<typeof calculateLeverageAnalysis>,
): LeverageAnalysisResponse {
  const calculateResponse = buildCalculateResponse(stockPrices, analysis.current);

  return {
    holdings,
    prices: calculateResponse.prices,
    current: mapAnalysisSection(analysis.current),
    atPurchase: mapAnalysisSection(analysis.atPurchase),
    rebalance: analysis.rebalance,
    warnings: calculateResponse.warnings,
  };
}

export async function analyzeLeverageFromSaved(_req: Request, res: Response<LeverageAnalysisResponse>): Promise<void> {
  const holdings = await getSavedHoldings();
  if (!holdings) {
    throw new SavedHoldingsNotFoundError();
  }

  const stockPrices = await fetchStockPrices();
  const analysis = calculateLeverageAnalysis(holdings, stockPrices.prices);

  res.json(buildLeverageAnalysisResponse(holdings, stockPrices, analysis));
}
