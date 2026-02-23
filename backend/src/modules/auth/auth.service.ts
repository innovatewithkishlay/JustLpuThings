import { pool } from '../../config/db';
import { env } from '../../config/env';
// import { redis } from '../../config/redis';
import bcrypt from 'bcrypt';
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

        return result.rows[0];
    }

    static async login(data: LoginInput) {
        const { email, password } = data;

        const userResult = await pool.query('SELECT id, password_hash, role FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            throw { statusCode: 401, message: 'Invalid credentials' };
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

            if (!dbToken) {
                throw new Error('Token not found in registry');
            }

            // If token is found but explicitly revoked, we deal with attempted token reuse
            if (dbToken.revoked) {
                // Suspected theft: Revoke ALL tokens for this user
                await pool.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [userId]);
                throw new Error('Compromised token detected. All sessions revoked.');
            }

            // Verify the cryptographics
            const isValid = await bcrypt.compare(refreshTokenRaw, dbToken.token_hash);
            if (!isValid) {
                throw new Error('Hash mismatch');
            }

            // ROTATION: Revoke the old token
            await pool.query('UPDATE refresh_tokens SET revoked = true WHERE id = $1', [familyId]);

            // Re-fetch user role dynamically
            const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
            const role = userResult.rows[0]?.role || 'USER';

            // Generate pristine pair
            return await this.generateTokens(userId, role);

        } catch (err: any) {
            throw { statusCode: 401, message: 'Invalid or expired refresh token' };
        }
    }

    // --- INTERNAL HELPER ---

    private static async generateTokens(userId: string, role: string) {
        const accessJti = uuidv4();
        const refreshFamilyId = uuidv4(); // Maps to the postgres ID primary key

        // Sign Access Token
        const accessToken = jwt.sign(
            { userId, role, jti: accessJti },
            env.JWT_ACCESS_SECRET,
            { expiresIn: env.JWT_ACCESS_EXPIRES as `${number}s` | `${number}m` | `${number}h` | `${number}d` }
        );

        // Sign Refresh Token (we use familyId as payload to rotate statefully)
        const refreshTokenRaw = jwt.sign(
            { sub: userId, familyId: refreshFamilyId },
            env.JWT_REFRESH_SECRET,
            { expiresIn: env.JWT_REFRESH_EXPIRES as `${number}s` | `${number}m` | `${number}h` | `${number}d` }
        );

        // Hash refresh token for DB
        const refreshHash = await bcrypt.hash(refreshTokenRaw, 10);

        // Calculate exact PG Datetime bounds based on env string dynamically
        const expiresAt = new Date(Date.now() + parseExpirationToMs(env.JWT_REFRESH_EXPIRES));

        await pool.query(
            `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)`,
            [refreshFamilyId, userId, refreshHash, expiresAt]
        );

        return {
            accessToken,
            refreshToken: refreshTokenRaw,
            refreshFamilyId
        };
    }
}
