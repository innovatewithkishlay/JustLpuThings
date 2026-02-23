import { pool } from '../../config/db';
import { ProgressInput } from '../materials/materials.schema'; // Utilizing shared schema

export class ProgressService {

    static async upsertProgress(slug: string, userId: string, data: ProgressInput) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const materialRes = await client.query('SELECT id FROM materials WHERE slug = $1', [slug]);

            if (!materialRes.rows.length) {
                throw { statusCode: 404, message: 'Material not found' };
            }
            const materialId = materialRes.rows[0].id;

            // 1. Perform Pg UPSERT into material_progress
            const upsertQuery = `
                INSERT INTO material_progress (user_id, material_id, last_page, total_pages, time_spent, updated_at)
                VALUES ($1, $2, $3, $4, $5, now())
                ON CONFLICT (user_id, material_id)
                DO UPDATE SET
                    last_page = EXCLUDED.last_page,
                    total_pages = COALESCE(EXCLUDED.total_pages, material_progress.total_pages),
                    time_spent = material_progress.time_spent + EXCLUDED.time_spent,
                    updated_at = now()
            `;

            await client.query(upsertQuery, [userId, materialId, data.last_page, data.total_pages, data.time_spent_increment]);

            // 2. Log into user_reading_history for daily/time-series analytics
            if (data.time_spent_increment > 0) {
                const historyQuery = `
                    INSERT INTO user_reading_history (user_id, material_id, time_spent_increment, last_page)
                    VALUES ($1, $2, $3, $4)
                `;
                await client.query(historyQuery, [userId, materialId, data.time_spent_increment, data.last_page]);
            }

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
