import { Response } from 'express';
import { env } from '../../config/env';
import ms from 'ms';

/**
 * Standard utility to set unified HTTP-only auth cookies.
 * This ensures consistency between AuthController and AuthMiddleware (silent refresh).
 */
export const setAuthCookies = (res: Response, access: string, refresh: string, refreshId: string) => {
    const isProd = env.NODE_ENV === 'production';
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' as const : 'lax' as const,
        path: '/'
    };

    // Convert env strings to ms for MaxAge
    const accessMaxAge = Number(ms(env.JWT_ACCESS_EXPIRES as any));
    const refreshMaxAge = Number(ms(env.JWT_REFRESH_EXPIRES as any));

    res.cookie('accessToken', access, { ...cookieOptions, maxAge: accessMaxAge });
    res.cookie('refreshToken', refresh, { ...cookieOptions, maxAge: refreshMaxAge });
    res.cookie('refreshFamily', refreshId, { ...cookieOptions, maxAge: refreshMaxAge });
};
