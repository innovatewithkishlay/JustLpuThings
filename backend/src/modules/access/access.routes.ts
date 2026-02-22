import { Router, Request, Response, NextFunction } from 'express';
import { AccessService } from './access.service';
import { requireAuth } from '../auth/auth.middleware';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';
import { userAccessLimiter } from './access.limiter';

const router = Router({ mergeParams: true }); // Receives :slug from parent

const accessLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.RATE_LIMIT_ACCESS,
    message: { success: false, error: { message: 'Signed URL rate limit exceeded' } }
});

router.get('/access', requireAuth, accessLimiter, userAccessLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const slug = req.params.slug as string;
        const userId = req.user!.userId;

        // In Express proxy setups, req.ip needs 'trust proxy' configured in app.ts for validity
        const ip = req.ip || req.socket.remoteAddress;
        const userAgent = (req.headers['user-agent'] as string) || '';

        const result = await AccessService.requestAccess(slug, userId, ip, userAgent);

        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
});

export default router;
