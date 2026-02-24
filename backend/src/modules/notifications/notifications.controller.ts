import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';

export class NotificationsController {
    // GET /notifications — user gets their notifications
    static async getForUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId;
            const notifications = await NotificationsService.getForUser(userId);
            res.json({ success: true, data: notifications });
        } catch (err) { next(err); }
    }

    // GET /notifications/unread-count
    static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId;
            const count = await NotificationsService.getUnreadCount(userId);
            res.json({ success: true, data: { count } });
        } catch (err) { next(err); }
    }

    // PATCH /notifications/:id/read
    static async markRead(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId;
            await NotificationsService.markRead(req.params.id as string, userId);
            res.json({ success: true });
        } catch (err) { next(err); }
    }

    // PATCH /notifications/read-all
    static async markAllRead(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId;
            await NotificationsService.markAllRead(userId);
            res.json({ success: true });
        } catch (err) { next(err); }
    }

    // POST /admin/notifications — admin sends a notification
    static async send(req: Request, res: Response, next: NextFunction) {
        try {
            const { title, body, type = 'announcement', user_id } = req.body;
            if (!title?.trim() || !body?.trim()) {
                return res.status(400).json({ success: false, error: { message: 'Title and body are required.' } });
            }
            const notification = await NotificationsService.send(title.trim(), body.trim(), type, user_id);
            res.status(201).json({ success: true, data: notification });
        } catch (err) { next(err); }
    }

    // GET /admin/notifications — admin sees all sent notifications
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const notifications = await NotificationsService.getAll();
            res.json({ success: true, data: notifications });
        } catch (err) { next(err); }
    }
}
