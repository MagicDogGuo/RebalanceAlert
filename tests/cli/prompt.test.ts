import { describe, expect, it } from 'vitest';
import { parseNonNegativeNumber, parsePositiveInteger } from '../../src/cli/prompt';

describe('prompt parsers (FR-03-1)', () => {
  it('接受正整數股數', () => {
    expect(parsePositiveInteger('1000')).toBe(1000);
    expect(parsePositiveInteger(' 500 ')).toBe(500);
  });

  it('拒絕非正整數股數', () => {
    expect(parsePositiveInteger('0')).toBeNull();
    expect(parsePositiveInteger('-1')).toBeNull();
    expect(parsePositiveInteger('10.5')).toBeNull();
    expect(parsePositiveInteger('abc')).toBeNull();
  });

  it('接受非負成本', () => {
    expect(parseNonNegativeNumber('150.5')).toBe(150.5);
    expect(parseNonNegativeNumber('0')).toBe(0);
  });

  it('拒絕無效成本', () => {
    expect(parseNonNegativeNumber('-1')).toBeNull();
    expect(parseNonNegativeNumber('abc')).toBeNull();
  });
});
