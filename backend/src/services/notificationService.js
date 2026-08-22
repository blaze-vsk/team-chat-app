const { query } = require('../config/database');
const logger = require('../utils/logger');

class NotificationService {
  static async createNotification(userId, relatedUserId, teamId, type, content) {
    try {
      const result = await query(
        `INSERT INTO notifications (user_id, related_user_id, team_id, type, content)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, relatedUserId, teamId, type, content]
      );
      
      const notif = result.rows[0];

      // Add related user details
      if (relatedUserId) {
        const userResult = await query(
          'SELECT username, display_name, avatar_url FROM users WHERE id = $1',
          [relatedUserId]
        );
        notif.related_user = userResult.rows[0];
      }

      logger.info(`Notification of type ${type} created for user ${userId}`);
      return notif;
    } catch (error) {
      logger.error('Create notification error:', error.message);
      throw error;
    }
  }

  static async getNotifications(userId) {
    try {
      const result = await query(
        `SELECT n.*, u.username as related_username, u.display_name as related_display_name, u.avatar_url as related_avatar_url, t.name as team_name
         FROM notifications n
         LEFT JOIN users u ON n.related_user_id = u.id
         LEFT JOIN teams t ON n.team_id = t.id
         WHERE n.user_id = $1
         ORDER BY n.created_at DESC
         LIMIT 50`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Get notifications error:', error.message);
      throw error;
    }
  }

  static async markAsRead(userId, notificationId) {
    try {
      await query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );
      return { success: true };
    } catch (error) {
      logger.error('Mark notification read error:', error.message);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      await query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1',
        [userId]
      );
      return { success: true };
    } catch (error) {
      logger.error('Mark all notifications read error:', error.message);
      throw error;
    }
  }
}

module.exports = NotificationService;
