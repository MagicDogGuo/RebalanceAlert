import cron from 'node-cron';
import { config, isLineNotifyEnabled } from '../config';
import { sendLeverageAnalysisNotification } from './leverageAnalysisNotifier';

let scheduledTask: cron.ScheduledTask | null = null;

export function startLineNotificationScheduler(): void {
  if (!isLineNotifyEnabled()) {
    console.warn('LINE 推播未啟用：請設定 LINE_CHANNEL_ACCESS_TOKEN 與 LINE_NOTIFY_USER_IDS');
    return;
  }

  if (!cron.validate(config.line.notifyCron)) {
    throw new Error(`LINE_NOTIFY_CRON 格式無效：${config.line.notifyCron}`);
  }

  scheduledTask = cron.schedule(
    config.line.notifyCron,
    () => {
      void sendLeverageAnalysisNotification().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error('LINE 槓桿分析推播失敗:', message);
      });
    },
    {
      timezone: config.line.notifyTimezone,
    },
  );

  console.log(
    `LINE 槓桿分析推播已排程：${config.line.notifyCron}（${config.line.notifyTimezone}）`,
  );
}

export function stopLineNotificationScheduler(): void {
  scheduledTask?.stop();
  scheduledTask = null;
}
