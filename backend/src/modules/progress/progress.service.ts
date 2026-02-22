import { pool } from '../../config/db';
import { ProgressInput } from '../materials/materials.schema'; // Utilizing shared schema

export class ProgressService {

    static async upsertProgress(slug: string, userId: string, data: ProgressInput) {
        // 1. Resolve slug to material ID quickly (cache miss handled safely by DB)
        // Could optionally cache slug->id mapping in Redis for UPSERT speed
        const materialRes = await pool.query('SELECT id FROM materials WHERE slug = $1', [slug]);

        if (!materialRes.rows.length) {
            throw { statusCode: 404, message: 'Material not found' };
        }
        const materialId = materialRes.rows[0].id;

        // 2. Perform Pg UPSERT
        const query = `
      INSERT INTO material_progress (user_id, material_id, last_page, total_pages, updated_at)
      VALUES ($1, $2, $3, $4, now())
      ON CONFLICT (user_id, material_id)
      DO UPDATE SET
        last_page = EXCLUDED.last_page,
        total_pages = COALESCE(EXCLUDED.total_pages, material_progress.total_pages),
        updated_at = now()
    `;

        await pool.query(query, [userId, materialId, data.last_page, data.total_pages]);

        return true;
    }
}
