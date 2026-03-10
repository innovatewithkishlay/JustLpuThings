import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { FeedbacksController } from './feedbacks.controller';

const router = Router();

// Public: Get approved feedbacks for landing page
router.get('/public', FeedbacksController.getPublic);

// Authenticated: Submit feedback
router.post('/', requireAuth, FeedbacksController.submit);

export default router;
