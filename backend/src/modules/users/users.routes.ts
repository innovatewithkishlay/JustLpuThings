import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { UsersController } from './users.controller';

const router = Router();

// /api/v1/users/me/analytics
router.get('/me/analytics', requireAuth, UsersController.getMyAnalytics);

export default router;
