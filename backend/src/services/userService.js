const { query } = require('../config/database');
const logger = require('../utils/logger');

class UserService {
  static async getUserById(userId) {
    try {
      const result = await query(
        'SELECT id, username, email, avatar_url, status, created_at FROM users WHERE id = $1',
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

  static async searchUsers(searchTerm) {
    try {
      const result = await query(
        `SELECT id, username, avatar_url, status
         FROM users
         WHERE username ILIKE $1 OR email ILIKE $1
         LIMIT 20`,
        [`%${searchTerm}%`]
      );

      return result.rows;
    } catch (error) {
      logger.error('Search users error:', error.message);
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

  static async updateUserProfile(userId, username, avatarUrl) {
    try {
      const result = await query(
        `UPDATE users
         SET username = COALESCE($1, username),
             avatar_url = COALESCE($2, avatar_url)
         WHERE id = $3
         RETURNING id, username, email, avatar_url`,
        [username || null, avatarUrl || null, userId]
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
