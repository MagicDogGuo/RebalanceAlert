import { describe, expect, it } from 'vitest';
import { formatLeverageSummaryMessage } from '../../src/line/formatLeverageSummaryMessage';
import type { LeverageAnalysisResponse } from '../../src/types/api';

const analysis: LeverageAnalysisResponse = {
  holdings: {
    '0050': { shares: 1000, costPerShare: 150.5 },
    '00631L': { shares: 500, costPerShare: 200.0 },
  },
  prices: {
    '0050': { close: 162.3, date: '2026-06-05', source: 'finmind' },
    '00631L': { close: 218.5, date: '2026-06-05', source: 'finmind' },
  },
  current: {
    leverage: 1.35,
    summary: {
      totalMarketValue: 271550,
      totalExposure: 366850,
      leverage: 1.35,
      totalCost: 250500,
      unrealizedPnL: 21050,
      roiPercent: 8.4,
    },
    breakdown: [],
  },
  atPurchase: {
    leverage: 1.28,
    summary: {
      totalMarketValue: 250500,
      totalExposure: 320640,
      leverage: 1.28,
      totalCost: 250500,
      unrealizedPnL: 0,
      roiPercent: 0,
    },
    breakdown: [],
  },
  rebalance: {
    targetLeverage: 1.3,
    currentLeverage: 1.35,
    leverageDrift: 0.05,
    action: 'reduce_leverage',
    summary: '建議減槓桿，賣出部分 00631L',
    trades: [],
    estimatedLeverageAfterRebalance: 1.3,
  },
  warnings: ['00631L 股價使用防禦預設值'],
};

describe('formatLeverageSummaryMessage', () => {
  it('包含現況摘要、買入時槓桿、再平衡建議與警告', () => {
    const message = formatLeverageSummaryMessage(analysis);

    expect(message).toContain('📊 0050 + 00631L 槓桿分析日報');
    expect(message).toContain('資料日期：2026-06-05');
    expect(message).toContain('【現況摘要】');
    expect(message).toContain('總市值：$271,550 元');
    expect(message).toContain('整體槓桿：1.350 倍');
    expect(message).toContain('【買入時槓桿】1.280 倍');
    expect(message).toContain('建議減槓桿，賣出部分 00631L');
    expect(message).toContain('⚠ 00631L 股價使用防禦預設值');
  });
});
