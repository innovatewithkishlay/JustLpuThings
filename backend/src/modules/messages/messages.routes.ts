import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { MessagesController } from './messages.controller';

const router = Router();

router.use(requireAuth);

router.post('/', MessagesController.create);       // User sends a request
router.get('/mine', MessagesController.getMine);   // User sees their messages

export default router;
