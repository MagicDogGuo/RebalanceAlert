import type { Request, Response } from 'express';
import {
  calculatePortfolio,
  PortfolioValidationError,
  validateHoldings,
} from '../models/portfolio';
import { fetchStockPrices } from '../services/stockPriceService';
import type { CalculateLeverageResponse } from '../types/api';
import type { PortfolioHoldings, PortfolioResult } from '../types/portfolio';
import type { FetchStockPricesResult } from '../types/stockPrice';
import { SYMBOLS } from '../types/portfolio';

function parseHoldingsBody(body: unknown): PortfolioHoldings {
  if (!body || typeof body !== 'object' || !('holdings' in body)) {
    throw new PortfolioValidationError('缺少 holdings 欄位');
  }

  const holdings = (body as { holdings: PortfolioHoldings }).holdings;
  validateHoldings(holdings);
  return holdings;
}

export function buildCalculateResponse(
  stockPrices: FetchStockPricesResult,
  result: PortfolioResult,
): CalculateLeverageResponse {
  const prices = {} as CalculateLeverageResponse['prices'];
  for (const symbol of SYMBOLS) {
    const quote = stockPrices.quotes[symbol];
    prices[symbol] = {
      close: quote.close,
      date: quote.date,
      source: quote.source,
    };
  }

  return {
    prices,
    summary: result.summary,
    breakdown: result.breakdown.map((item) => ({
      symbol: item.symbol,
      shares: item.shares,
      marketValue: item.marketValue,
      weightPercent: item.weightPercent,
      exposureMultiplier: item.exposureMultiplier,
      exposure: item.exposure,
    })),
    warnings: stockPrices.warnings,
  };
}

export async function calculateLeverage(req: Request, res: Response): Promise<void> {
  const holdings = parseHoldingsBody(req.body);
  const stockPrices = await fetchStockPrices();
  const result = calculatePortfolio(holdings, stockPrices.prices);

  res.json(buildCalculateResponse(stockPrices, result));
}
