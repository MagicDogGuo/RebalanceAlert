import type { PortfolioPrices } from '../types/portfolio';

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readUserIds(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

export const config = {
  finmindApiUrl: process.env.FINMIND_API_URL ?? 'https://api.finmindtrade.com/api/v4/data',
  finmindToken: process.env.FINMIND_TOKEN,
  requestTimeoutMs: 5000,
  lookbackDays: 7,
  fallbackPrices: {
    '0050': readNumber(process.env.FALLBACK_PRICE_0050, 160.0),
    '00631L': readNumber(process.env.FALLBACK_PRICE_00631L, 210.0),
  } satisfies PortfolioPrices,
  mongodb: {
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DB_NAME ?? 'rebalancealert',
    profileId: process.env.MONGODB_PROFILE_ID ?? 'default',
  },
  line: {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    notifyUserIds: readUserIds(process.env.LINE_NOTIFY_USER_IDS),
    notifyCron: process.env.LINE_NOTIFY_CRON ?? '0 9 * * *',
    notifyTimezone: process.env.LINE_NOTIFY_TIMEZONE ?? 'Asia/Taipei',
  },
};

export function isMongoEnabled(): boolean {
  return Boolean(config.mongodb.uri);
}

export function isLineNotifyEnabled(): boolean {
  return Boolean(config.line.channelAccessToken) && config.line.notifyUserIds.length > 0;
}

export function isLineWebhookEnabled(): boolean {
  return Boolean(config.line.channelAccessToken) && Boolean(config.line.channelSecret);
}
