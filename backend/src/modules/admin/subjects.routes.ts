import { Router } from 'express';
import { AdminSubjectsController } from './subjects.controller';

const router = Router();

router.get('/', AdminSubjectsController.list);
router.post('/', AdminSubjectsController.create);
router.delete('/:id', AdminSubjectsController.delete);

// Semester Management
router.get('/semesters', AdminSubjectsController.listSemesters);
router.patch('/semesters/:number/status', AdminSubjectsController.toggleStatus);

export default router;
