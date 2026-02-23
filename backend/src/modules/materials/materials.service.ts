import { pool } from '../../config/db';
import { MaterialQueryInput } from './materials.schema';

export class MaterialsService {

    static async getMaterials(query: MaterialQueryInput) {
        const { page, limit, college, semester, subject, category, unit } = query;
        const offset = (page - 1) * limit;

        // Hard cap limits enforcing backend stamina
        const safeLimit = Math.min(limit, 50);

        let sql = `
      SELECT m.id, m.title, m.slug, m.description, m.category, m.unit, m.youtube_url,
             (m.file_key IS NOT NULL) AS has_file,
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
            values.push(parseInt(semester as unknown as string, 10));
            paramIndex++;
        }

        if (subject) {
            sql += ` AND s.slug = $${paramIndex}`;
            values.push(subject);
            paramIndex++;
        }

        if (category) {
            sql += ` AND m.category = $${paramIndex}`;
            values.push(category);
            paramIndex++;
        }

        if (unit) {
            sql += ` AND m.unit = $${paramIndex}`;
            values.push(unit);
            paramIndex++;
        }

        // Add sorting and pagination
        const paginatedSql = sql + ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        const paginatedValues = [...values, safeLimit, offset];

        const [materialsResult, countResult] = await Promise.all([
            pool.query(paginatedSql, paginatedValues),
            pool.query(countSqlBase + sql.split('WHERE m.status = \'ACTIVE\'')[1] || '', values)
        ]);

        const actualCount = countResult;

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
      SELECT m.id, m.title, m.slug, m.description, m.category, m.unit, m.youtube_url, m.status,
             (m.file_key IS NOT NULL) AS has_file,
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
