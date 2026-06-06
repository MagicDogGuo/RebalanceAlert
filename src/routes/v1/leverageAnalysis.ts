import { Router } from 'express';
import { analyzeLeverageFromSaved } from '../../controllers/leverageAnalysisController';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = Router();

router.get('/leverage-analysis', asyncHandler(analyzeLeverageFromSaved));

export default router;
