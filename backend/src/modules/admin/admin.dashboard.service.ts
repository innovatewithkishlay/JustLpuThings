import { pool } from '../../config/db';

export class AdminDashboardService {
    static async getOverview() {
        const queries = [
            pool.query('SELECT COUNT(*) as total FROM users'),
            pool.query("SELECT COUNT(*) as total FROM materials WHERE status = 'ACTIVE'"),
            pool.query('SELECT SUM(total_views) as total FROM material_stats'),
            pool.query(`SELECT total_active_users as total FROM daily_platform_stats WHERE date = CURRENT_DATE`),
            pool.query(`
                SELECT m.id, m.title, s.total_views 
                FROM materials m 
                JOIN material_stats s ON m.id = s.material_id 
                ORDER BY s.total_views DESC 
                LIMIT 5
            `),
            pool.query('SELECT COUNT(DISTINCT user_id) as total FROM abuse_events')
        ];

        const [users, materials, views, activeUsers, topMaterials, abuse] = await Promise.all(queries);

        return {
            total_users: parseInt(users.rows[0].total, 10),
            total_materials: parseInt(materials.rows[0].total, 10),
            total_views: parseInt(views.rows[0]?.total || 0, 10),
            active_users_last_24h: parseInt(activeUsers.rows[0]?.total || 0, 10),
            suspicious_users_count: parseInt(abuse.rows[0].total, 10),
            top_5_materials: topMaterials.rows.map(row => ({
                material_id: row.id,
                title: row.title,
                total_views: parseInt(row.total_views, 10)
            })),
            todays_stats: {
                total_views: parseInt(views.rows[0]?.total || 0, 10),
                total_active_users: parseInt(activeUsers.rows[0]?.total || 0, 10)
            }
        };
    }
}
