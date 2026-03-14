import { Request, Response, NextFunction } from 'express';
import { LeaderboardService } from './leaderboard.service';

export class LeaderboardController {
    static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.userId;
            const data = await LeaderboardService.getLeaderboard(userId);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }
}
