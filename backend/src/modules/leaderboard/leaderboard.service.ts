import { pool } from '../../config/db';

// In-memory cache (5 min TTL)
let cachedLeaderboard: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function maskEmail(email: string): string {
    if (!email) return '***';
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
}

function formatStreak(days: number): { count: number; label: string; tier: string } {
    if (days >= 7) return { count: days, label: 'On Fire!', tier: 'legendary' };
    if (days >= 4) return { count: days, label: 'Blazing', tier: 'epic' };
    if (days >= 2) return { count: days, label: 'Warming Up', tier: 'rare' };
    if (days === 1) return { count: days, label: 'Started', tier: 'common' };
    return { count: 0, label: 'No streak', tier: 'none' };
}

export class LeaderboardService {

    static async getLeaderboard(currentUserId: string) {
        const now = Date.now();

        // Return cached if fresh
        if (cachedLeaderboard && (now - cacheTimestamp) < CACHE_TTL) {
            return this.personalizeResponse(cachedLeaderboard, currentUserId);
        }

        // Main ranking query
        const rankQuery = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.avatar_url,
                COALESCE(SUM(mp.time_spent), 0)::int as total_time_spent,
                COUNT(DISTINCT mp.material_id)::int as materials_opened,
                MAX(rh.last_active) as last_active
            FROM users u
            LEFT JOIN material_progress mp ON mp.user_id = u.id
            LEFT JOIN LATERAL (
                SELECT MAX(created_at) as last_active
                FROM user_reading_history
                WHERE user_id = u.id
            ) rh ON true
            WHERE u.role = 'USER'
            AND (u.is_blocked IS NOT TRUE)
            AND COALESCE((SELECT SUM(time_spent) FROM material_progress WHERE user_id = u.id), 0) > 0
            GROUP BY u.id, u.name, u.email, u.avatar_url, rh.last_active
            ORDER BY total_time_spent DESC
            LIMIT 20;
        `;

        const rankResult = await pool.query(rankQuery);

        // Calculate streaks for top 20
        const leaderboard = [];
        for (let i = 0; i < rankResult.rows.length; i++) {
            const row = rankResult.rows[i];
            const streak = await this.calculateStreak(row.id);

            leaderboard.push({
                rank: i + 1,
                userId: row.id,
                name: row.name || maskEmail(row.email).split('@')[0],
                email: maskEmail(row.email),
                avatarUrl: row.avatar_url || null,
                totalTimeSpent: parseInt(row.total_time_spent, 10),
                materialsOpened: parseInt(row.materials_opened, 10),
                currentStreak: formatStreak(streak),
                lastActive: row.last_active
            });
        }

        // Get total participant count
        const countResult = await pool.query(`
            SELECT COUNT(DISTINCT user_id)::int as total
            FROM material_progress
            WHERE time_spent > 0
        `);
        const totalParticipants = parseInt(countResult.rows[0]?.total || '0', 10);

        // Get ALL user ranks for percentile calculation
        const allRanksQuery = `
            SELECT user_id, SUM(time_spent)::int as total_time
            FROM material_progress
            GROUP BY user_id
            HAVING SUM(time_spent) > 0
            ORDER BY total_time DESC;
        `;
        const allRanks = await pool.query(allRanksQuery);

        // Cache the full result
        cachedLeaderboard = {
            leaderboard,
            totalParticipants,
            allRanks: allRanks.rows
        };
        cacheTimestamp = now;

        return this.personalizeResponse(cachedLeaderboard, currentUserId);
    }

    private static personalizeResponse(cached: any, currentUserId: string) {
        const { leaderboard, totalParticipants, allRanks } = cached;

        // Mark current user
        const personalizedBoard = leaderboard.map((entry: any) => ({
            ...entry,
            isCurrentUser: entry.userId === currentUserId
        }));

        // Find current user rank
        let currentUserRank = null;
        const userIndex = allRanks.findIndex((r: any) => r.user_id === currentUserId);

        if (userIndex >= 0) {
            const percentile = Math.round(((totalParticipants - userIndex) / totalParticipants) * 100);
            currentUserRank = {
                rank: userIndex + 1,
                totalTimeSpent: parseInt(allRanks[userIndex].total_time, 10),
                percentile: Math.max(1, percentile)
            };
        }

        return {
            leaderboard: personalizedBoard,
            currentUserRank,
            totalParticipants
        };
    }

    private static async calculateStreak(userId: string): Promise<number> {
        const query = `
            WITH daily AS (
                SELECT DISTINCT DATE(created_at AT TIME ZONE 'Asia/Kolkata') as active_date
                FROM user_reading_history
                WHERE user_id = $1
                AND created_at >= CURRENT_DATE - INTERVAL '90 days'
                ORDER BY active_date DESC
            ),
            numbered AS (
                SELECT active_date,
                       active_date - (ROW_NUMBER() OVER (ORDER BY active_date DESC))::int AS grp
                FROM daily
            )
            SELECT COUNT(*)::int as streak
            FROM numbered
            WHERE grp = (
                SELECT grp FROM numbered
                WHERE active_date >= CURRENT_DATE - INTERVAL '1 day'
                ORDER BY active_date DESC
                LIMIT 1
            );
        `;

        try {
            const result = await pool.query(query, [userId]);
            return parseInt(result.rows[0]?.streak || '0', 10);
        } catch {
            return 0;
        }
    }
}
