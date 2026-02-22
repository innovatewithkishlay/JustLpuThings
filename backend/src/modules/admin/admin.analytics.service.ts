import { pool } from '../../config/db';

export class AdminAnalyticsService {
    static async getMaterialStats(materialId: string) {
        const result = await pool.query(
            'SELECT total_views, unique_users, last_24h_views FROM material_stats WHERE material_id = $1',
            [materialId]
        );

        if (!result.rows.length) {
            return {
                total_views: 0,
                unique_users: 0,
                last_24h_views: 0
            };
        }

        return result.rows[0];
    }

    static async getAbuseEvents() {
        const result = await pool.query(`
            SELECT a.id, a.user_id, a.event_type, a.count, a.created_at, u.is_blocked 
            FROM abuse_events a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC 
            LIMIT 50
        `);

        return result.rows;
    }
}
