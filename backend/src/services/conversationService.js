const { query } = require('../config/database');
const logger = require('../utils/logger');

class ConversationService {
  static async getOrCreateConversation(userId1, userId2) {
    try {
      // Check if conversation already exists
      const existingConv = await query(
        `SELECT cm1.conversation_id 
         FROM conversation_members cm1
         INNER JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
         WHERE cm1.user_id = $1 AND cm2.user_id = $2`,
        [userId1, userId2]
      );

      if (existingConv.rows.length > 0) {
        return existingConv.rows[0].conversation_id;
      }

      // Create new conversation
      const result = await query('INSERT INTO conversations DEFAULT VALUES RETURNING id');
      const convId = result.rows[0].id;

      // Add members
      await query(
        'INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)',
        [convId, userId1, userId2]
      );

      logger.info(`Conversation ${convId} created between ${userId1} and ${userId2}`);
      return convId;
    } catch (error) {
      logger.error('Get/Create conversation error:', error.message);
      throw error;
    }
  }

  static async getConversationsForUser(userId) {
    try {
      // Find all conversations the user is in, and fetch the OTHER member's details
      const result = await query(
        `SELECT c.id as conversation_id, u.id as user_id, u.username, u.display_name, u.avatar_url, u.status, u.status_message, u.last_seen
         FROM conversations c
         INNER JOIN conversation_members cm1 ON c.id = cm1.conversation_id
         INNER JOIN conversation_members cm2 ON c.id = cm2.conversation_id
         INNER JOIN users u ON cm2.user_id = u.id
         WHERE cm1.user_id = $1 AND cm2.user_id != $1`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Get user conversations error:', error.message);
      throw error;
    }
  }

  static async saveMessage(conversationId, senderId, content, type = 'text', fileData = null) {
    try {
      const result = await query(
        `INSERT INTO messages (conversation_id, sender_id, content, message_type)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [conversationId, senderId, content, type]
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

      // Add sender info
      const senderResult = await query(
        'SELECT id, username, display_name, avatar_url FROM users WHERE id = $1',
        [senderId]
      );
      message.sender = senderResult.rows[0];

      return message;
    } catch (error) {
      logger.error('Save conversation message error:', error.message);
      throw error;
    }
  }

  static async getMessages(conversationId, limit = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT m.*, u.username, u.display_name, u.avatar_url,
                ma.file_name, ma.file_size, ma.file_type, ma.file_url,
                (SELECT json_agg(json_build_object('reaction', mr.reaction, 'user_id', mr.user_id, 'username', ru.username))
                 FROM message_reactions mr
                 INNER JOIN users ru ON mr.user_id = ru.id
                 WHERE mr.message_id = m.id) as reactions
         FROM messages m
         INNER JOIN users u ON m.sender_id = u.id
         LEFT JOIN message_attachments ma ON m.id = ma.message_id
         WHERE m.conversation_id = $1
         ORDER BY m.created_at DESC
         LIMIT $2 OFFSET $3`,
        [conversationId, limit, offset]
      );

      return result.rows.reverse();
    } catch (error) {
      logger.error('Get conversation messages error:', error.message);
      throw error;
    }
  }
}

module.exports = ConversationService;
