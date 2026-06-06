import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../../src/app';
import { calculateLeverageAnalysis } from '../../src/models/portfolio';

const mockGetSavedHoldings = vi.fn();
const mockFetchStockPrices = vi.fn();

vi.mock('../../src/services/portfolioStorageService', () => ({
  getSavedHoldings: (...args: unknown[]) => mockGetSavedHoldings(...args),
}));

vi.mock('../../src/services/stockPriceService', () => ({
  fetchStockPrices: (...args: unknown[]) => mockFetchStockPrices(...args),
}));

const savedHoldings = {
  '0050': { shares: 1000, costPerShare: 150.5 },
  '00631L': { shares: 500, costPerShare: 200.0 },
};

const stockPrices = {
  quotes: {
    '0050': { symbol: '0050', close: 162.3, date: '2026-06-05', source: 'finmind' as const },
    '00631L': { symbol: '00631L', close: 218.5, date: '2026-06-05', source: 'finmind' as const },
  },
  prices: { '0050': 162.3, '00631L': 218.5 },
  warnings: [],
};

describe('GET /api/v1/leverage-analysis', () => {
  beforeEach(() => {
    mockGetSavedHoldings.mockResolvedValue(savedHoldings);
    mockFetchStockPrices.mockResolvedValue(stockPrices);
  });

  it('回傳現況、買入時槓桿與再平衡建議', async () => {
    const response = await request(app).get('/api/v1/leverage-analysis');
    const expected = calculateLeverageAnalysis(savedHoldings, stockPrices.prices);

    expect(response.status).toBe(200);
    expect(response.body.holdings).toEqual(savedHoldings);
    expect(response.body.current.leverage).toBe(expected.current.summary.leverage);
    expect(response.body.atPurchase.leverage).toBe(expected.atPurchase.summary.leverage);
    expect(response.body.rebalance.targetLeverage).toBe(expected.rebalance.targetLeverage);
    expect(response.body.rebalance.summary).toBeTypeOf('string');
    expect(response.body.prices['0050'].close).toBe(162.3);
  });

  it('尚未儲存持股時回傳 404', async () => {
    mockGetSavedHoldings.mockResolvedValue(null);

    const response = await request(app).get('/api/v1/leverage-analysis');

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('尚未儲存持股資料');
  });
});
