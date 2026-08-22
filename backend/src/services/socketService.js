const logger = require('../utils/logger');
const MessageService = require('./messageService');
const ConversationService = require('./conversationService');
const UserService = require('./userService');
const NotificationService = require('./notificationService');

// Map of userId -> Set of socketIds (handling multiple tabs/devices)
const userSockets = new Map();

class SocketService {
  static setupSocketHandlers(io) {
    io.on('connection', async (socket) => {
      const userId = socket.handshake.auth.userId;
      if (!userId) {
        logger.warn('Socket connection request without userId');
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

      socket.on('send_channel_message', async ({ teamId, channelId, content, type = 'text', fileData = null, replyToId = null }) => {
        try {
          const message = await MessageService.saveMessage(teamId, channelId, userId, content, type, fileData, replyToId);
          
          io.to(`channel:${channelId}`).emit('message_received', {
            ...message,
            channelId
          });

          // Send realtime notifications to all other members of the team who are online but not in the channel
          // To keep it simple, we can emit a global notification check to users' personal socket connections
          // In a real app we'd filter team members. Here we can send a targeted event.
          logger.info(`Message sent to channel ${channelId}`);
        } catch (error) {
          logger.error('Send channel message error:', error.message);
          socket.emit('error_response', { message: 'Failed to send message' });
        }
      });

      // --- Direct Message (DM) Handling ---
      socket.on('join_conversation', ({ conversationId }) => {
        socket.join(`conversation:${conversationId}`);
        logger.info(`User ${userId} joined DM conversation ${conversationId}`);
      });

      socket.on('leave_conversation', ({ conversationId }) => {
        socket.leave(`conversation:${conversationId}`);
        logger.info(`User ${userId} left DM conversation ${conversationId}`);
      });

      socket.on('send_dm', async ({ conversationId, recipientId, content, type = 'text', fileData = null, replyToId = null }) => {
        try {
          const message = await ConversationService.saveMessage(conversationId, userId, content, type, fileData);

          io.to(`conversation:${conversationId}`).emit('dm_received', {
            ...message,
            conversationId
          });

          // Create notification for recipient in DB
          await NotificationService.createNotification(recipientId, userId, null, 'dm', `sent you a message`);

          // Send realtime alert to recipient's individual sockets if they have active sessions
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

          logger.info(`DM sent in conversation ${conversationId}`);
        } catch (error) {
          logger.error('Send DM error:', error.message);
          socket.emit('error_response', { message: 'Failed to send DM' });
        }
      });

      // --- Typing Indicators ---
      socket.on('typing', ({ channelId, conversationId }) => {
        if (channelId) {
          socket.to(`channel:${channelId}`).emit('user_typing', { userId, channelId });
        } else if (conversationId) {
          socket.to(`conversation:${conversationId}`).emit('user_typing', { userId, conversationId });
        }
      });

      socket.on('stop_typing', ({ channelId, conversationId }) => {
        if (channelId) {
          socket.to(`channel:${channelId}`).emit('user_stopped_typing', { userId, channelId });
        } else if (conversationId) {
          socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', { userId, conversationId });
        }
      });

      // --- Reactions ---
      socket.on('add_reaction', async ({ messageId, channelId, conversationId, reaction }) => {
        try {
          await MessageService.addReaction(messageId, userId, reaction);
          
          const payload = { messageId, userId, reaction, action: 'add' };
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
          
          const payload = { messageId, userId, reaction, action: 'remove' };
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

      socket.on('error', (error) => {
        logger.error(`Socket error for user ${userId}:`, error.message);
      });
    });
  }
}

module.exports = SocketService;
