import { pool } from '../../config/db';
import { redis } from '../../config/redis';

export class AdminUsersService {

    static async blockUser(adminId: string, userId: string, componentReason: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Prevent blocking admins
            const tgtUser = await client.query('SELECT role FROM users WHERE id = $1', [userId]);
            if (!tgtUser.rows.length) throw { statusCode: 404, message: 'User not found' };
            if (tgtUser.rows[0].role === 'ADMIN') throw { statusCode: 403, message: 'Cannot block another Admin' };

            // 1. Block user in main users table
            await client.query(
                'UPDATE users SET is_blocked = true, blocked_reason = $1, blocked_at = now() WHERE id = $2',
                [componentReason, userId]
            );

            // 2. Revoke all refresh tokens
            await client.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [userId]);

            // Log
            await client.query(
                `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, metadata)
                 VALUES ($1, $2, $3, $4, $5)`,
                [adminId, 'BLOCK_USER', 'user', userId, JSON.stringify({ reason: componentReason })]
            );

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async unblockUser(adminId: string, userId: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                'UPDATE users SET is_blocked = false, blocked_reason = NULL, blocked_at = NULL WHERE id = $1',
                [userId]
            );

            await client.query(
                `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
                 VALUES ($1, $2, $3, $4)`,
                [adminId, 'UNBLOCK_USER', 'user', userId]
            );

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async deleteUser(adminId: string, userId: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const tgtUser = await client.query('SELECT role FROM users WHERE id = $1', [userId]);
            if (!tgtUser.rows.length) throw { statusCode: 404, message: 'User not found' };
            if (tgtUser.rows[0].role === 'ADMIN') throw { statusCode: 403, message: 'Cannot delete another Admin' };

            await client.query('DELETE FROM users WHERE id = $1', [userId]);
            // Cascades implicitly destroy refresh_tokens, views, and progress.

            await client.query(
                `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
                 VALUES ($1, $2, $3, $4)`,
                [adminId, 'DELETE_USER', 'user', userId]
            );

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
