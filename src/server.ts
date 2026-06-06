import 'dotenv/config';
import app from './app';
import { isMongoEnabled } from './config';
import { connectDatabase } from './db/connect';

const PORT = Number(process.env.PORT) || 3000;

async function start(): Promise<void> {
  if (isMongoEnabled()) {
    await connectDatabase();
  } else {
    console.warn('MONGODB_URI 未設定，持股資料將不會持久化');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : '未知錯誤';
  console.error('伺服器啟動失敗:', message);
  process.exit(1);
});
