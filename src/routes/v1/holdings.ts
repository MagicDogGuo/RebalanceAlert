import { Router } from 'express';
import { getHoldings, putHoldings } from '../../controllers/holdingsController';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = Router();

router.get('/holdings', asyncHandler(getHoldings));
router.put('/holdings', asyncHandler(putHoldings));

export default router;
