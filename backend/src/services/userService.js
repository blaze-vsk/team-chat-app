const { query } = require('../config/database');
const logger = require('../utils/logger');

class UserService {
  static async getUserById(userId) {
    try {
      const result = await query(
        'SELECT id, username, display_name, email, avatar_url, status, status_message, last_seen, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Get user error:', error.message);
      throw error;
    }
  }

  static async updateUserStatus(userId, status) {
    try {
      const result = await query(
        `UPDATE users
         SET status = $1, last_seen = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, username, status`,
        [status, userId]
      );

      logger.info(`User ${userId} status updated to ${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Update status error:', error.message);
      throw error;
    }
  }

  static async updateUserProfile(userId, username, displayName, statusMessage, avatarUrl) {
    try {
      const result = await query(
        `UPDATE users
         SET username = COALESCE($1, username),
             display_name = COALESCE($2, display_name),
             status_message = COALESCE($3, status_message),
             avatar_url = COALESCE($4, avatar_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING id, username, display_name, email, avatar_url, status_message, status`,
        [username || null, displayName || null, statusMessage || null, avatarUrl || null, userId]
      );

      logger.info(`User ${userId} profile updated`);
      return result.rows[0];
    } catch (error) {
      logger.error('Update profile error:', error.message);
      throw error;
    }
  }
}

module.exports = UserService;
