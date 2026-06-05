import { Router } from 'express';
import calculateRouter from './calculate';
import healthRouter from './health';

const router = Router();

router.use(healthRouter);
router.use(calculateRouter);

export default router;
