import { pool } from '../../config/db';

export class NotificationsService {
    // Get notifications for a user (personal + broadcasts)
    static async getForUser(userId: string) {
        const result = await pool.query(
            `SELECT id, title, body, type, read_at, created_at
             FROM notifications
             WHERE user_id = $1 OR user_id IS NULL
             ORDER BY created_at DESC
             LIMIT 50`,
            [userId]
        );
        return result.rows;
    }

    // Count unread notifications for a user
    static async getUnreadCount(userId: string) {
        const result = await pool.query(
            `SELECT COUNT(*) AS count
             FROM notifications
             WHERE (user_id = $1 OR user_id IS NULL)
               AND read_at IS NULL`,
            [userId]
        );
        return parseInt(result.rows[0].count, 10);
    }

    // Mark a single notification as read
    static async markRead(notificationId: string, userId: string) {
        await pool.query(
            `UPDATE notifications SET read_at = now()
             WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
            [notificationId, userId]
        );
    }

    // Mark ALL notifications as read for a user
    static async markAllRead(userId: string) {
        await pool.query(
            `UPDATE notifications SET read_at = now()
             WHERE (user_id = $1 OR user_id IS NULL) AND read_at IS NULL`,
            [userId]
        );
    }

    // Admin: send broadcast (user_id = NULL) or targeted notification
    static async send(title: string, body: string, type: string, userId?: string) {
        const result = await pool.query(
            `INSERT INTO notifications (user_id, title, body, type)
             VALUES ($1, $2, $3, $4)
             RETURNING id, title, body, type, created_at`,
            [userId || null, title, body, type]
        );
        return result.rows[0];
    }

    // Admin: get all notifications sent
    static async getAll() {
        const result = await pool.query(
            `SELECT n.id, n.title, n.body, n.type, n.created_at,
                    u.name AS target_user_name, u.email AS target_user_email
             FROM notifications n
             LEFT JOIN users u ON u.id = n.user_id
             ORDER BY n.created_at DESC
             LIMIT 100`
        );
        return result.rows;
    }
}
