import { Request, Response, NextFunction } from 'express';
import { MessagesService } from './messages.service';

export class MessagesController {
    // POST /messages — user sends a request
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { content } = req.body;
            if (!content?.trim()) {
                return res.status(400).json({ success: false, error: { message: 'Message content is required.' } });
            }
            const message = await MessagesService.createMessage(userId, content.trim());
            res.status(201).json({ success: true, data: message });
        } catch (err) { next(err); }
    }

    // GET /messages/mine — user sees their own messages
    static async getMine(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const messages = await MessagesService.getUserMessages(userId);
            res.json({ success: true, data: messages });
        } catch (err) { next(err); }
    }

    // GET /admin/messages — admin sees all messages
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const status = req.query.status as string | undefined;
            const messages = await MessagesService.getAllMessages(status);
            res.json({ success: true, data: messages });
        } catch (err) { next(err); }
    }

    // POST /admin/messages/:id/reply — admin replies
    static async reply(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const { reply } = req.body;
            if (!reply?.trim()) {
                return res.status(400).json({ success: false, error: { message: 'Reply content is required.' } });
            }
            await MessagesService.replyToMessage(id, reply.trim());
            res.json({ success: true });
        } catch (err) { next(err); }
    }
}
