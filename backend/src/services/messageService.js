const { query } = require('../config/database');
const logger = require('../utils/logger');

class MessageService {
  static async saveMessage(teamId, senderId, content, type = 'text') {
    try {
      const result = await query(
        `INSERT INTO messages (team_id, sender_id, content, message_type)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [teamId, senderId, content, type]
      );

      const message = result.rows[0];

      // Get sender info
      const senderResult = await query(
        'SELECT id, username, avatar_url FROM users WHERE id = $1',
        [senderId]
      );

      message.sender = senderResult.rows[0];

      logger.info(`Message saved in team ${teamId} by user ${senderId}`);
      return message;
    } catch (error) {
      logger.error('Save message error:', error.message);
      throw error;
    }
  }

  static async getMessages(teamId, limit = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT m.*, u.username, u.avatar_url
         FROM messages m
         INNER JOIN users u ON m.sender_id = u.id
         WHERE m.team_id = $1
         ORDER BY m.created_at DESC
         LIMIT $2 OFFSET $3`,
        [teamId, limit, offset]
      );

      return result.rows.reverse();
    } catch (error) {
      logger.error('Get messages error:', error.message);
      throw error;
    }
  }

  static async editMessage(messageId, content) {
    try {
      const result = await query(
        `UPDATE messages
         SET content = $1, is_edited = true, edited_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [content, messageId]
      );

      logger.info(`Message ${messageId} edited`);
      return result.rows[0];
    } catch (error) {
      logger.error('Edit message error:', error.message);
      throw error;
    }
  }

  static async deleteMessage(messageId) {
    try {
      await query('DELETE FROM messages WHERE id = $1', [messageId]);
      logger.info(`Message ${messageId} deleted`);
      return { success: true };
    } catch (error) {
      logger.error('Delete message error:', error.message);
      throw error;
    }
  }
}

module.exports = MessageService;
