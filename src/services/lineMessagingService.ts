import axios from 'axios';
import { config } from '../config';

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';

export async function pushLineTextMessage(userId: string, text: string): Promise<void> {
  const token = config.line.channelAccessToken;
  if (!token) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN 未設定');
  }

  await axios.post(
    LINE_PUSH_URL,
    {
      to: userId,
      messages: [{ type: 'text', text }],
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: config.requestTimeoutMs,
    },
  );
}

export async function pushLineTextMessageToUsers(userIds: string[], text: string): Promise<void> {
  for (const userId of userIds) {
    await pushLineTextMessage(userId, text);
  }
}

export async function replyLineTextMessage(replyToken: string, text: string): Promise<void> {
  const token = config.line.channelAccessToken;
  if (!token) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN 未設定');
  }

  await axios.post(
    LINE_REPLY_URL,
    {
      replyToken,
      messages: [{ type: 'text', text }],
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: config.requestTimeoutMs,
    },
  );
}
