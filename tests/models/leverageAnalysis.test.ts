import { describe, expect, it } from 'vitest';
import {
  calculateLeverageAnalysis,
  calculatePortfolio,
  calculateRebalanceAdvice,
} from '../../src/models/portfolio';
import type { PortfolioHoldings, PortfolioPrices } from '../../src/types/portfolio';

const sampleHoldings: PortfolioHoldings = {
  '0050': { shares: 1000, costPerShare: 150.5 },
  '00631L': { shares: 500, costPerShare: 200.0 },
};

const currentPrices: PortfolioPrices = {
  '0050': 162.3,
  '00631L': 218.5,
};

describe('calculateLeverageAnalysis', () => {
  it('計算買入時與現況槓桿', () => {
    const analysis = calculateLeverageAnalysis(sampleHoldings, currentPrices);
    const purchasePrices = {
      '0050': sampleHoldings['0050'].costPerShare,
      '00631L': sampleHoldings['00631L'].costPerShare,
    };
    const expectedCurrent = calculatePortfolio(sampleHoldings, currentPrices);
    const expectedPurchase = calculatePortfolio(sampleHoldings, purchasePrices);

    expect(analysis.current.summary.leverage).toBe(expectedCurrent.summary.leverage);
    expect(analysis.atPurchase.summary.leverage).toBe(expectedPurchase.summary.leverage);
    expect(analysis.rebalance.targetLeverage).toBe(expectedPurchase.summary.leverage);
    expect(analysis.rebalance.currentLeverage).toBe(expectedCurrent.summary.leverage);
  });

  it('買入時槓桿符合 1 + 00631L 成本權重', () => {
    const analysis = calculateLeverageAnalysis(sampleHoldings, currentPrices);
    const totalCost = analysis.atPurchase.summary.totalCost;
    const weight00631L =
      (sampleHoldings['00631L'].costPerShare * sampleHoldings['00631L'].shares) / totalCost;

    expect(analysis.atPurchase.summary.leverage).toBeCloseTo(1 + weight00631L, 3);
  });
});

describe('calculateRebalanceAdvice', () => {
  it('現況槓桿過高時建議賣 00631L 買 0050', () => {
    const highLeveragePrices: PortfolioPrices = {
      '0050': 100,
      '00631L': 300,
    };
    const analysis = calculateLeverageAnalysis(sampleHoldings, highLeveragePrices);

    expect(analysis.current.summary.leverage).toBeGreaterThan(analysis.atPurchase.summary.leverage);
    expect(analysis.rebalance.action).toBe('reduce_leverage');
    expect(analysis.rebalance.trades.some((trade) => trade.symbol === '00631L' && trade.side === 'sell')).toBe(true);
    expect(analysis.rebalance.trades.some((trade) => trade.symbol === '0050' && trade.side === 'buy')).toBe(true);
    expect(analysis.rebalance.summary).toContain('降低整體槓桿');
  });

  it('現況槓桿接近買入時則不需調整', () => {
    const purchasePrices = {
      '0050': sampleHoldings['0050'].costPerShare,
      '00631L': sampleHoldings['00631L'].costPerShare,
    };
    const advice = calculateRebalanceAdvice(
      sampleHoldings,
      purchasePrices,
      calculatePortfolio(sampleHoldings, purchasePrices).summary.leverage,
    );

    expect(advice.action).toBe('none');
    expect(advice.trades).toEqual([]);
  });
});
