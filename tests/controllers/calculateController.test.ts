import { describe, expect, it, vi } from 'vitest';
import { buildCalculateResponse } from '../../src/controllers/calculateController';
import { PortfolioValidationError } from '../../src/models/portfolio';
import type { PortfolioResult } from '../../src/types/portfolio';
import type { FetchStockPricesResult } from '../../src/types/stockPrice';

const stockPrices: FetchStockPricesResult = {
  quotes: {
    '0050': { symbol: '0050', close: 104.15, date: '2026-06-05', source: 'finmind' },
    '00631L': { symbol: '00631L', close: 36.67, date: '2026-06-05', source: 'finmind' },
  },
  prices: { '0050': 104.15, '00631L': 36.67 },
  warnings: [],
};

const portfolioResult: PortfolioResult = {
  summary: {
    totalMarketValue: 122485,
    totalExposure: 140720,
    leverage: 1.149,
    totalCost: 250750,
    unrealizedPnL: -128265,
    roiPercent: -51.15,
  },
  breakdown: [
    {
      symbol: '0050',
      shares: 1000,
      costPerShare: 150.5,
      currentPrice: 104.15,
      marketValue: 104150,
      weightPercent: 85.03,
      exposureMultiplier: 1,
      exposure: 104150,
      costBasis: 150500,
      unrealizedPnL: -46350,
    },
    {
      symbol: '00631L',
      shares: 500,
      costPerShare: 200.0,
      currentPrice: 36.67,
      marketValue: 18335,
      weightPercent: 14.97,
      exposureMultiplier: 2,
      exposure: 36670,
      costBasis: 100000,
      unrealizedPnL: -81665,
    },
  ],
};

describe('buildCalculateResponse', () => {
  it('組裝符合 API 契約的回應格式', () => {
    const response = buildCalculateResponse(stockPrices, portfolioResult);

    expect(response.prices['0050']).toEqual({
      close: 104.15,
      date: '2026-06-05',
      source: 'finmind',
    });
    expect(response.summary.leverage).toBe(1.149);
    expect(response.breakdown).toHaveLength(2);
    expect(response.breakdown[0]).toEqual({
      symbol: '0050',
      shares: 1000,
      marketValue: 104150,
      weightPercent: 85.03,
      exposureMultiplier: 1,
      exposure: 104150,
    });
    expect(response.warnings).toEqual([]);
  });
});

describe('parseHoldingsBody (via calculateLeverage validation)', () => {
  it('缺少 holdings 應拋出 PortfolioValidationError', async () => {
    const { calculateLeverage } = await import('../../src/controllers/calculateController');

    const req = { body: {} } as Parameters<typeof calculateLeverage>[0];
    const res = {
      json: vi.fn(),
    } as unknown as Parameters<typeof calculateLeverage>[1];

    await expect(calculateLeverage(req, res)).rejects.toBeInstanceOf(PortfolioValidationError);
  });
});
