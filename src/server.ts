import 'dotenv/config';
import app from './app';
import { isLineWebhookEnabled, isMongoEnabled } from './config';
import { connectDatabase } from './db/connect';
import { startLineNotificationScheduler } from './line/scheduler';

const PORT = Number(process.env.PORT) || 3000;

async function start(): Promise<void> {
  if (isMongoEnabled()) {
    await connectDatabase();
  } else {
    console.warn('MONGODB_URI 未設定，持股資料將不會持久化');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    startLineNotificationScheduler();

    if (isLineWebhookEnabled()) {
      console.log(`LINE Webhook 已啟用：POST /webhooks/line`);
    } else {
      console.warn('LINE Webhook 未啟用：請設定 LINE_CHANNEL_ACCESS_TOKEN 與 LINE_CHANNEL_SECRET');
    }
  });
}

start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : '未知錯誤';
  console.error('伺服器啟動失敗:', message);
  process.exit(1);
});
