import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { pool } from '../../config/db';

export interface TokenPayload {
    userId: string;
    role: 'USER' | 'ADMIN';
    jti: string;
}

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Read from HttpOnly cookie
        const token = req.cookies?.accessToken;

        if (!token) {
            return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
        }

        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

        // Check if token was explicitly revoked (e.g. during logout)
        const isRevoked = await redis.get(`blocklist:${decoded.jti}`);
        if (isRevoked) {
            return res.status(401).json({ success: false, error: { message: 'Token revoked. Please log in again.' } });
        }

        // Check DB level account block
        const dbUser = await pool.query('SELECT is_blocked FROM users WHERE id = $1', [decoded.userId]);
        if (!dbUser.rows.length || dbUser.rows[0].is_blocked) {
            return res.status(403).json({ success: false, error: { message: 'Account blocked' } });
        }

        req.user = decoded;
        next();
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
