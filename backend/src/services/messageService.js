const { query } = require('../config/database');
const logger = require('../utils/logger');
const TeamService = require('./teamService');

const notFound = (message) => {
  const error = new Error(message);
  error.status = 404;
  return error;
};

class MessageService {
  static async saveMessage(teamId, senderId, content, type = 'text') {
    await TeamService.assertMember(teamId, senderId);
    const result = await query(
      `INSERT INTO messages (team_id, sender_id, content, message_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [teamId, senderId, content, type]
    );

    const message = result.rows[0];
    const sender = await query('SELECT id, username, avatar_url FROM users WHERE id = $1', [senderId]);
    message.sender = sender.rows[0];

    logger.info('Message saved', { teamId, senderId, messageId: message.id });
    return message;
  }

  static async getMessages(teamId, userId, limit = 50, offset = 0) {
    await TeamService.assertMember(teamId, userId);
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
  }

  static async editMessage(messageId, userId, content) {
    const result = await query(
      `UPDATE messages AS m
       SET content = $1, is_edited = true, edited_at = CURRENT_TIMESTAMP
       FROM team_members AS tm
       WHERE m.id = $2
         AND m.sender_id = $3
         AND tm.team_id = m.team_id
         AND tm.user_id = $3
       RETURNING m.*`,
      [content, messageId, userId]
    );
    if (!result.rows[0]) throw notFound('Message not found or you do not have permission to edit it');
    return result.rows[0];
  }

  static async deleteMessage(messageId, userId) {
    const result = await query(
      `DELETE FROM messages AS m
       USING team_members AS tm
       WHERE m.id = $1
         AND m.sender_id = $2
         AND tm.team_id = m.team_id
         AND tm.user_id = $2
       RETURNING m.id`,
      [messageId, userId]
    );
    if (!result.rows[0]) throw notFound('Message not found or you do not have permission to delete it');
    return { success: true };
  }
}

module.exports = MessageService;
