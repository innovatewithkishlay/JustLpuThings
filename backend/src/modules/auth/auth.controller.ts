import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { loginSchema, registerSchema } from './auth.schema';
import { env } from '../../config/env';
import ms from 'ms';

// Utility for applying unified cookie config
const setAuthCookies = (res: Response, access: string, refresh: string, refreshId: string) => {
    const isProd = env.NODE_ENV === 'production';
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict' as const,
        path: '/'
    };

    // Convert env strings to ms for MaxAge
    const accessMaxAge = Number(ms(env.JWT_ACCESS_EXPIRES as any));
    const refreshMaxAge = Number(ms(env.JWT_REFRESH_EXPIRES as any));

    res.cookie('accessToken', access, { ...cookieOptions, maxAge: accessMaxAge });
    res.cookie('refreshToken', refresh, { ...cookieOptions, maxAge: refreshMaxAge });
    // Store familyId to easily identify DB record
    res.cookie('refreshFamily', refreshId, { ...cookieOptions, maxAge: refreshMaxAge });
};

export class AuthController {

    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const data = registerSchema.parse(req.body);
            const user = await AuthService.register(data);
            res.status(201).json({ success: true, data: { user } });
        } catch (err) {
            next(err);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const data = loginSchema.parse(req.body);
            const tokens = await AuthService.login(data);

            setAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.refreshFamilyId);

            res.json({ success: true, data: { message: 'Logged in successfully' } });
        } catch (err) {
            next(err);
        }
    }

    static async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const rawRefresh = req.cookies?.refreshToken;
            if (!rawRefresh) {
                return res.status(401).json({ success: false, error: { message: 'No refresh token provided' } });
            }

            const tokens = await AuthService.refresh(rawRefresh);
            setAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.refreshFamilyId);

            res.json({ success: true, data: { message: 'Token refreshed successfully' } });
        } catch (err) {
            // Clear poisoned cookies
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.clearCookie('refreshFamily');
            next(err);
        }
    }

    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const accessRaw = req.cookies?.accessToken;
            const refreshFamily = req.cookies?.refreshFamily;

            if (accessRaw) {
                await AuthService.logout(accessRaw, refreshFamily);
            }

            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.clearCookie('refreshFamily');

            res.json({ success: true, data: { message: 'Logged out securely' } });
        } catch (err) {
            next(err);
        }
    }
}
