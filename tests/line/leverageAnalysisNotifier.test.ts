import { beforeEach, describe, expect, it, vi } from 'vitest';
const mockBuildLeverageAnalysisMessage = vi.fn();
const mockPushLineTextMessageToUsers = vi.fn();

vi.mock('../../src/line/buildLeverageAnalysisMessage', () => ({
  buildLeverageAnalysisMessage: (...args: unknown[]) => mockBuildLeverageAnalysisMessage(...args),
}));

vi.mock('../../src/services/lineMessagingService', () => ({
  pushLineTextMessageToUsers: (...args: unknown[]) => mockPushLineTextMessageToUsers(...args),
}));

vi.mock('../../src/config', () => ({
  config: {
    line: {
      notifyUserIds: ['U123'],
    },
  },
}));

import { sendLeverageAnalysisNotification } from '../../src/line/leverageAnalysisNotifier';

describe('sendLeverageAnalysisNotification', () => {
  beforeEach(() => {
    mockBuildLeverageAnalysisMessage.mockReset();
    mockPushLineTextMessageToUsers.mockReset();
  });

  it('成功時推送格式化後的槓桿分析摘要', async () => {
    mockBuildLeverageAnalysisMessage.mockResolvedValue('📊 0050 + 00631L 槓桿分析日報');

    await sendLeverageAnalysisNotification();

    expect(mockPushLineTextMessageToUsers).toHaveBeenCalledTimes(1);
    expect(mockPushLineTextMessageToUsers.mock.calls[0]?.[0]).toEqual(['U123']);
    expect(mockPushLineTextMessageToUsers.mock.calls[0]?.[1]).toContain('槓桿分析日報');
  });

  it('buildLeverageAnalysisMessage 回傳提示時一併推送', async () => {
    mockBuildLeverageAnalysisMessage.mockResolvedValue('⚠ 尚未儲存持股資料');

    await sendLeverageAnalysisNotification();

    expect(mockPushLineTextMessageToUsers).toHaveBeenCalledWith(['U123'], '⚠ 尚未儲存持股資料');
  });
});
