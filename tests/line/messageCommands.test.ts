import { describe, expect, it } from 'vitest';
import { parseLineCommand } from '../../src/line/messageCommands';

describe('parseLineCommand', () => {
  it('辨識槓桿查詢關鍵字', () => {
    expect(parseLineCommand('槓桿')).toBe('leverage');
    expect(parseLineCommand('幫我看分析')).toBe('leverage');
    expect(parseLineCommand('LEVERAGE')).toBe('leverage');
    expect(parseLineCommand('現況報告')).toBe('leverage');
  });

  it('辨識說明指令', () => {
    expect(parseLineCommand('說明')).toBe('help');
    expect(parseLineCommand('help')).toBe('help');
  });

  it('無法辨識時回傳 unknown', () => {
    expect(parseLineCommand('你好')).toBe('unknown');
    expect(parseLineCommand('   ')).toBe('unknown');
  });
});
