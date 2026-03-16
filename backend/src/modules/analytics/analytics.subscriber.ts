import { pool } from '../../config/db';

export class AnalyticsSubscriber {
    /**
     * Increments the new user count for today in daily_platform_stats
     */
    static async incrementNewUserCount() {
        try {
            await pool.query(`
                INSERT INTO daily_platform_stats (date, total_views, total_active_users, total_new_users)
                VALUES (CURRENT_DATE, 0, 0, 1)
                ON CONFLICT (date)
                DO UPDATE SET total_new_users = daily_platform_stats.total_new_users + 1
            `);
        } catch (err) {
            console.error('[ANALYTICS:SUB:ERR]', err);
        }
    }
}
