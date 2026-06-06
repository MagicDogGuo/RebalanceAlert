import { buildLeverageAnalysisResponse } from '../controllers/leverageAnalysisController';
import { calculateLeverageAnalysis, SavedHoldingsNotFoundError } from '../models/portfolio';
import { fetchStockPrices } from './stockPriceService';
import { getSavedHoldings } from './portfolioStorageService';
import type { LeverageAnalysisResponse } from '../types/api';

export { SavedHoldingsNotFoundError };

export async function getLeverageAnalysis(): Promise<LeverageAnalysisResponse> {
  const holdings = await getSavedHoldings();
  if (!holdings) {
    throw new SavedHoldingsNotFoundError();
  }

  const stockPrices = await fetchStockPrices();
  const analysis = calculateLeverageAnalysis(holdings, stockPrices.prices);

  return buildLeverageAnalysisResponse(holdings, stockPrices, analysis);
}
