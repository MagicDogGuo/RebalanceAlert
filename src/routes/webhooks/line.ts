import { Router } from 'express';
import { handleLineWebhook } from '../../controllers/lineWebhookController';
import { asyncHandler } from '../../middleware/asyncHandler';
import { verifyLineSignature } from '../../middleware/verifyLineSignature';

const router = Router();

router.post('/', verifyLineSignature, asyncHandler(handleLineWebhook));

export default router;
