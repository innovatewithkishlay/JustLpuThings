import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { MessagesController } from './messages.controller';

const router = Router();

router.use(requireAuth);

router.post('/', MessagesController.create);       // User sends a request
router.get('/mine', MessagesController.getMine);         // User sees their messages
router.post('/mark-read', MessagesController.markRead);  // User marks replies as seen
router.post('/messages/:id/reply', MessagesController.reply);
router.patch('/messages/:id/reply', MessagesController.updateReply);
router.delete('/messages/:id/reply', MessagesController.deleteReply);

export default router;
