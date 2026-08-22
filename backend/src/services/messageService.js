const { query } = require('../config/database');
const logger = require('../utils/logger');

class MessageService {
  static async saveMessage(teamId, channelId, senderId, content, type = 'text', fileData = null, replyToId = null) {
    try {
      const result = await query(
        `INSERT INTO messages (team_id, channel_id, sender_id, content, message_type, reply_to_message_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [teamId, channelId, senderId, content, type, replyToId]
      );

      const message = result.rows[0];

      // Add attachment if present
      if (fileData) {
        const attachmentResult = await query(
          `INSERT INTO message_attachments (message_id, file_name, file_size, file_type, file_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [message.id, fileData.fileName, fileData.fileSize, fileData.fileType, fileData.fileUrl]
        );
        message.attachment = attachmentResult.rows[0];
      }

      // Fetch sender details
      const senderResult = await query(
        'SELECT id, username, display_name, avatar_url FROM users WHERE id = $1',
        [senderId]
      );
      message.sender = senderResult.rows[0];

      // Fetch reply parent if available
      if (replyToId) {
        const replyResult = await query(
          `SELECT m.id, m.content, u.username 
           FROM messages m
           INNER JOIN users u ON m.sender_id = u.id
           WHERE m.id = $1`,
          [replyToId]
        );
        if (replyResult.rows.length > 0) {
          message.reply_parent = replyResult.rows[0];
        }
      }

      logger.info(`Message saved in channel ${channelId} by user ${senderId}`);
      return message;
    } catch (error) {
      logger.error('Save message error:', error.message);
      throw error;
    }
  }

  static async getMessages(channelId, limit = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT m.*, u.username, u.display_name, u.avatar_url,
                ma.file_name, ma.file_size, ma.file_type, ma.file_url,
                parent.content as parent_content, pu.username as parent_username,
                (SELECT json_agg(json_build_object('reaction', mr.reaction, 'user_id', mr.user_id, 'username', ru.username))
                 FROM message_reactions mr
                 INNER JOIN users ru ON mr.user_id = ru.id
                 WHERE mr.message_id = m.id) as reactions
         FROM messages m
         INNER JOIN users u ON m.sender_id = u.id
         LEFT JOIN message_attachments ma ON m.id = ma.message_id
         LEFT JOIN messages parent ON m.reply_to_message_id = parent.id
         LEFT JOIN users pu ON parent.sender_id = pu.id
         WHERE m.channel_id = $1
         ORDER BY m.created_at DESC
         LIMIT $2 OFFSET $3`,
        [channelId, limit, offset]
      );

      return result.rows.reverse();
    } catch (error) {
      logger.error('Get messages error:', error.message);
      throw error;
    }
  }

  static async editMessage(messageId, senderId, content) {
    try {
      // Auth check
      const auth = await query('SELECT sender_id FROM messages WHERE id = $1', [messageId]);
      if (auth.rows.length === 0) throw new Error('Message not found');
      if (auth.rows[0].sender_id !== senderId) throw new Error('Unauthorized to edit this message');

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

  static async deleteMessage(messageId, senderId) {
    try {
      // Auth check: sender or team owner/admin
      const msgResult = await query('SELECT sender_id, team_id FROM messages WHERE id = $1', [messageId]);
      if (msgResult.rows.length === 0) throw new Error('Message not found');
      
      const msg = msgResult.rows[0];
      let authorized = msg.sender_id === senderId;

      if (!authorized && msg.team_id) {
        const teamAuth = await query(
          'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
          [msg.team_id, senderId]
        );
        if (teamAuth.rows.length > 0 && ['owner', 'admin'].includes(teamAuth.rows[0].role)) {
          authorized = true;
        }
      }

      if (!authorized) throw new Error('Unauthorized to delete this message');

      await query('DELETE FROM messages WHERE id = $1', [messageId]);
      logger.info(`Message ${messageId} deleted`);
      return { success: true };
    } catch (error) {
      logger.error('Delete message error:', error.message);
      throw error;
    }
  }

  // Reactions
  static async addReaction(messageId, userId, reaction) {
    try {
      const result = await query(
        `INSERT INTO message_reactions (message_id, user_id, reaction)
         VALUES ($1, $2, $3)
         ON CONFLICT (message_id, user_id, reaction) DO NOTHING
         RETURNING *`,
        [messageId, userId, reaction]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Add reaction error:', error.message);
      throw error;
    }
  }

  static async removeReaction(messageId, userId, reaction) {
    try {
      await query(
        'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND reaction = $3',
        [messageId, userId, reaction]
      );
      return { success: true };
    } catch (error) {
      logger.error('Remove reaction error:', error.message);
      throw error;
    }
  }
}

module.exports = MessageService;
