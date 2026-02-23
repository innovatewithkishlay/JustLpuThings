import { pool } from '../../config/db';
// import { redis } from '../../config/redis';

export class AdminUsersService {

    static async getUsersAnalytics(searchTerm?: string) {
        let query = `
            SELECT 
                u.id, 
                u.email, 
                u.name,
                u.role, 
                u.is_blocked,
                u.created_at,
                COUNT(DISTINCT mp.material_id) as total_materials_opened,
                COALESCE(SUM(mp.time_spent), 0) as total_time_spent,
                COALESCE(AVG(CAST(mp.last_page AS FLOAT) / NULLIF(mp.total_pages, 0)) * 100, 0) as completion_rate,
                MAX(mp.updated_at) as last_active
            FROM users u
            LEFT JOIN material_progress mp ON u.id = mp.user_id
        `;

        const values: any[] = [];
        if (searchTerm) {
            query += ` WHERE u.email ILIKE $1 OR u.name ILIKE $1`;
            values.push(`%${searchTerm}%`);
        }

        query += ` GROUP BY u.id ORDER BY last_active DESC NULLS LAST, u.created_at DESC LIMIT 100`;

        const result = await pool.query(query, values);
        return result.rows;
    }

    static async getUserDetailAnalytics(userId: string) {
        // 1. Basic Info & Summary
        const summaryQuery = `
            SELECT 
                u.id, u.email, u.name, u.role, u.is_blocked, u.created_at,
                COUNT(DISTINCT mp.material_id) as total_materials_opened,
                COALESCE(SUM(mp.time_spent), 0) as total_time_spent,
                COALESCE(AVG(CAST(mp.last_page AS FLOAT) / NULLIF(mp.total_pages, 0)) * 100, 0) as global_completion_rate,
                MAX(mp.updated_at) as last_active
            FROM users u
            LEFT JOIN material_progress mp ON u.id = mp.user_id
            WHERE u.id = $1
            GROUP BY u.id
        `;

        // 2. Per Material Breakdown
        const materialsQuery = `
            SELECT 
                m.id, m.title, m.slug,
                s.name as subject_name,
                sem.number as semester_number,
                mp.last_page,
                mp.total_pages,
                COALESCE((CAST(mp.last_page AS FLOAT) / NULLIF(mp.total_pages, 0)) * 100, 0) as completion_percentage,
                mp.time_spent as total_time_spent,
                mp.updated_at as last_opened
            FROM material_progress mp
            JOIN materials m ON mp.material_id = m.id
            JOIN subjects s ON m.subject_id = s.id
            JOIN semesters sem ON s.semester_id = sem.id
            WHERE mp.user_id = $1
            ORDER BY mp.updated_at DESC
        `;

        const [summaryResult, materialsResult] = await Promise.all([
            pool.query(summaryQuery, [userId]),
            pool.query(materialsQuery, [userId])
        ]);

        if (!summaryResult.rows.length) {
            throw { statusCode: 404, message: 'User not found' };
        }

        const summary = summaryResult.rows[0];

        // Compute average time per material
        const avg_time_per_material = summary.total_materials_opened > 0
            ? Math.floor(summary.total_time_spent / summary.total_materials_opened)
            : 0;

        return {
            profile: {
                id: summary.id,
                email: summary.email,
                name: summary.name,
                role: summary.role,
                is_blocked: summary.is_blocked,
                created_at: summary.created_at
            },
            engagement: {
                total_time_spent: summary.total_time_spent,
                total_materials_opened: summary.total_materials_opened,
                avg_time_per_material,
                completion_rate: Math.round(summary.global_completion_rate),
                last_active: summary.last_active
            },
            history: materialsResult.rows
        };
    }

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
