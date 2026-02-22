import { Router } from 'express';
import { DiscoveryController } from './discovery.controller';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

// /api/v1/... mounted here manually via prefixes to avoid namespace overlap with /materials
router.get('/materials/trending', requireAuth, DiscoveryController.trending);
router.get('/materials/:slug/engagement', requireAuth, DiscoveryController.engagement);

router.get('/users/me/continue', requireAuth, DiscoveryController.continueReading);
router.get('/users/me/recommendations', requireAuth, DiscoveryController.recommendations);

export default router;
