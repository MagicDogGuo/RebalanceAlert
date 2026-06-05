import { describe, expect, it } from 'vitest';
import {
  calculatePortfolio,
  PortfolioValidationError,
  validateHoldings,
} from '../../src/models/portfolio';
import type { PortfolioHoldings, PortfolioPrices } from '../../src/types/portfolio';

const sampleHoldings: PortfolioHoldings = {
  '0050': { shares: 1000, costPerShare: 150.5 },
  '00631L': { shares: 500, costPerShare: 200.0 },
};

const samplePrices: PortfolioPrices = {
  '0050': 162.3,
  '00631L': 218.5,
};

describe('validateHoldings (FR-01-1)', () => {
  it('接受有效的成本與正整數股數', () => {
    expect(() => validateHoldings(sampleHoldings)).not.toThrow();
  });

  it('拒絕非正整數股數', () => {
    expect(() =>
      validateHoldings({
        ...sampleHoldings,
        '0050': { shares: 10.5, costPerShare: 150 },
      }),
    ).toThrow(PortfolioValidationError);
  });

  it('拒絕零或負股數', () => {
    expect(() =>
      validateHoldings({
        ...sampleHoldings,
        '00631L': { shares: 0, costPerShare: 200 },
      }),
    ).toThrow(PortfolioValidationError);
  });

  it('拒絕負成本', () => {
    expect(() =>
      validateHoldings({
        ...sampleHoldings,
        '0050': { shares: 100, costPerShare: -1 },
      }),
    ).toThrow(PortfolioValidationError);
  });
});

describe('calculatePortfolio (FR-01)', () => {
  it('FR-01-2 計算總市值', () => {
    const result = calculatePortfolio(sampleHoldings, samplePrices);

    // 162.3 * 1000 + 218.5 * 500 = 271550
    expect(result.summary.totalMarketValue).toBe(271550);
  });

  it('FR-01-3 計算實質曝險', () => {
    const result = calculatePortfolio(sampleHoldings, samplePrices);

    // 0050: 162300 * 1 + 00631L: 109250 * 2 = 380800
    expect(result.summary.totalExposure).toBe(380800);
  });

  it('FR-01-4 輸出小數點後三位的整體槓桿', () => {
    const result = calculatePortfolio(sampleHoldings, samplePrices);

    // 380800 / 271550 ≈ 1.402
    expect(result.summary.leverage).toBe(1.402);
    expect(result.summary.leverage.toString()).toMatch(/^\d+\.\d{1,3}$/);
  });

  it('計算各資產曝險倍數與市值權重', () => {
    const result = calculatePortfolio(sampleHoldings, samplePrices);
    const fifty = result.breakdown.find((item) => item.symbol === '0050');
    const leveraged = result.breakdown.find((item) => item.symbol === '00631L');

    expect(fifty?.exposureMultiplier).toBe(1);
    expect(fifty?.exposure).toBe(162300);
    expect(leveraged?.exposureMultiplier).toBe(2);
    expect(leveraged?.exposure).toBe(218500);
    expect(fifty?.weightPercent).toBe(59.77);
    expect(leveraged?.weightPercent).toBe(40.23);
  });

  it('在 10 毫秒內完成計算', () => {
    const start = performance.now();
    calculatePortfolio(sampleHoldings, samplePrices);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(10);
  });
});
