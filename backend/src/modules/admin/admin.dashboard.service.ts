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
            totalUsers: parseInt(users.rows[0].total, 10),
            totalMaterials: parseInt(materials.rows[0].total, 10),
            totalViews: parseInt(views.rows[0]?.total || 0, 10),
            activeUsers: parseInt(activeUsers.rows[0]?.total || 0, 10),
            flaggedUsers: parseInt(abuse.rows[0].total, 10),
            top5Materials: topMaterials.rows.map(row => ({
                materialId: row.id,
                title: row.title,
                totalViews: parseInt(row.total_views, 10)
            }))
        };
    }
}
