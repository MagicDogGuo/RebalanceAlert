import { Router } from 'express';
import calculateRouter from './calculate';
import healthRouter from './health';
import holdingsRouter from './holdings';
import leverageAnalysisRouter from './leverageAnalysis';

const router = Router();

router.use(healthRouter);
router.use(calculateRouter);
router.use(holdingsRouter);
router.use(leverageAnalysisRouter);

export default router;
