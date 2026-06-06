import { Router } from 'express';
import calculateRouter from './calculate';
import healthRouter from './health';
import holdingsRouter from './holdings';

const router = Router();

router.use(healthRouter);
router.use(calculateRouter);
router.use(holdingsRouter);

export default router;
