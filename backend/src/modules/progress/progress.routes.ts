import { Router } from 'express';
import { ProgressController } from './progress.controller';
import { requireAuth } from '../auth/auth.middleware';

const router = Router({ mergeParams: true });

router.post('/progress', requireAuth, ProgressController.update);

export default router;
