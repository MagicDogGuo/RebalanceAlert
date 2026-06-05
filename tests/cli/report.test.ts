import { describe, expect, it } from 'vitest';
import { renderReport } from '../../src/cli/report';
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

describe('renderReport (FR-03)', () => {
  it('FR-03-2 揭露 API 取得的股價', () => {
    const report = renderReport(stockPrices, portfolioResult);

    expect(report).toContain('【市場行情】');
    expect(report).toContain('元大台灣50 (0050)');
    expect(report).toContain('$104.15 元');
    expect(report).toContain('FinMind API');
    expect(report).toContain('元大台灣50正2 (00631L)');
    expect(report).toContain('$36.67 元');
  });

  it('FR-03-2 金額使用千分位格式', () => {
    const report = renderReport(stockPrices, portfolioResult);

    expect(report).toContain('$122,485 元');
    expect(report).toContain('$140,720 元');
  });

  it('FR-03-3 權重與 ROI 顯示百分比', () => {
    const report = renderReport(stockPrices, portfolioResult);

    expect(report).toContain('85.03%');
    expect(report).toContain('14.97%');
    expect(report).toContain('-51.15%');
  });

  it('顯示 fallback 警告', () => {
    const report = renderReport(
      {
        ...stockPrices,
        quotes: {
          '0050': { symbol: '0050', close: 160, date: '2026-06-05', source: 'fallback' },
          '00631L': { symbol: '00631L', close: 210, date: '2026-06-05', source: 'fallback' },
        },
        warnings: ['0050 API 失敗'],
      },
      portfolioResult,
    );

    expect(report).toContain('防禦預設股價');
    expect(report).toContain('【警告】');
    expect(report).toContain('0050 API 失敗');
  });
});
