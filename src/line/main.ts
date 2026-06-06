import 'dotenv/config';
import { isLineNotifyEnabled, isMongoEnabled } from '../config';
import { connectDatabase } from '../db/connect';
import { sendLeverageAnalysisNotification } from './leverageAnalysisNotifier';

async function run(): Promise<void> {
  if (!isLineNotifyEnabled()) {
    throw new Error('請設定 LINE_CHANNEL_ACCESS_TOKEN 與 LINE_NOTIFY_USER_IDS');
  }

  if (isMongoEnabled()) {
    await connectDatabase();
  }

  await sendLeverageAnalysisNotification();
  console.log('LINE 槓桿分析推播已送出');
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`LINE 推播失敗：${message}`);
  process.exitCode = 1;
});
