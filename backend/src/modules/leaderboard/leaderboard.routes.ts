import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../auth/auth.middleware';
import { LeaderboardController } from './leaderboard.controller';

const router = Router();

const leaderboardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, error: { message: 'Leaderboard rate limit exceeded. Try again later.' } }
});

router.get('/', requireAuth, leaderboardLimiter, LeaderboardController.getLeaderboard);

export default router;
