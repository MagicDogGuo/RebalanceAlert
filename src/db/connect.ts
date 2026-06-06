import mongoose from 'mongoose';
import { config } from '../config';

export async function connectDatabase(): Promise<void> {
  if (!config.mongodb.uri) {
    throw new Error('MONGODB_URI 未設定');
  }

  await mongoose.connect(config.mongodb.uri, {
    dbName: config.mongodb.dbName,
  });

  console.log(`MongoDB 已連線（資料庫：${config.mongodb.dbName}）`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
