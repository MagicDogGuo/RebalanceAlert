import crypto from 'crypto';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../../src/app';

const mockHandleLineWebhookEvents = vi.fn();

vi.mock('../../src/line/lineWebhookHandler', () => ({
  handleLineWebhookEvents: (...args: unknown[]) => mockHandleLineWebhookEvents(...args),
}));

vi.mock('../../src/config', () => ({
  config: {
    line: {
      channelSecret: 'test-channel-secret',
    },
  },
  isMongoEnabled: () => false,
  isLineNotifyEnabled: () => false,
  isLineWebhookEnabled: () => true,
}));

function signBody(body: string): string {
  return crypto.createHmac('sha256', 'test-channel-secret').update(body).digest('base64');
}

describe('POST /webhooks/line', () => {
  beforeEach(() => {
    mockHandleLineWebhookEvents.mockReset();
  });

  it('簽章正確時處理事件並回傳 200', async () => {
    const body = JSON.stringify({
      events: [
        {
          type: 'message',
          replyToken: 'token',
          source: { type: 'user', userId: 'U123' },
          message: { type: 'text', text: '槓桿' },
        },
      ],
    });

    const response = await request(app)
      .post('/webhooks/line')
      .set('x-line-signature', signBody(body))
      .set('Content-Type', 'application/json')
      .send(body);

    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
    expect(mockHandleLineWebhookEvents).toHaveBeenCalledTimes(1);
  });

  it('簽章錯誤時回傳 401', async () => {
    const body = JSON.stringify({ events: [] });

    const response = await request(app)
      .post('/webhooks/line')
      .set('x-line-signature', 'invalid-signature')
      .set('Content-Type', 'application/json')
      .send(body);

    expect(response.status).toBe(401);
    expect(mockHandleLineWebhookEvents).not.toHaveBeenCalled();
  });
});
