import { Request, Response, NextFunction } from 'express';
import { FeedbacksService } from './feedbacks.service';

export class FeedbacksController {
    // POST /feedbacks — user submits feedback
    static async submit(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId;
            const { content, rating } = req.body;

            if (!content?.trim()) {
                return res.status(400).json({ success: false, error: { message: 'Feedback content is required.' } });
            }

            const r = parseInt(rating);
            if (isNaN(r) || r < 1 || r > 5) {
                return res.status(400).json({ success: false, error: { message: 'Rating must be between 1 and 5.' } });
            }

            const feedback = await FeedbacksService.submitFeedback(userId, content.trim(), r);
            res.status(201).json({ success: true, data: feedback });
        } catch (err) { next(err); }
    }

    // GET /feedbacks/public — landing page
    static async getPublic(req: Request, res: Response, next: NextFunction) {
        try {
            const feedbacks = await FeedbacksService.getPublicFeedbacks();
            res.json({ success: true, data: feedbacks });
        } catch (err) { next(err); }
    }

    // GET /admin/feedbacks — moderation
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const status = req.query.status as string | undefined;
            const feedbacks = await FeedbacksService.getAllFeedbacks(status);
            res.json({ success: true, data: feedbacks });
        } catch (err) { next(err); }
    }

    // PATCH /admin/feedbacks/:id — moderation status
    static async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const { status } = req.body;

            if (!['approved', 'rejected', 'pending'].includes(status)) {
                return res.status(400).json({ success: false, error: { message: 'Invalid status.' } });
            }

            await FeedbacksService.updateStatus(id, status);
            res.json({ success: true });
        } catch (err) { next(err); }
    }

    // DELETE /admin/feedbacks/:id
    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            await FeedbacksService.deleteFeedback(id);
            res.json({ success: true });
        } catch (err) { next(err); }
    }
}
