import { Router } from 'express';
import { MaterialsController } from './materials.controller';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

// Routes strictly require authentication 
router.get('/', requireAuth, MaterialsController.list);
router.get('/subjects', requireAuth, MaterialsController.listSubjects);
router.get('/:slug', requireAuth, MaterialsController.getBySlug);

export default router;
