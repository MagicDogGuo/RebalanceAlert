import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from '../config';

export function verifyLineSignature(req: Request, res: Response, next: NextFunction): void {
  const secret = config.line.channelSecret;
  if (!secret) {
    res.status(500).json({ error: 'LINE_CHANNEL_SECRET 未設定' });
    return;
  }

  const signature = req.header('x-line-signature');
  if (!signature) {
    res.status(401).json({ error: '缺少 x-line-signature' });
    return;
  }

  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody)) {
    res.status(400).json({ error: 'Webhook 需要 raw body' });
    return;
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  if (signature !== expectedSignature) {
    res.status(401).json({ error: 'LINE 簽章驗證失敗' });
    return;
  }

  next();
}
