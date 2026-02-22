import { Router } from 'express';
import { SearchController } from './search.controller';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

// /api/v1/search
router.get('/', requireAuth, SearchController.search);

export default router;
