import { pool } from './src/config/db';

async function hydrate() {
    console.log('--- Daily Traffic Hydration Script ---');
    console.log('Calculating historical stats from logs...');

    try {
        // Aggregate hits and unique visitors from visitor_logs
        const visitorAggregation = await pool.query(`
            SELECT 
                visited_at::date as date,
                COUNT(*) as total_views,
                COUNT(DISTINCT ip_hash) as total_active_users
            FROM visitor_logs
            GROUP BY visited_at::date
        `);

        // Aggregate new users from users table
        const userAggregation = await pool.query(`
            SELECT 
                created_at::date as date,
                COUNT(*) as total_new_users
            FROM users
            GROUP BY created_at::date
        `);

        const statsMap: Record<string, any> = {};

        // Merge results
        visitorAggregation.rows.forEach(row => {
            const dateStr = row.date.toISOString().split('T')[0];
            statsMap[dateStr] = {
                date: dateStr,
                views: row.total_views,
                active: row.total_active_users,
                newUsers: 0
            };
        });

        userAggregation.rows.forEach(row => {
            const dateStr = row.date.toISOString().split('T')[0];
            if (!statsMap[dateStr]) {
                statsMap[dateStr] = { date: dateStr, views: 0, active: 0, newUsers: row.total_new_users };
            } else {
                statsMap[dateStr].newUsers = row.total_new_users;
            }
        });

        console.log(`Processing ${Object.keys(statsMap).length} days of data...`);

        for (const dateStr in statsMap) {
            const s = statsMap[dateStr];
            await pool.query(`
                INSERT INTO daily_platform_stats (date, total_views, total_active_users, total_new_users)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (date)
                DO UPDATE SET 
                    total_views = EXCLUDED.total_views,
                    total_active_users = EXCLUDED.total_active_users,
                    total_new_users = EXCLUDED.total_new_users
            `, [s.date, s.views, s.active, s.newUsers]);
        }

        console.log('--- Hydration Successful ---');
    } catch (err) {
        console.error('--- Hydration Failed ---');
        console.error(err);
    } finally {
        await pool.end();
    }
}

hydrate();
