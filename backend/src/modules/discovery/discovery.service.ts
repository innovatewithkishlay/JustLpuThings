import { pool } from '../../config/db';
import { redis } from '../../config/redis';

export class DiscoveryService {

    // 1. Trending Materials
    static async getTrending() {
        const cacheKey = 'materials:trending';
        const cached = await redis.get(cacheKey);

        if (cached) {
            return typeof cached === 'string' ? JSON.parse(cached) : cached;
        }

        const result = await pool.query(`
            SELECT m.id, m.title, m.slug, m.description, s.last_24h_views, s.total_views
            FROM materials m
            JOIN material_stats s ON m.id = s.material_id
            WHERE m.status = 'ACTIVE'
            ORDER BY s.last_24h_views DESC, s.total_views DESC
            LIMIT 10
        `);

        await redis.set(cacheKey, JSON.stringify(result.rows), { ex: 60 });
        return result.rows;
    }

    // 2. Continue Reading
    static async getContinueReading(userId: string) {
        const result = await pool.query(`
            SELECT m.id, m.title, m.slug, p.last_page, p.total_pages, p.updated_at
            FROM material_progress p
            JOIN materials m ON p.material_id = m.id
            WHERE p.user_id = $1 AND m.status = 'ACTIVE'
            ORDER BY p.updated_at DESC
            LIMIT 10
        `, [userId]);

        return result.rows;
    }

    // 3. Recommendations
    static async getRecommendations(userId: string) {
        // Find most viewed subject
        const subjectRes = await pool.query(`
            SELECT m.subject_id, COUNT(v.id) as view_count
            FROM material_views v
            JOIN materials m ON v.material_id = m.id
            WHERE v.user_id = $1
            GROUP BY m.subject_id
            ORDER BY view_count DESC
            LIMIT 1
        `, [userId]);

        if (!subjectRes.rows.length) {
            // Fallback: No specific history -> Global Trending Fallback
            return await this.getTrending();
        }

        const favSubjectId = subjectRes.rows[0].subject_id;

        // Fetch top 5 items within their favorite Subject they haven't strictly finished
        const result = await pool.query(`
            SELECT m.id, m.title, m.slug, m.description, s.total_views
            FROM materials m
            LEFT JOIN material_progress p ON p.material_id = m.id AND p.user_id = $1
            LEFT JOIN material_stats s ON s.material_id = m.id
            WHERE m.subject_id = $2 AND m.status = 'ACTIVE'
              AND (p.id IS NULL OR p.total_pages IS NULL OR p.last_page < p.total_pages)
            ORDER BY s.total_views DESC NULLS LAST
            LIMIT 5
        `, [userId, favSubjectId]);

        return result.rows;
    }

    // 4. Engagement Stats
    static async getEngagement(slug: string) {
        const result = await pool.query(`
            SELECT s.total_views, s.avg_last_page, s.completion_rate
            FROM material_stats s
            JOIN materials m ON s.material_id = m.id
            WHERE m.slug = $1 AND m.status = 'ACTIVE'
        `, [slug]);

        if (!result.rows.length) {
            return {
                total_views: 0,
                avg_last_page: 0,
                completion_rate: 0
            };
        }

        return {
            total_views: parseInt(result.rows[0].total_views, 10),
            avg_last_page: parseFloat(result.rows[0].avg_last_page).toFixed(2),
            completion_rate: parseFloat(result.rows[0].completion_rate).toFixed(2) + '%'
        };
    }
}
