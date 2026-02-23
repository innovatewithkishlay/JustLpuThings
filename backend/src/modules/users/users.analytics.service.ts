import { pool } from '../../config/db';

export class UserAnalyticsService {

    static async getMyAnalytics(userId: string) {
        // 1. Overview Stats
        const overviewQuery = `
            SELECT 
                COALESCE(SUM(time_spent), 0) as total_time_spent,
                COUNT(*) as total_materials_opened,
                MAX(updated_at) as last_active,
                COALESCE(AVG(CAST(last_page AS FLOAT) / NULLIF(total_pages, 0)) * 100, 0) as avg_completion_rate
            FROM material_progress
            WHERE user_id = $1
        `;

        // 2. Most Studied Subject
        const mostStudiedQuery = `
            SELECT s.name, SUM(mp.time_spent) as total_time
            FROM material_progress mp
            JOIN materials m ON mp.material_id = m.id
            JOIN subjects s ON m.subject_id = s.id
            WHERE mp.user_id = $1
            GROUP BY s.id, s.name
            ORDER BY total_time DESC
            LIMIT 1
        `;

        // 3. Daily Activity (Last 7 Days)
        // Bucketing by date and summing time_spent_increment
        const dailyActivityQuery = `
            WITH date_series AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '6 days',
                    CURRENT_DATE,
                    '1 day'::interval
                )::date as active_date
            )
            SELECT 
                ds.active_date as date,
                COALESCE(SUM(rh.time_spent_increment), 0) as time_spent,
                COUNT(DISTINCT rh.material_id) as materials_opened
            FROM date_series ds
            LEFT JOIN user_reading_history rh ON ds.active_date = rh.created_at::date AND rh.user_id = $1
            GROUP BY ds.active_date
            ORDER BY ds.active_date ASC
        `;

        // 4. In Progress Materials
        const inProgressQuery = `
            SELECT 
                m.id, m.title, m.slug,
                mp.last_page, mp.total_pages,
                COALESCE((CAST(mp.last_page AS FLOAT) / NULLIF(mp.total_pages, 0)) * 100, 0) as completion_percentage
            FROM material_progress mp
            JOIN materials m ON mp.material_id = m.id
            WHERE mp.user_id = $1 AND (mp.total_pages IS NULL OR mp.last_page < mp.total_pages)
            ORDER BY mp.updated_at DESC
            LIMIT 5
        `;

        // 5. Material History
        const historyQuery = `
            SELECT 
                m.title, m.slug,
                sem.number as semester,
                s.name as subject,
                mp.last_page, mp.total_pages,
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

        const [overviewRes, mostStudiedRes, dailyRes, inProgressRes, historyRes] = await Promise.all([
            pool.query(overviewQuery, [userId]),
            pool.query(mostStudiedQuery, [userId]),
            pool.query(dailyActivityQuery, [userId]),
            pool.query(inProgressQuery, [userId]),
            pool.query(historyQuery, [userId])
        ]);

        const overview = overviewRes.rows[0];
        const mostStudied = mostStudiedRes.rows[0];

        return {
            total_time_spent: parseInt(overview.total_time_spent),
            total_materials_opened: parseInt(overview.total_materials_opened),
            avg_completion_rate: Math.round(parseFloat(overview.avg_completion_rate)),
            most_studied_subject: mostStudied ? mostStudied.name : 'None yet',
            last_active: overview.last_active,
            daily_activity: dailyRes.rows.map(row => ({
                date: row.date.toISOString().split('T')[0],
                time_spent: parseInt(row.time_spent),
                materials_opened: parseInt(row.materials_opened)
            })),
            in_progress_materials: inProgressRes.rows,
            material_history: historyRes.rows
        };
    }
}
