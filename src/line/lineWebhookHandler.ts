import { buildLeverageAnalysisMessage } from './buildLeverageAnalysisMessage';
import {
  LINE_HELP_MESSAGE,
  LINE_WELCOME_MESSAGE,
  parseLineCommand,
} from './messageCommands';
import { config } from '../config';
import { replyLineTextMessage } from '../services/lineMessagingService';

export interface LineWebhookEvent {
  type: string;
  replyToken?: string;
  source?: {
    type: string;
    userId?: string;
  };
  message?: {
    type: string;
    text?: string;
  };
}

export interface LineWebhookBody {
  events: LineWebhookEvent[];
}

export function isAllowedLineUser(userId: string | undefined): boolean {
  if (!userId) {
    return false;
  }

  const allowedUserIds = config.line.notifyUserIds;
  if (allowedUserIds.length === 0) {
    return true;
  }

  return allowedUserIds.includes(userId);
}

export async function handleLineWebhookEvents(events: LineWebhookEvent[]): Promise<void> {
  for (const event of events) {
    await handleLineWebhookEvent(event);
  }
}

async function handleLineWebhookEvent(event: LineWebhookEvent): Promise<void> {
  if (!event.replyToken) {
    return;
  }

  const userId = event.source?.userId;
  if (!isAllowedLineUser(userId)) {
    await replyLineTextMessage(event.replyToken, '此帳號未授權使用查詢功能。');
    return;
  }

  if (event.type === 'follow') {
    await replyLineTextMessage(event.replyToken, LINE_WELCOME_MESSAGE);
    return;
  }

  if (event.type !== 'message' || event.message?.type !== 'text' || !event.message.text) {
    return;
  }

  const command = parseLineCommand(event.message.text);

  if (command === 'help') {
    await replyLineTextMessage(event.replyToken, LINE_HELP_MESSAGE);
    return;
  }

  if (command === 'leverage') {
    const message = await buildLeverageAnalysisMessage();
    await replyLineTextMessage(event.replyToken, message);
    return;
  }

  await replyLineTextMessage(
    event.replyToken,
    `無法辨識指令。\n\n${LINE_HELP_MESSAGE}`,
  );
}
