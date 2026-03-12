import { Router, Response } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from './auth.middleware';
import passport from './google.strategy';
import { AuthService } from './auth.service';
import { env } from '../../config/env';
import { setAuthCookies } from './auth.utils';
import ms from 'ms';

const router = Router();

// ── Standard email/password auth ──────────────────────────────
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.get('/me', requireAuth, AuthController.me);
router.post('/logout', requireAuth, AuthController.logout);

// ── Google OAuth ──────────────────────────────────────────────
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/callback/google',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${env.FRONTEND_URL}/?error=oauth_failed`
    }),
    async (req, res: Response) => {
        try {
            // passport sets req.user to the object returned by done() in google.strategy
            const user = req.user as unknown as { id: string; role: 'USER' | 'ADMIN' };
            const tokens = await AuthService.generateTokens(user.id, user.role);

            // Use the standard utility to set cookies consistently
            setAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.refreshFamilyId);

            // Redirect browser to the Next.js dashboard with tokens in URL for fallback pickup
            // This ensures login works even if the browser blocks the Set-Cookie header initially
            res.redirect(`${env.FRONTEND_URL}/dashboard?at=${tokens.accessToken}&rt=${tokens.refreshToken}`);
        } catch (error) {
            console.error('[AUTH:OAUTH] Callback error:', error);
            res.redirect(`${env.FRONTEND_URL}/?error=oauth_failed`);
        }
    }
);

export default router;
