import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { loginSchema, registerSchema } from './auth.schema';
import { env } from '../../config/env';
import { setAuthCookies } from './auth.utils';

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

            res.json({
                success: true,
                data: {
                    message: 'Logged in successfully',
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken
                }
            });
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

            res.json({
                success: true,
                data: {
                    message: 'Token refreshed successfully',
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken
                }
            });
        } catch (err) {
            // Clear poisoned cookies
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.clearCookie('refreshFamily');
            next(err);
        }
    }

    static async me(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user?.userId) {
                return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
            }
            const user = await AuthService.getMe(req.user.userId);
            res.json({ success: true, data: user });
        } catch (err) {
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

            const isProd = env.NODE_ENV === 'production';
            const clearOpts = {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'none' as const : 'lax' as const,
                path: '/'
            };

            res.clearCookie('accessToken', clearOpts);
            res.clearCookie('refreshToken', clearOpts);
            res.clearCookie('refreshFamily', clearOpts);

            res.json({ success: true, data: { message: 'Logged out securely' } });
        } catch (err) {
            next(err);
        }
    }
}
