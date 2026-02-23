import { Request, Response, NextFunction } from 'express';
import { UserAnalyticsService } from './users.analytics.service';

export class UsersController {
    static async getMyAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.userId;
            const data = await UserAnalyticsService.getMyAnalytics(userId);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }
}
