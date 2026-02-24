import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { NotificationsController } from './notifications.controller';

const router = Router();

router.use(requireAuth);

router.get('/', NotificationsController.getForUser);               // Get all notifications
router.get('/unread-count', NotificationsController.getUnreadCount); // Get unread count
router.patch('/read-all', NotificationsController.markAllRead);    // Mark all as read
router.patch('/:id/read', NotificationsController.markRead);       // Mark one as read

export default router;
