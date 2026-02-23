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
            values.push(semester);
            paramIndex++;
        }

        if (subject) {
            sql += ` AND s.name = $${paramIndex}`;
            values.push(subject.replace(/-/g, ' '));
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
        sql += ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        values.push(safeLimit, offset);

        const materialsResult = await pool.query(sql, values);

        let finalCountSql = countSqlBase;
        const countValues: any[] = [];
        let cnIdx = 1;
        if (college) { finalCountSql += ` AND c.code = $${cnIdx++}`; countValues.push(college); }
        if (semester) { finalCountSql += ` AND sem.number = $${cnIdx++}`; countValues.push(semester); }
        if (subject) { finalCountSql += ` AND s.name = $${cnIdx++}`; countValues.push(subject.replace(/-/g, ' ')); }
        if (category) { finalCountSql += ` AND m.category = $${cnIdx++}`; countValues.push(category); }
        if (unit) { finalCountSql += ` AND m.unit = $${cnIdx++}`; countValues.push(unit); }

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
