import { pool } from '../../config/db';
import { env } from '../../config/env';
// import { redis } from '../../config/redis';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { RegisterInput, LoginInput } from './auth.schema';

// Helper to manually parse JWT expiration strings to milliseconds natively
function parseExpirationToMs(val: string): number {
    const match = val.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // 7 days fallback
    const amount = parseInt(match[1]);
    switch (match[2]) {
        case 's': return amount * 1000;
        case 'm': return amount * 60 * 1000;
        case 'h': return amount * 60 * 60 * 1000;
        case 'd': return amount * 24 * 60 * 60 * 1000;
        default: return amount * 1000;
    }
}

export class AuthService {

    static async register(data: RegisterInput) {
        const { name, email, password } = data;

        // Check existing
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rowCount && existing.rowCount > 0) {
            throw { statusCode: 400, message: 'Email already in use' };
        }

        const hash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'USER') RETURNING id, name, email, role`,
            [name, email, hash]
        );

        // Track new user in analytics (fire and forget)
        const { AnalyticsSubscriber } = require('../analytics/analytics.subscriber');
        AnalyticsSubscriber.incrementNewUserCount().catch((err: any) => console.error('[AUTH:ANALYTICS:ERR]', err));

        return result.rows[0];
    }

    static async login(data: LoginInput) {
        const { email, password } = data;

        const userResult = await pool.query('SELECT id, password_hash, role, is_blocked FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user) {
            throw { statusCode: 401, message: 'Invalid credentials' };
        }

        if (!user.password_hash) {
            throw {
                statusCode: 400,
                message: 'This account was created using Google. Please use the "Continue with Google" button to sign in.'
            };
        }

        if (!(await bcrypt.compare(password, user.password_hash))) {
            throw { statusCode: 401, message: 'Invalid credentials' };
        }

        if (user.is_blocked) {
            throw {
                statusCode: 403,
                message: 'Account suspended. Please contact admin at kkishlay502@gmail.com for restoration.'
            };
        }

        // Strict role enforcement matching GUI intention
        if (data.role && user.role !== data.role) {
            throw { statusCode: 403, message: `Access denied: Expected ${data.role} account but found ${user.role} role.` };
        }

        return await this.generateTokens(user.id, user.role);
    }

    static async getMe(userId: string) {
        const userResult = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        if (!user) {
            throw { statusCode: 404, message: 'User not found' };
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            role: user.role
        };
    }

    static async logout(accessTokenRaw: string, refreshTokenId: string) {
        // Decode the access token safely
        const decoded = jwt.decode(accessTokenRaw) as { jti: string; exp: number } | null;
        if (decoded && decoded.jti && decoded.exp) {
            const currentUnixTime = Math.floor(Date.now() / 1000);
            const remaining = decoded.exp - currentUnixTime;

            if (remaining > 0) {
                // await redis.set(`blocklist:${decoded.jti}`, 'revoked', { ex: remaining });
            }
        }

        // 2. Revoke the specific refresh token from Postgres
        if (refreshTokenId) {
            await pool.query('UPDATE refresh_tokens SET revoked = true WHERE id = $1', [refreshTokenId]);
        }

        return true;
    }

    static async refresh(refreshTokenRaw: string) {
        try {
            // Decode purely to get payload
            const decoded = jwt.verify(refreshTokenRaw, env.JWT_REFRESH_SECRET) as { sub: string, familyId: string };

            const { sub: userId, familyId } = decoded;

            // Find token record
            const dbTokenResult = await pool.query(
                'SELECT id, token_hash, revoked FROM refresh_tokens WHERE id = $1 AND user_id = $2 AND expires_at > NOW()',
                [familyId, userId]
            );

            const dbToken = dbTokenResult.rows[0];

            // Case 1: Token is found and active
            if (dbToken && !dbToken.revoked) {
                // Verify the cryptographics
                const isValid = await bcrypt.compare(refreshTokenRaw, dbToken.token_hash);
                if (!isValid) throw new Error('Hash mismatch');

                // Re-fetch user role and block status dynamically
                const userResult = await pool.query('SELECT role, is_blocked FROM users WHERE id = $1', [userId]);
                const user = userResult.rows[0];
                const role = user?.role || 'USER';

                if (user?.is_blocked) {
                    throw new Error('Account suspended');
                }

                // Issue new tokens but we keep the same "session" (sliding expiry)
                return await this.generateTokens(userId, role, familyId);
            }

            // Case 2: Token is revoked - check for Grace Period (30s)
            // This handles the "two tabs refreshing at once" race condition.
            if (dbToken && dbToken.revoked) {
                // We check if it was revoked extremely recently (simulated grace period via DB column if available, 
                // or just allow 1 retry if the user is authenticated).
                // Actually, for maximum stability with our current schema:
                // If reuse is detected, we only revoke everything if it's been a while.
                // For now, let's just make rotation optional or stable.
                throw new Error('Token revoked');
            }

            throw new Error('Token not found or expired');

        } catch (err: any) {
            throw { statusCode: 401, message: 'Invalid or expired refresh token' };
        }
    }

    // --- INTERNAL HELPER ---

    public static async generateTokens(userId: string, role: string, existingFamilyId?: string) {
        const accessJti = uuidv4();
        const refreshFamilyId = existingFamilyId || uuidv4(); // Re-use ID for sliding sessions (prevents rotation races)

        // Sign Access Token
        const accessToken = jwt.sign(
            { userId, role, jti: accessJti },
            env.JWT_ACCESS_SECRET,
            { expiresIn: env.JWT_ACCESS_EXPIRES as `${number}s` | `${number}m` | `${number}h` | `${number}d` }
        );

        // Sign Refresh Token
        const refreshTokenRaw = jwt.sign(
            { sub: userId, familyId: refreshFamilyId },
            env.JWT_REFRESH_SECRET,
            { expiresIn: env.JWT_REFRESH_EXPIRES as `${number}s` | `${number}m` | `${number}h` | `${number}d` }
        );

        // Hash refresh token for DB
        const refreshHash = await bcrypt.hash(refreshTokenRaw, 10);

        // Calculate exact PG Datetime bounds
        const expiresAt = new Date(Date.now() + parseExpirationToMs(env.JWT_REFRESH_EXPIRES));

        if (existingFamilyId) {
            // SLIDING: Update existing record instead of revoking/creating new
            await pool.query(
                `UPDATE refresh_tokens SET token_hash = $1, expires_at = $2, revoked = false WHERE id = $3`,
                [refreshHash, expiresAt, existingFamilyId]
            );
        } else {
            await pool.query(
                `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)`,
                [refreshFamilyId, userId, refreshHash, expiresAt]
            );
        }

        return {
            accessToken,
            refreshToken: refreshTokenRaw,
            refreshFamilyId
        };
    }
}
