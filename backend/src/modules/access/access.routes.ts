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

router.get('/:slug/access', requireAuth, accessLimiter, userAccessLimiter, async (req: Request, res: Response, next: NextFunction) => {
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

// Forever Fix: PDF Proxy Endpoint
router.get('/:slug/view', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const slug = req.params.slug as string;
        const userId = req.user!.userId;
        const ip = req.ip || req.socket.remoteAddress;
        const userAgent = (req.headers['user-agent'] as string) || '';

        const stream = await AccessService.getMaterialStream(slug, userId, ip, userAgent);

        // Security headers for PDF viewing
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

        // Pipe the R2 Readable stream to Express Response
        stream.pipe(res);
    } catch (err) {
        next(err);
    }
});

export default router;
