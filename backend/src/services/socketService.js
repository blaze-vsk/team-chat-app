const logger = require('../utils/logger');
const MessageService = require('./messageService');
const UserService = require('./userService');

class SocketService {
  static setupSocketHandlers(io) {
    // Store active connections
    const activeConnections = new Map();

    io.on('connection', (socket) => {
      const userId = socket.handshake.auth.userId;
      logger.info(`User ${userId} connected via WebSocket`);

      // Track active connection
      if (userId) {
        activeConnections.set(userId, socket.id);
        socket.emit('connection_established', { message: 'Connected to chat server' });
      }

      // Join team room
      socket.on('join_team', ({ teamId }) => {
        socket.join(`team:${teamId}`);
        logger.info(`User ${userId} joined team ${teamId}`);
        socket.to(`team:${teamId}`).emit('member_joined', {
          userId,
          teamId,
          timestamp: new Date()
        });
      });

      // Leave team room
      socket.on('leave_team', ({ teamId }) => {
        socket.leave(`team:${teamId}`);
        logger.info(`User ${userId} left team ${teamId}`);
        socket.to(`team:${teamId}`).emit('member_left', {
          userId,
          teamId,
          timestamp: new Date()
        });
      });

      // Send message
      socket.on('send_message', async ({ teamId, content, type = 'text' }) => {
        try {
          const message = await MessageService.saveMessage(teamId, userId, content, type);
          
          io.to(`team:${teamId}`).emit('message_received', {
            id: message.id,
            content: message.content,
            sender: {
              id: message.sender_id,
              username: message.sender.username,
              avatar_url: message.sender.avatar_url
            },
            teamId,
            type,
            created_at: message.created_at
          });

          logger.info(`Message sent to team ${teamId}`);
        } catch (error) {
          logger.error('Send message error:', error.message);
          socket.emit('error_response', { message: 'Failed to send message' });
        }
      });

      // User typing
      socket.on('typing', ({ teamId }) => {
        socket.to(`team:${teamId}`).emit('user_typing', {
          userId,
          teamId
        });
      });

      // Stop typing
      socket.on('stop_typing', ({ teamId }) => {
        socket.to(`team:${teamId}`).emit('user_stopped_typing', {
          userId,
          teamId
        });
      });

      // User online status
      socket.on('user_online', async () => {
        try {
          await UserService.updateUserStatus(userId, 'online');
          io.emit('user_status_changed', {
            userId,
            status: 'online'
          });
        } catch (error) {
          logger.error('Update online status error:', error.message);
        }
      });

      // User offline status
      socket.on('disconnect', async () => {
        try {
          await UserService.updateUserStatus(userId, 'offline');
          activeConnections.delete(userId);
          io.emit('user_status_changed', {
            userId,
            status: 'offline'
          });
          logger.info(`User ${userId} disconnected`);
        } catch (error) {
          logger.error('Update offline status error:', error.message);
        }
      });

      // Error handling
      socket.on('error', (error) => {
        logger.error('Socket error:', error);
      });
    });
  }
}

module.exports = SocketService;
