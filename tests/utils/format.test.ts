import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatLeverage,
  formatPercent,
  formatPrice,
} from '../../src/utils/format';

describe('format utilities (FR-03-2, FR-03-3)', () => {
  it('FR-03-2 金額加上千分位逗號', () => {
    expect(formatCurrency(1250000)).toBe('$1,250,000 元');
    expect(formatCurrency(271550)).toBe('$271,550 元');
  });

  it('FR-03-2 股價顯示兩位小數', () => {
    expect(formatPrice(104.15)).toBe('$104.15 元');
    expect(formatPrice(162.3)).toBe('$162.30 元');
  });

  it('FR-03-3 百分比顯示兩位小數並加上 %', () => {
    expect(formatPercent(8.29)).toBe('8.29%');
    expect(formatPercent(59.77)).toBe('59.77%');
  });

  it('槓桿顯示三位小數', () => {
    expect(formatLeverage(1.402)).toBe('1.402 倍');
  });
});
