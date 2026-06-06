import type { Request, Response } from 'express';
import { handleLineWebhookEvents, type LineWebhookBody } from '../line/lineWebhookHandler';

export async function handleLineWebhook(req: Request, res: Response): Promise<void> {
  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody)) {
    res.status(400).json({ error: 'Webhook 需要 raw body' });
    return;
  }

  const body = JSON.parse(rawBody.toString('utf8')) as LineWebhookBody;
  const events = body.events ?? [];

  if (events.length > 0) {
    await handleLineWebhookEvents(events);
  }

  res.status(200).send('OK');
}
