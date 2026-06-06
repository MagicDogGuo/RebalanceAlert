import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockBuildLeverageAnalysisMessage = vi.fn();
const mockReplyLineTextMessage = vi.fn();

vi.mock('../../src/line/buildLeverageAnalysisMessage', () => ({
  buildLeverageAnalysisMessage: (...args: unknown[]) => mockBuildLeverageAnalysisMessage(...args),
}));

vi.mock('../../src/services/lineMessagingService', () => ({
  replyLineTextMessage: (...args: unknown[]) => mockReplyLineTextMessage(...args),
}));

vi.mock('../../src/config', () => ({
  config: {
    line: {
      notifyUserIds: ['U123'],
    },
  },
}));

import { handleLineWebhookEvents } from '../../src/line/lineWebhookHandler';

describe('handleLineWebhookEvents', () => {
  beforeEach(() => {
    mockBuildLeverageAnalysisMessage.mockReset();
    mockReplyLineTextMessage.mockReset();
    mockBuildLeverageAnalysisMessage.mockResolvedValue('槓桿分析內容');
  });

  it('文字訊息含槓桿關鍵字時回覆分析內容', async () => {
    await handleLineWebhookEvents([
      {
        type: 'message',
        replyToken: 'reply-token',
        source: { type: 'user', userId: 'U123' },
        message: { type: 'text', text: '目前槓桿多少' },
      },
    ]);

    expect(mockBuildLeverageAnalysisMessage).toHaveBeenCalledTimes(1);
    expect(mockReplyLineTextMessage).toHaveBeenCalledWith('reply-token', '槓桿分析內容');
  });

  it('未授權使用者收到拒絕訊息', async () => {
    await handleLineWebhookEvents([
      {
        type: 'message',
        replyToken: 'reply-token',
        source: { type: 'user', userId: 'U999' },
        message: { type: 'text', text: '槓桿' },
      },
    ]);

    expect(mockBuildLeverageAnalysisMessage).not.toHaveBeenCalled();
    expect(mockReplyLineTextMessage).toHaveBeenCalledWith('reply-token', '此帳號未授權使用查詢功能。');
  });

  it('加好友時回覆歡迎訊息', async () => {
    await handleLineWebhookEvents([
      {
        type: 'follow',
        replyToken: 'reply-token',
        source: { type: 'user', userId: 'U123' },
      },
    ]);

    expect(mockReplyLineTextMessage).toHaveBeenCalledWith(
      'reply-token',
      expect.stringContaining('歡迎使用 RebalanceAlert'),
    );
  });
});
