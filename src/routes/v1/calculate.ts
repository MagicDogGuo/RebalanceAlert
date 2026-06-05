import { Router } from 'express';
import { calculateLeverage } from '../../controllers/calculateController';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = Router();

router.post('/calculate-leverage', asyncHandler(calculateLeverage));

export default router;
