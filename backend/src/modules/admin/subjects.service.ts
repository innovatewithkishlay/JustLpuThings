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

    static async getSemesters() {
        const sql = `
            SELECT number, is_active 
            FROM semesters 
            ORDER BY number ASC
        `;
        const result = await pool.query(sql);
        return result.rows;
    }

    static async toggleSemesterStatus(adminId: string, semesterNumber: number, isActive: boolean) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                'UPDATE semesters SET is_active = $1 WHERE number = $2',
                [isActive, semesterNumber]
            );

            // Audit Log
            await client.query(
                `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, metadata)
                 VALUES ($1, $2, $3, $4, $5)`,
                [adminId, 'TOGGLE_SEMESTER', 'semester', semesterNumber.toString(), JSON.stringify({ number: semesterNumber, is_active: isActive })]
            );

            await client.query('COMMIT');
            return { number: semesterNumber, is_active: isActive };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async createSubject(adminId: string, name: string, semesterNumber: number) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Find Semester ID and check if active
            const semRes = await client.query('SELECT id, is_active FROM semesters WHERE number = $1 LIMIT 1', [semesterNumber]);
            if (semRes.rows.length === 0) {
                throw { statusCode: 404, message: `Semester ${semesterNumber} not found.` };
            }

            if (!semRes.rows[0].is_active) {
                throw { statusCode: 403, message: `Semester ${semesterNumber} is not active. Please activate it first.` };
            }

            const semesterId = semRes.rows[0].id;

            // 2. Check for duplicates in the same semester (case-insensitive)
            const duplicateRes = await client.query(
                'SELECT id FROM subjects WHERE semester_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1',
                [semesterId, name]
            );

            if (duplicateRes.rows.length > 0) {
                throw { statusCode: 409, message: `Subject "${name}" already exists in Semester ${semesterNumber}.` };
            }

            // 3. Generate slug
            const slug = slugify(name, { lower: true, strict: true });

            // 4. Insert Subject
            const insertRes = await client.query(
                'INSERT INTO subjects (semester_id, name, slug) VALUES ($1, $2, $3) RETURNING id, name, slug',
                [semesterId, name, slug]
            );

            const subjectId = insertRes.rows[0].id;

            // 5. Audit Log
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
