import { pool } from '../../config/db';
import slugify from 'slugify';

export class AdminSubjectsService {

    static async getAllSubjects() {
        const sql = `
            SELECT s.id, s.name, s.slug, sem.number as semester_number
            FROM subjects s
            JOIN semesters sem ON s.semester_id = sem.id
            ORDER BY sem.number ASC, s.name ASC
        `;
        const result = await pool.query(sql);
        return result.rows;
    }

    static async createSubject(adminId: string, name: string, semesterNumber: number) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Find Semester ID
            const semRes = await client.query('SELECT id FROM semesters WHERE number = $1 LIMIT 1', [semesterNumber]);
            if (semRes.rows.length === 0) {
                throw { statusCode: 404, message: `Semester ${semesterNumber} not found.` };
            }
            const semesterId = semRes.rows[0].id;

            // 2. Generate slug
            const slug = slugify(name, { lower: true, strict: true });

            // 3. Insert Subject
            const insertRes = await client.query(
                'INSERT INTO subjects (semester_id, name, slug) VALUES ($1, $2, $3) RETURNING id, name, slug',
                [semesterId, name, slug]
            );

            const subjectId = insertRes.rows[0].id;

            // 4. Audit Log
            await client.query(
                `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, metadata)
                 VALUES ($1, $2, $3, $4, $5)`,
                [adminId, 'CREATE_SUBJECT', 'subject', subjectId, JSON.stringify({ name, semester: semesterNumber })]
            );

            await client.query('COMMIT');
            return insertRes.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async deleteSubject(adminId: string, subjectId: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Find subject name for logs
            const subRes = await client.query('SELECT name FROM subjects WHERE id = $1', [subjectId]);
            if (subRes.rows.length === 0) {
                throw { statusCode: 404, message: 'Subject not found.' };
            }
            const subjectName = subRes.rows[0].name;

            // Delete (cascades to materials if defined in schema, else will error if materials exist)
            await client.query('DELETE FROM subjects WHERE id = $1', [subjectId]);

            // Audit Log
            await client.query(
                `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, metadata)
                 VALUES ($1, $2, $3, $4, $5)`,
                [adminId, 'DELETE_SUBJECT', 'subject', subjectId, JSON.stringify({ name: subjectName })]
            );

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
