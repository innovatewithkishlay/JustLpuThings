import { pool } from '../../config/db';

export class SearchService {
    static async searchMaterials(query: string) {
        if (!query || query.length < 2) {
            return [];
        }

        const result = await pool.query(
            `SELECT id, title, slug, description, ts_rank(search_vector, plainto_tsquery('english', $1)) as rank
             FROM materials
             WHERE search_vector @@ plainto_tsquery('english', $1) AND status = 'ACTIVE'
             ORDER BY rank DESC
             LIMIT 20`,
            [query]
        );

        return result.rows;
    }
}
