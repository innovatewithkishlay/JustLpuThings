import { Router, Response } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from './auth.middleware';
import passport from './google.strategy';
import { AuthService } from './auth.service';
import { env } from '../../config/env';
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
            const user = req.user as unknown as { id: string; role: string };
            const tokens = await AuthService.generateTokens(user.id, user.role);

            const isProd = env.NODE_ENV === 'production';
            const cookieOpts = {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'none' as const : 'lax' as const,
                path: '/'
            };

            res.cookie('accessToken', tokens.accessToken, { ...cookieOpts, maxAge: Number(ms(env.JWT_ACCESS_EXPIRES as Parameters<typeof ms>[0])) });
            res.cookie('refreshToken', tokens.refreshToken, { ...cookieOpts, maxAge: Number(ms(env.JWT_REFRESH_EXPIRES as Parameters<typeof ms>[0])) });
            res.cookie('refreshFamily', tokens.refreshFamilyId, { ...cookieOpts, maxAge: Number(ms(env.JWT_REFRESH_EXPIRES as Parameters<typeof ms>[0])) });

            // Redirect browser to the Next.js dashboard
            res.redirect(`${env.FRONTEND_URL}/dashboard`);
        } catch {
            res.redirect(`${env.FRONTEND_URL}/?error=oauth_failed`);
        }
    }
);

export default router;
