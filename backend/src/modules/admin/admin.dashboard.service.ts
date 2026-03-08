import { pool } from '../../config/db';

export class AdminDashboardService {
    static async getOverview() {
        const query = `
            WITH 
            user_count AS (SELECT COUNT(*) as total FROM users),
            material_count AS (SELECT COUNT(*) as total FROM materials WHERE status = 'ACTIVE'),
            view_sum AS (SELECT COALESCE(SUM(total_views), 0) as total FROM material_stats),
            active_sessions AS (
                SELECT COUNT(DISTINCT user_id) as total 
                FROM material_progress 
                WHERE updated_at > now() - interval '5 minutes'
            ),
            abuse_count AS (SELECT COUNT(DISTINCT user_id) as total FROM abuse_events),
            visits_today AS (
                SELECT COUNT(DISTINCT ip_hash) as total 
                FROM visitor_logs 
                WHERE visited_at >= CURRENT_DATE
            ),
            visits_yesterday AS (
                SELECT COUNT(DISTINCT ip_hash) as total 
                FROM visitor_logs 
                WHERE visited_at >= CURRENT_DATE - INTERVAL '1 day' 
                AND visited_at < CURRENT_DATE
            ),
            total_unique_visitors AS (
                SELECT COUNT(DISTINCT ip_hash) as total 
                FROM visitor_logs
            ),
            top_mats AS (
                SELECT m.id, m.title, s.total_views 
                FROM materials m 
                JOIN material_stats s ON m.id = s.material_id 
                ORDER BY s.total_views DESC 
                LIMIT 5
            )
            SELECT 
                (SELECT total FROM user_count) as total_users,
                (SELECT total FROM material_count) as total_materials,
                (SELECT total FROM view_sum) as total_views,
                (SELECT total FROM active_sessions) as active_sessions,
                (SELECT total FROM abuse_count) as flagged_users,
                (SELECT total FROM visits_today) as visits_today,
                (SELECT total FROM visits_yesterday) as visits_yesterday,
                (SELECT total FROM total_unique_visitors) as total_unique_visitors,
                (SELECT json_agg(top_mats) FROM top_mats) as top_materials;

        `;

        const result = await pool.query(query);
        const row = result.rows[0];

        return {
            totalUsers: parseInt(row.total_users || 0, 10),
            totalMaterials: parseInt(row.total_materials || 0, 10),
            totalViews: parseInt(row.total_views || 0, 10),
            activeUsers: parseInt(row.active_sessions || 0, 10),
            flaggedUsers: parseInt(row.flagged_users || 0, 10),
            visitsToday: parseInt(row.visits_today || 0, 10),
            visitsYesterday: parseInt(row.visits_yesterday || 0, 10),
            totalUniqueVisitors: parseInt(row.total_unique_visitors || 0, 10),
            top5Materials: (row.top_materials || []).map((m: any) => ({
                materialId: m.id,
                title: m.title,
                totalViews: parseInt(m.total_views, 10)
            }))
        };
    }
}
