import { Router } from 'express';
import { AdminSubjectsController } from './subjects.controller';

const router = Router();

router.get('/', AdminSubjectsController.list);
router.post('/', AdminSubjectsController.create);
router.delete('/:id', AdminSubjectsController.delete);

export default router;
