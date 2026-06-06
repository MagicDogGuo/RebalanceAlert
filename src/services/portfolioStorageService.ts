import { config, isMongoEnabled } from '../config';
import { PortfolioHoldingsModel } from '../db/portfolioHoldingsDocument';
import type { PortfolioHoldings } from '../types/portfolio';

export async function getSavedHoldings(): Promise<PortfolioHoldings | null> {
  if (!isMongoEnabled()) {
    return null;
  }

  const document = await PortfolioHoldingsModel.findOne({ profileId: config.mongodb.profileId }).lean();
  if (!document) {
    return null;
  }

  return document.holdings as PortfolioHoldings;
}

export async function saveHoldings(holdings: PortfolioHoldings): Promise<void> {
  if (!isMongoEnabled()) {
    return;
  }

  await PortfolioHoldingsModel.findOneAndUpdate(
    { profileId: config.mongodb.profileId },
    { holdings },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
}
