import { pool } from '../../config/db';

export class MessagesService {
    // User submits a request
    static async createMessage(userId: string, content: string) {
        const result = await pool.query(
            `INSERT INTO messages (user_id, content)
             VALUES ($1, $2) RETURNING id, content, status, created_at`,
            [userId, content]
        );
        return result.rows[0];
    }

    // User fetches their own messages + replies
    static async getUserMessages(userId: string) {
        const result = await pool.query(
            `SELECT m.id, m.content, m.status, m.admin_reply, m.replied_at, m.created_at
             FROM messages m
             WHERE m.user_id = $1
             ORDER BY m.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    // Admin fetches all messages
    static async getAllMessages(status?: string) {
        const result = await pool.query(
            `SELECT m.id, m.content, m.status, m.admin_reply, m.replied_at, m.created_at,
                    u.name AS user_name, u.email AS user_email, u.id AS user_id
             FROM messages m
             JOIN users u ON u.id = m.user_id
             ${status ? `WHERE m.status = $1` : ''}
             ORDER BY m.created_at DESC`,
            status ? [status] : []
        );
        return result.rows;
    }

    // Admin replies to a message (also creates a notification for the user)
    static async replyToMessage(messageId: string, reply: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const msgResult = await client.query(
                `UPDATE messages
                 SET admin_reply = $1, replied_at = now(), status = 'resolved'
                 WHERE id = $2
                 RETURNING user_id`,
                [reply, messageId]
            );

            if (msgResult.rowCount === 0) throw new Error('Message not found');

            const userId = msgResult.rows[0].user_id;

            // Auto-create a notification for the user
            await client.query(
                `INSERT INTO notifications (user_id, title, body, type)
                 VALUES ($1, $2, $3, 'reply')`,
                [userId, 'Admin replied to your request', reply]
            );

            await client.query('COMMIT');
            return { success: true };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}
