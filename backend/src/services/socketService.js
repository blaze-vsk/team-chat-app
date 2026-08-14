const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const MessageService = require('./messageService');
const TeamService = require('./teamService');
const UserService = require('./userService');

const MESSAGE_TYPES = new Set(['text', 'file', 'image']);

class SocketService {
  static setupSocketHandlers(io) {
    const activeConnections = new Map();

    io.use((socket, next) => {
      const header = socket.handshake.headers.authorization;
      const token = socket.handshake.auth?.token || (header?.startsWith('Bearer ') ? header.slice(7) : null);

      if (!token) return next(new Error('Authentication required'));

      try {
        socket.user = jwt.verify(token, process.env.JWT_SECRET);
        return next();
      } catch {
        return next(new Error('Invalid or expired token'));
      }
    });

    io.on('connection', (socket) => {
      const userId = socket.user.id;
      const sockets = activeConnections.get(userId) || new Set();
      sockets.add(socket.id);
      activeConnections.set(userId, sockets);
      socket.emit('connection_established', { message: 'Connected to chat server' });

      const reply = (acknowledge, payload) => {
        if (typeof acknowledge === 'function') acknowledge(payload);
      };

      const ensureTeamAccess = async (teamId) => {
        if (typeof teamId !== 'string' || !teamId) {
          const error = new Error('A valid team ID is required');
          error.status = 400;
          throw error;
        }
        await TeamService.assertMember(teamId, userId);
      };

      socket.on('join_team', async ({ teamId } = {}, acknowledge) => {
        try {
          await ensureTeamAccess(teamId);
          await socket.join(`team:${teamId}`);
          socket.to(`team:${teamId}`).emit('member_joined', { userId, teamId, timestamp: new Date() });
          reply(acknowledge, { success: true });
        } catch (error) {
          logger.warn('Socket join denied', { userId, teamId, message: error.message });
          socket.emit('error_response', { message: error.message });
          reply(acknowledge, { success: false, error: error.message });
        }
      });

      socket.on('leave_team', async ({ teamId } = {}, acknowledge) => {
        try {
          await ensureTeamAccess(teamId);
          await socket.leave(`team:${teamId}`);
          socket.to(`team:${teamId}`).emit('member_left', { userId, teamId, timestamp: new Date() });
          reply(acknowledge, { success: true });
        } catch (error) {
          socket.emit('error_response', { message: error.message });
          reply(acknowledge, { success: false, error: error.message });
        }
      });

      socket.on('send_message', async ({ teamId, content, type = 'text' } = {}, acknowledge) => {
        try {
          await ensureTeamAccess(teamId);
          if (typeof content !== 'string' || !content.trim() || content.trim().length > 5000) {
            throw new Error('Message content must be between 1 and 5000 characters');
          }
          if (!MESSAGE_TYPES.has(type)) throw new Error('Unsupported message type');

          const message = await MessageService.saveMessage(teamId, userId, content.trim(), type);
          io.to(`team:${teamId}`).emit('message_received', {
            ...message,
            username: message.sender.username,
            avatar_url: message.sender.avatar_url
          });
          reply(acknowledge, { success: true, messageId: message.id });
        } catch (error) {
          logger.warn('Socket message denied', { userId, teamId, message: error.message });
          socket.emit('error_response', { message: error.message });
          reply(acknowledge, { success: false, error: error.message });
        }
      });

      for (const eventName of ['typing', 'stop_typing']) {
        socket.on(eventName, async ({ teamId } = {}) => {
          try {
            await ensureTeamAccess(teamId);
            socket.to(`team:${teamId}`).emit(
              eventName === 'typing' ? 'user_typing' : 'user_stopped_typing',
              { userId, teamId }
            );
          } catch (error) {
            socket.emit('error_response', { message: error.message });
          }
        });
      }

      socket.on('user_online', async () => {
        try {
          await UserService.updateUserStatus(userId, 'online');
          io.emit('user_status_changed', { userId, status: 'online' });
        } catch (error) {
          logger.error('Update online status error', { message: error.message });
        }
      });

      socket.on('disconnect', async () => {
        const userSockets = activeConnections.get(userId);
        userSockets?.delete(socket.id);
        if (userSockets?.size) return;
        activeConnections.delete(userId);

        try {
          await UserService.updateUserStatus(userId, 'offline');
          io.emit('user_status_changed', { userId, status: 'offline' });
        } catch (error) {
          logger.error('Update offline status error', { message: error.message });
        }
      });
    });
  }
}

module.exports = SocketService;
