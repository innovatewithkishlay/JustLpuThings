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

        // Helper to attempt refreshing tokens
        const tryRefresh = async () => {
            if (!refreshToken) return null;
            try {
                const refreshed = await AuthService.refresh(refreshToken);
                setAuthCookies(res, refreshed.accessToken, refreshed.refreshToken, refreshed.refreshFamilyId);
                return refreshed.accessToken;
            } catch {
                return null;
            }
        };

        // Case 1: Token is entirely missing - try refresh immediately
        if (!token && refreshToken) {
            token = await tryRefresh();
        }

        if (!token) {
            return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
        }

        // Case 2: Token is present - verify it
        try {
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
            return next();
        } catch (jwtError) {
            // Token was present but invalid/expired - try one last refresh
            const refreshedToken = await tryRefresh();
            if (refreshedToken) {
                const decoded = jwt.verify(refreshedToken, env.JWT_ACCESS_SECRET) as TokenPayload;
                req.user = decoded;
                return next();
            }
            throw jwtError; // If refresh also fails, fall through to 401
        }
    } catch (error) {
        res.status(401).json({ success: false, error: { message: 'Invalid or expired token' } });
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: { message: 'Forbidden: Admin access required' } });
    }
    next();
};
