import { pool } from '../../config/db';

export class FeedbacksService {
    // Student submits feedback
    static async submitFeedback(userId: string, content: string, rating: number) {
        const result = await pool.query(
            `INSERT INTO feedbacks (user_id, content, rating)
             VALUES ($1, $2, $3)
             RETURNING id, content, rating, status, created_at`,
            [userId, content, rating]
        );
        return result.rows[0];
    }

    // Public gets approved feedbacks for landing page
    static async getPublicFeedbacks() {
        const result = await pool.query(
            `SELECT f.id, f.content, f.rating, f.created_at, u.name as user_name
             FROM feedbacks f
             JOIN users u ON u.id = f.user_id
             WHERE f.status = 'approved'
             ORDER BY f.created_at DESC
             LIMIT 20`
        );
        return result.rows;
    }

    // Admin gets all feedbacks for moderation
    static async getAllFeedbacks(status?: string) {
        const result = await pool.query(
            `SELECT f.id, f.content, f.rating, f.status, f.created_at, f.updated_at,
                    u.name as user_name, u.email as user_email, u.id as user_id
             FROM feedbacks f
             JOIN users u ON u.id = f.user_id
             ${status ? `WHERE f.status = $1` : ''}
             ORDER BY f.created_at DESC`,
            status ? [status] : []
        );
        return result.rows;
    }

    // Admin updates status (approve/reject)
    static async updateStatus(id: string, status: 'approved' | 'rejected' | 'pending') {
        const result = await pool.query(
            `UPDATE feedbacks 
             SET status = $1, updated_at = now() 
             WHERE id = $2 
             RETURNING id`,
            [status, id]
        );
        if (result.rowCount === 0) throw new Error('Feedback not found');
        return { success: true };
    }

    // Admin deletes feedback
    static async deleteFeedback(id: string) {
        const result = await pool.query(
            `DELETE FROM feedbacks WHERE id = $1 RETURNING id`,
            [id]
        );
        if (result.rowCount === 0) throw new Error('Feedback not found');
        return { success: true };
    }
}
