import type { Request, Response } from 'express';
import { PortfolioValidationError, validateHoldings } from '../models/portfolio';
import { getSavedHoldings, saveHoldings } from '../services/portfolioStorageService';
import type { GetHoldingsResponse, SaveHoldingsRequest } from '../types/api';
import type { PortfolioHoldings } from '../types/portfolio';

function parseHoldingsBody(body: unknown): PortfolioHoldings {
  if (!body || typeof body !== 'object' || !('holdings' in body)) {
    throw new PortfolioValidationError('缺少 holdings 欄位');
  }

  const holdings = (body as SaveHoldingsRequest).holdings;
  validateHoldings(holdings);
  return holdings;
}

export async function getHoldings(_req: Request, res: Response<GetHoldingsResponse>): Promise<void> {
  const holdings = await getSavedHoldings();
  res.json({ holdings });
}

export async function putHoldings(req: Request, res: Response<GetHoldingsResponse>): Promise<void> {
  const holdings = parseHoldingsBody(req.body);
  await saveHoldings(holdings);
  res.json({ holdings });
}
