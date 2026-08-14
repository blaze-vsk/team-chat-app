const { query } = require('../config/database');
const logger = require('../utils/logger');

class UserService {
  static async getUserById(userId) {
    const result = await query(
      'SELECT id, username, email, avatar_url, status, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (!result.rows[0]) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    return result.rows[0];
  }

  static async getPublicUserById(userId) {
    const result = await query(
      'SELECT id, username, avatar_url, status, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (!result.rows[0]) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    return result.rows[0];
  }

  static async searchUsers(searchTerm) {
    const result = await query(
      `SELECT id, username, avatar_url, status
       FROM users
       WHERE username ILIKE $1 OR email ILIKE $1
       LIMIT 20`,
      [`%${searchTerm}%`]
    );
    return result.rows;
  }

  static async updateUserStatus(userId, status) {
    const result = await query(
      `UPDATE users
       SET status = $1, last_seen = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, status`,
      [status, userId]
    );
    if (result.rows[0]) logger.info('User status updated', { userId, status });
    return result.rows[0];
  }

  static async updateUserProfile(userId, username, avatarUrl) {
    const result = await query(
      `UPDATE users
       SET username = COALESCE($1, username),
           avatar_url = COALESCE($2, avatar_url)
       WHERE id = $3
       RETURNING id, username, email, avatar_url, status`,
      [username || null, avatarUrl || null, userId]
    );
    if (!result.rows[0]) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    logger.info('User profile updated', { userId });
    return result.rows[0];
  }
}

module.exports = UserService;
