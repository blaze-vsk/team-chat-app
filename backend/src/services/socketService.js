const logger = require('../utils/logger');
const MessageService = require('./messageService');
const ConversationService = require('./conversationService');
const UserService = require('./userService');
const NotificationService = require('./notificationService');
const { query } = require('../config/database');
const jwt = require('jsonwebtoken');

// Map of userId -> Set of socketIds (handling multiple tabs/devices)
const userSockets = new Map();

// Helper to format reactions into { emoji: [userIds] }
async function getReactionsDict(messageId) {
  try {
    const res = await query(
      'SELECT reaction, user_id FROM message_reactions WHERE message_id = $1',
      [messageId]
    );
    const dict = {};
    res.rows.forEach((row) => {
      if (!dict[row.reaction]) {
        dict[row.reaction] = [];
      }
      dict[row.reaction].push(row.user_id);
    });
    return dict;
  } catch (err) {
    logger.error('Failed to get reactions dict:', err.message);
    return {};
  }
}

class SocketService {
  static setupSocketHandlers(io) {
    io.on('connection', async (socket) => {
      let userId = socket.handshake.auth.userId;
      const token = socket.handshake.auth.token;

      // Secure JWT token decoding
      if (!userId && token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey123');
          userId = decoded.id;
        } catch (err) {
          logger.error('Socket JWT verification failed:', err.message);
        }
      }

      if (!userId) {
        logger.warn('Socket connection request without authenticated userId');
        return;
      }

      logger.info(`User ${userId} connected via WebSocket (Socket: ${socket.id})`);

      // Register socket mapping
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      // Instantly mark user as online & broadcast
      try {
        await UserService.updateUserStatus(userId, 'online');
        io.emit('user_status_changed', { userId, status: 'online' });
      } catch (err) {
        logger.error('Failed to set online status:', err.message);
      }

      // --- Channels Handling ---
      socket.on('join_channel', ({ channelId }) => {
        socket.join(`channel:${channelId}`);
        logger.info(`User ${userId} joined channel ${channelId}`);
      });

      socket.on('leave_channel', ({ channelId }) => {
        socket.leave(`channel:${channelId}`);
        logger.info(`User ${userId} left channel ${channelId}`);
      });

      socket.on('send_channel_message', async ({ teamId, channelId, content, fileData = null, replyToId = null }) => {
        try {
          const message = await MessageService.saveMessage(teamId, channelId, userId, content, 'text', fileData, replyToId);
          
          const payload = {
            id: message.id,
            channel_id: channelId,
            sender_id: userId,
            username: message.sender.username,
            content: message.content,
            created_at: message.created_at,
            reactions: {},
            file_data: fileData ? {
              fileName: fileData.fileName,
              fileSize: fileData.fileSize,
              fileUrl: fileData.fileUrl,
              mimeType: fileData.mimeType || fileData.fileType
            } : null
          };

          io.to(`channel:${channelId}`).emit('new_message', payload);
          logger.info(`Message sent to channel ${channelId}`);
        } catch (error) {
          logger.error('Send channel message error:', error.message);
          socket.emit('error_response', { message: 'Failed to send message' });
        }
      });

      // --- Direct Message (DM) Handling ---
      socket.on('join_dm', ({ conversationId }) => {
        socket.join(`conversation:${conversationId}`);
        logger.info(`User ${userId} joined DM conversation ${conversationId}`);
      });

      socket.on('join_conversation', ({ conversationId }) => {
        socket.join(`conversation:${conversationId}`);
        logger.info(`User ${userId} joined DM conversation ${conversationId}`);
      });

      socket.on('leave_conversation', ({ conversationId }) => {
        socket.leave(`conversation:${conversationId}`);
        logger.info(`User ${userId} left DM conversation ${conversationId}`);
      });

      socket.on('send_dm_message', async ({ conversationId, content, fileData = null }) => {
        try {
          const message = await ConversationService.saveMessage(conversationId, userId, content, 'text', fileData);

          const payload = {
            id: message.id,
            conversation_id: conversationId,
            sender_id: userId,
            username: message.sender.username,
            content: message.content,
            created_at: message.created_at,
            reactions: {},
            file_data: fileData ? {
              fileName: fileData.fileName,
              fileSize: fileData.fileSize,
              fileUrl: fileData.fileUrl,
              mimeType: fileData.mimeType || fileData.fileType
            } : null
          };

          io.to(`conversation:${conversationId}`).emit('new_message', payload);

          // Find recipient and send notification
          const membersRes = await query(
            'SELECT user_id FROM conversation_members WHERE conversation_id = $1 AND user_id != $2',
            [conversationId, userId]
          );
          if (membersRes.rows.length > 0) {
            const recipientId = membersRes.rows[0].user_id;
            await NotificationService.createNotification(recipientId, userId, null, 'dm', `sent you a message`);
            
            const recipientSockets = userSockets.get(recipientId);
            if (recipientSockets) {
              recipientSockets.forEach((sid) => {
                io.to(sid).emit('notification_received', {
                  type: 'dm',
                  sender: userId,
                  content: `sent you a message`
                });
              });
            }
          }

          logger.info(`DM sent in conversation ${conversationId}`);
        } catch (error) {
          logger.error('Send DM error:', error.message);
          socket.emit('error_response', { message: 'Failed to send DM' });
        }
      });

      // --- Typing Indicators ---
      socket.on('typing', async ({ roomType, targetId, isTyping }) => {
        try {
          const userRes = await query('SELECT username FROM users WHERE id = $1', [userId]);
          if (userRes.rows.length > 0) {
            const username = userRes.rows[0].username;
            const roomName = roomType === 'channel' ? `channel:${targetId}` : `conversation:${targetId}`;
            socket.to(roomName).emit('user_typing', {
              username,
              roomType,
              targetId,
              isTyping
            });
          }
        } catch (err) {
          logger.error('Typing indicator error:', err.message);
        }
      });

      // --- Reactions ---
      socket.on('add_reaction', async ({ messageId, channelId, conversationId, reaction }) => {
        try {
          await MessageService.addReaction(messageId, userId, reaction);
          const reactions = await getReactionsDict(messageId);
          const payload = { messageId, reactions };
          
          if (channelId) {
            io.to(`channel:${channelId}`).emit('reaction_updated', payload);
          } else if (conversationId) {
            io.to(`conversation:${conversationId}`).emit('reaction_updated', payload);
          }
        } catch (error) {
          logger.error('Socket add reaction error:', error.message);
        }
      });

      socket.on('remove_reaction', async ({ messageId, channelId, conversationId, reaction }) => {
        try {
          await MessageService.removeReaction(messageId, userId, reaction);
          const reactions = await getReactionsDict(messageId);
          const payload = { messageId, reactions };
          
          if (channelId) {
            io.to(`channel:${channelId}`).emit('reaction_updated', payload);
          } else if (conversationId) {
            io.to(`conversation:${conversationId}`).emit('reaction_updated', payload);
          }
        } catch (error) {
          logger.error('Socket remove reaction error:', error.message);
        }
      });

      // --- Disconnect & Offline Status ---
      socket.on('disconnect', async () => {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(userId);
            try {
              await UserService.updateUserStatus(userId, 'offline');
              io.emit('user_status_changed', { userId, status: 'offline' });
              logger.info(`User ${userId} status set to offline (all sessions ended)`);
            } catch (err) {
              logger.error('Failed to set offline status on disconnect:', err.message);
            }
          }
        }
        logger.info(`Socket ${socket.id} disconnected`);
      });
    });
  }
}

module.exports = SocketService;
