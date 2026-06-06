import { buildLeverageAnalysisMessage } from './buildLeverageAnalysisMessage';
import { pushLineTextMessageToUsers } from '../services/lineMessagingService';
import { config } from '../config';

export async function sendLeverageAnalysisNotification(): Promise<void> {
  const userIds = config.line.notifyUserIds;
  if (userIds.length === 0) {
    throw new Error('LINE_NOTIFY_USER_IDS 未設定');
  }

  const message = await buildLeverageAnalysisMessage();
  await pushLineTextMessageToUsers(userIds, message);
}
