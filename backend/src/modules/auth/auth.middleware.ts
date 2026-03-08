import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { pool } from '../../config/db';
import { AuthService } from './auth.service';
import { setAuthCookies } from './auth.utils';

export interface TokenPayload {
    userId: string;
    role: 'USER' | 'ADMIN';
    jti: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;

        // If no access token but refresh token exists, attempt silent refresh
        if (!token && refreshToken) {
            try {
                const tokens = await AuthService.refresh(refreshToken);
                setAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.refreshFamilyId);
                token = tokens.accessToken; // Use the new token for this request
            } catch (refreshError) {
                // Refresh failed (expired or revoked), proceed to standard unauthorized handling
            }
        }

        if (!token) {
            return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
        }

        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

        // Check DB level account block
        const dbUser = await pool.query('SELECT is_blocked FROM users WHERE id = $1', [decoded.userId]);
        if (!dbUser.rows.length || dbUser.rows[0].is_blocked) {
            return res.status(403).json({
                success: false,
                error: { message: 'Account suspended. Please contact admin at kkishlay502@gmail.com for restoration.' }
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        // If JWT verify fails (e.g. expired), but we have a refresh token, we technically already tried above
        // but if the token was present but invalid/expired, we still want to clear it and try refresh if potential.
        res.status(401).json({ success: false, error: { message: 'Invalid or expired token' } });
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: { message: 'Forbidden: Admin access required' } });
    }
    next();
};
