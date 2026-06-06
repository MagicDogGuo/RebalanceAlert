import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../../src/app';
import { calculatePortfolio } from '../../src/models/portfolio';

const mockFetchStockPrices = vi.fn();
const mockSaveHoldings = vi.fn();

vi.mock('../../src/services/stockPriceService', () => ({
  fetchStockPrices: (...args: unknown[]) => mockFetchStockPrices(...args),
}));

vi.mock('../../src/services/portfolioStorageService', () => ({
  saveHoldings: (...args: unknown[]) => mockSaveHoldings(...args),
}));

const validBody = {
  holdings: {
    '0050': { shares: 1000, costPerShare: 150.5 },
    '00631L': { shares: 500, costPerShare: 200.0 },
  },
};

describe('POST /api/v1/calculate-leverage', () => {
  beforeEach(() => {
    mockFetchStockPrices.mockResolvedValue({
      quotes: {
        '0050': { symbol: '0050', close: 104.15, date: '2026-06-05', source: 'finmind' },
        '00631L': { symbol: '00631L', close: 36.67, date: '2026-06-05', source: 'finmind' },
      },
      prices: { '0050': 104.15, '00631L': 36.67 },
      warnings: [],
    });
    mockSaveHoldings.mockResolvedValue(undefined);
  });

  it('回傳 200 與計算結果', async () => {
    const response = await request(app).post('/api/v1/calculate-leverage').send(validBody);

    expect(response.status).toBe(200);
    expect(response.body.prices['0050'].close).toBe(104.15);
    expect(response.body.prices['0050'].source).toBe('finmind');

    const expected = calculatePortfolio(validBody.holdings, {
      '0050': 104.15,
      '00631L': 36.67,
    });
    expect(response.body.summary.leverage).toBe(expected.summary.leverage);
    expect(response.body.breakdown).toHaveLength(2);
    expect(response.body.warnings).toEqual([]);
    expect(mockSaveHoldings).toHaveBeenCalledWith(validBody.holdings);
  });

  it('缺少 holdings 回傳 400', async () => {
    const response = await request(app).post('/api/v1/calculate-leverage').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('holdings');
  });

  it('股數非正整數回傳 400', async () => {
    const response = await request(app)
      .post('/api/v1/calculate-leverage')
      .send({
        holdings: {
          '0050': { shares: 10.5, costPerShare: 150 },
          '00631L': { shares: 500, costPerShare: 200 },
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('正整數');
  });

  it('包含 fallback 警告', async () => {
    mockFetchStockPrices.mockResolvedValue({
      quotes: {
        '0050': { symbol: '0050', close: 160, date: '2026-06-05', source: 'fallback' },
        '00631L': { symbol: '00631L', close: 210, date: '2026-06-05', source: 'fallback' },
      },
      prices: { '0050': 160, '00631L': 210 },
      warnings: ['0050 API 失敗'],
    });

    const response = await request(app).post('/api/v1/calculate-leverage').send(validBody);

    expect(response.status).toBe(200);
    expect(response.body.prices['0050'].source).toBe('fallback');
    expect(response.body.warnings).toContain('0050 API 失敗');
  });
});

describe('GET /api/v1/health', () => {
  it('回傳 200', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });
});

describe('GET / (前端頁面)', () => {
  it('回傳 index.html', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('0050 + 00631L 動態槓桿計算器');
    expect(response.text).toContain('holdings-form');
  });
});
