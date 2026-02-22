import { pool } from '../../config/db';
import { MaterialQueryInput } from './materials.schema';

export class MaterialsService {

    static async getMaterials(query: MaterialQueryInput) {
        const { page, limit, college, semester } = query;
        const offset = (page - 1) * limit;

        // Hard cap limits enforcing backend stamina
        const safeLimit = Math.min(limit, 50);

        let sql = `
      SELECT m.id, m.title, m.slug, m.description, 
             s.name as subject_name, sem.number as semester_number, c.name as college_name
      FROM materials m
      JOIN subjects s ON m.subject_id = s.id
      JOIN semesters sem ON s.semester_id = sem.id
      JOIN colleges c ON sem.college_id = c.id
      WHERE m.status = 'ACTIVE'
    `;

        const countSqlBase = `
      SELECT COUNT(m.id) as total
      FROM materials m
      JOIN subjects s ON m.subject_id = s.id
      JOIN semesters sem ON s.semester_id = sem.id
      JOIN colleges c ON sem.college_id = c.id
      WHERE m.status = 'ACTIVE'
    `;

        const values: any[] = [];
        let paramIndex = 1;

        if (college) {
            sql += ` AND c.code = $${paramIndex}`;
            values.push(college);
            paramIndex++;
        }

        if (semester) {
            sql += ` AND sem.number = $${paramIndex}`;
            values.push(semester);
            paramIndex++;
        }

        // Add sorting and pagination
        sql += ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

        const countValues = [...values];
        values.push(safeLimit, offset);

        const [materialsResult, countResult] = await Promise.all([
            pool.query(sql, values),
            pool.query(college || semester ? countSqlBase + ` AND c.code = $1` /* Pseudo logic, using count values */ : countSqlBase, countValues),
        ]);

        // Fast count logic fallback handling (Count query rebuilt for simplicity in execute)
        // To ensure perfect counts with precise parameters, we re-run parameter conditions:
        let finalCountSql = countSqlBase;
        let cnIdx = 1;
        if (college) { finalCountSql += ` AND c.code = $${cnIdx++}`; }
        if (semester) { finalCountSql += ` AND sem.number = $${cnIdx++}`; }

        const actualCount = await pool.query(finalCountSql, countValues);

        return {
            items: materialsResult.rows,
            meta: {
                page,
                limit: safeLimit,
                total: parseInt(actualCount.rows[0].total, 10)
            }
        };
    }

    static async getMaterialBySlug(slug: string, userId: string) {
        const sql = `
      SELECT m.id, m.title, m.slug, m.description, m.status,
             s.name as subject_name, sem.number as semester_number, 
             p.last_page, p.total_pages
      FROM materials m
      JOIN subjects s ON m.subject_id = s.id
      JOIN semesters sem ON s.semester_id = sem.id
      LEFT JOIN material_progress p ON (p.material_id = m.id AND p.user_id = $2)
      WHERE m.slug = $1
    `;

        const result = await pool.query(sql, [slug, userId]);

        if (!result.rows.length) {
            throw { statusCode: 404, message: 'Material not found' };
        }

        if (result.rows[0].status !== 'ACTIVE') {
            throw { statusCode: 403, message: 'Material is currently not available' };
        }

        // Remove internal status field before pushing to public array payload
        const data = result.rows[0];
        delete data.status;

        return data;
    }
}
