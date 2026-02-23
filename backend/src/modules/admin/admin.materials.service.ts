import { pool } from '../../config/db';
import { R2Service } from '../storage/r2.service';
import { AdminMaterialUploadInput, AdminMaterialUpdateInput } from './admin.schema';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';

export class AdminMaterialsService {

    static async uploadMaterial(adminId: string, data: AdminMaterialUploadInput, file?: Express.Multer.File) {
        if (file && file.mimetype !== 'application/pdf') {
            throw { statusCode: 400, message: 'Invalid file type. Only PDF is allowed.' };
        }

        const rawSlug = slugify(data.title, { lower: true, strict: true });
        const uniqueSlug = `${rawSlug}-${Math.random().toString(36).substring(2, 8)}`;
        let fileKey: string | null = null;

        if (file) {
            fileKey = `materials/${uuidv4()}.pdf`;
            // 1. Upload to R2
            const uploadSuccess = await R2Service.uploadFile(file.buffer, fileKey);
            if (!uploadSuccess) {
                throw { statusCode: 500, message: 'Failed to upload file to storage.' };
            }
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const subjectRes = await client.query('SELECT id FROM subjects WHERE slug = $1', [data.subject]);
            if (subjectRes.rows.length === 0) {
                throw { statusCode: 404, message: `Subject '${data.subject}' not found in database.` };
            }
            const subjectId = subjectRes.rows[0].id;

            const insertRes = await client.query(
                `INSERT INTO materials (subject_id, title, slug, description, file_key, category, unit, youtube_url, uploaded_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                [subjectId, data.title, uniqueSlug, data.description || null, fileKey, data.category || 'notes', data.unit || null, data.youtube_url || null, adminId]
            );

            const materialId = insertRes.rows[0].id;

            // Audit log
            await client.query(
                `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, metadata)
                 VALUES ($1, $2, $3, $4, $5)`,
                [adminId, 'CREATE_MATERIAL', 'material', materialId, JSON.stringify({ title: data.title })]
            );

            await client.query('COMMIT');

            return { id: materialId, slug: uniqueSlug, title: data.title };
        } catch (error) {
            await client.query('ROLLBACK');
            // Cleanup orphaned file
            if (fileKey) {
                await R2Service.deleteFile(fileKey);
            }
            throw error;
        } finally {
            client.release();
        }
    }

    static async updateMaterial(adminId: string, materialId: string, data: AdminMaterialUpdateInput) {
        if (Object.keys(data).length === 0) {
            throw { statusCode: 400, message: 'No fields to update provided' };
        }

        const fields: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.title !== undefined) {
            fields.push(`title = $${index++}`);
            values.push(data.title);
        }
        if (data.description !== undefined) {
            fields.push(`description = $${index++}`);
            values.push(data.description);
        }
        if (data.status !== undefined) {
            fields.push(`status = $${index++}`);
            values.push(data.status);
        }
        if (data.category !== undefined) {
            fields.push(`category = $${index++}`);
            values.push(data.category);
        }
        if (data.unit !== undefined) {
            fields.push(`unit = $${index++}`);
            values.push(data.unit);
        }
        if (data.youtube_url !== undefined) {
            fields.push(`youtube_url = $${index++}`);
            values.push(data.youtube_url);
        }

        values.push(materialId);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const res = await client.query(
                `UPDATE materials SET ${fields.join(', ')}, updated_at = now() WHERE id = $${index} RETURNING id`,
                values
            );

            if (!res.rowCount) {
                throw { statusCode: 404, message: 'Material not found' };
            }

            // Audit
            await client.query(
                `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, metadata)
                 VALUES ($1, $2, $3, $4, $5)`,
                [adminId, 'UPDATE_MATERIAL', 'material', materialId, JSON.stringify(data)]
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

    static async deleteMaterial(adminId: string, materialId: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Get file key
            const res = await client.query('SELECT file_key FROM materials WHERE id = $1', [materialId]);
            if (!res.rows.length) {
                throw { statusCode: 404, message: 'Material not found' };
            }
            const fileKey = res.rows[0].file_key;

            // 2. Erase from R2 securely before DB drop if a file natively exists
            if (fileKey) {
                const deleted = await R2Service.deleteFile(fileKey);
                if (!deleted) {
                    throw { statusCode: 500, message: 'Could not remove material from remote storage. DB retention active.' };
                }
            }

            // 3. Delete from DB (Hard Drop)
            await client.query('DELETE FROM materials WHERE id = $1', [materialId]);

            // 4. Log
            await client.query(
                `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
                 VALUES ($1, $2, $3, $4)`,
                [adminId, 'DELETE_MATERIAL', 'material', materialId]
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
