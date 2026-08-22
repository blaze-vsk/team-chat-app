const { query } = require('../config/database');
const logger = require('../utils/logger');
const NotificationService = require('./notificationService');

class FriendService {
  static async sendFriendRequest(senderId, receiverId) {
    try {
      if (senderId === receiverId) {
        throw new Error('You cannot send a friend request to yourself');
      }

      // Check if they are already friends
      const u1 = senderId < receiverId ? senderId : receiverId;
      const u2 = senderId < receiverId ? receiverId : senderId;
      const checkFriend = await query(
        'SELECT id FROM friends WHERE user_id1 = $1 AND user_id2 = $2',
        [u1, u2]
      );
      if (checkFriend.rows.length > 0) {
        throw new Error('You are already friends with this user');
      }

      // Check if request already exists
      const checkRequest = await query(
        `SELECT id, status FROM friend_requests 
         WHERE (sender_id = $1 AND receiver_id = $2) 
            OR (sender_id = $2 AND receiver_id = $1)`,
        [senderId, receiverId]
      );

      if (checkRequest.rows.length > 0) {
        const req = checkRequest.rows[0];
        if (req.status === 'pending') {
          throw new Error('A friend request is already pending between you two');
        } else {
          // If rejected/cancelled, we reset it to pending
          await query(
            'UPDATE friend_requests SET status = \'pending\', sender_id = $1, receiver_id = $2, created_at = CURRENT_TIMESTAMP WHERE id = $3',
            [senderId, receiverId, req.id]
          );
          // Push notification
          await NotificationService.createNotification(receiverId, senderId, null, 'friend_request', 'sent you a friend request');
          return { message: 'Friend request sent' };
        }
      }

      await query(
        `INSERT INTO friend_requests (sender_id, receiver_id, status)
         VALUES ($1, $2, 'pending')`,
        [senderId, receiverId]
      );

      // Create notification
      await NotificationService.createNotification(receiverId, senderId, null, 'friend_request', 'sent you a friend request');

      logger.info(`Friend request sent from ${senderId} to ${receiverId}`);
      return { message: 'Friend request sent successfully' };
    } catch (error) {
      logger.error('Send friend request error:', error.message);
      throw error;
    }
  }

  static async getFriendRequests(userId) {
    try {
      const incoming = await query(
        `SELECT fr.id as request_id, u.id as user_id, u.username, u.display_name, u.avatar_url, u.status, fr.created_at
         FROM friend_requests fr
         INNER JOIN users u ON fr.sender_id = u.id
         WHERE fr.receiver_id = $1 AND fr.status = 'pending'`,
        [userId]
      );

      const outgoing = await query(
        `SELECT fr.id as request_id, u.id as user_id, u.username, u.display_name, u.avatar_url, u.status, fr.created_at
         FROM friend_requests fr
         INNER JOIN users u ON fr.receiver_id = u.id
         WHERE fr.sender_id = $1 AND fr.status = 'pending'`,
        [userId]
      );

      return {
        incoming: incoming.rows,
        outgoing: outgoing.rows
      };
    } catch (error) {
      logger.error('Get friend requests error:', error.message);
      throw error;
    }
  }

  static async acceptFriendRequest(userId, requestId) {
    try {
      const requestResult = await query(
        'SELECT * FROM friend_requests WHERE id = $1 AND receiver_id = $2 AND status = \'pending\'',
        [requestId, userId]
      );

      if (requestResult.rows.length === 0) {
        throw new Error('Friend request not found or not pending');
      }

      const request = requestResult.rows[0];
      const senderId = request.sender_id;

      // Add to friends
      const u1 = senderId < userId ? senderId : userId;
      const u2 = senderId < userId ? userId : senderId;

      await query(
        `INSERT INTO friends (user_id1, user_id2)
         VALUES ($1, $2)
         ON CONFLICT (user_id1, user_id2) DO NOTHING`,
        [u1, u2]
      );

      // Update request status
      await query(
        'UPDATE friend_requests SET status = \'accepted\' WHERE id = $1',
        [requestId]
      );

      // Create notification for original sender
      await NotificationService.createNotification(senderId, userId, null, 'friend_accepted', 'accepted your friend request');

      logger.info(`Friend request accepted: ${senderId} and ${userId} are now friends`);
      return { message: 'Friend request accepted' };
    } catch (error) {
      logger.error('Accept friend request error:', error.message);
      throw error;
    }
  }

  static async rejectFriendRequest(userId, requestId) {
    try {
      const result = await query(
        'DELETE FROM friend_requests WHERE id = $1 AND receiver_id = $2 RETURNING sender_id',
        [requestId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Friend request not found');
      }

      logger.info(`Friend request ${requestId} rejected by ${userId}`);
      return { message: 'Friend request rejected' };
    } catch (error) {
      logger.error('Reject friend request error:', error.message);
      throw error;
    }
  }

  static async cancelFriendRequest(userId, requestId) {
    try {
      const result = await query(
        'DELETE FROM friend_requests WHERE id = $1 AND sender_id = $2',
        [requestId, userId]
      );

      if (result.rowCount === 0) {
        throw new Error('Friend request not found');
      }

      logger.info(`Friend request ${requestId} cancelled by ${userId}`);
      return { message: 'Friend request cancelled' };
    } catch (error) {
      logger.error('Cancel friend request error:', error.message);
      throw error;
    }
  }

  static async removeFriend(userId, friendId) {
    try {
      const u1 = userId < friendId ? userId : friendId;
      const u2 = userId < friendId ? friendId : userId;

      await query(
        'DELETE FROM friends WHERE user_id1 = $1 AND user_id2 = $2',
        [u1, u2]
      );

      // Delete request history too
      await query(
        `DELETE FROM friend_requests 
         WHERE (sender_id = $1 AND receiver_id = $2) 
            OR (sender_id = $2 AND receiver_id = $1)`,
        [userId, friendId]
      );

      logger.info(`Friendship removed between ${userId} and ${friendId}`);
      return { message: 'Friend removed successfully' };
    } catch (error) {
      logger.error('Remove friend error:', error.message);
      throw error;
    }
  }

  static async getFriends(userId) {
    try {
      const result = await query(
        `SELECT u.id, u.username, u.display_name, u.avatar_url, u.status, u.status_message, u.last_seen
         FROM friends f
         INNER JOIN users u ON (f.user_id1 = u.id AND f.user_id2 = $1) OR (f.user_id2 = u.id AND f.user_id1 = $1)
         WHERE u.id != $1`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Get friends error:', error.message);
      throw error;
    }
  }

  static async searchUsers(userId, searchTerm) {
    try {
      const result = await query(
        `SELECT u.id, u.username, u.display_name, u.avatar_url, u.status,
           (SELECT status FROM friend_requests WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1) LIMIT 1) as request_status,
           (SELECT sender_id FROM friend_requests WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1) LIMIT 1) as request_sender_id,
           EXISTS(SELECT 1 FROM friends WHERE (user_id1 = $1 AND user_id2 = u.id) OR (user_id1 = u.id AND user_id2 = $1)) as is_friend
         FROM users u
         WHERE u.id != $1 AND (u.username ILIKE $2 OR u.display_name ILIKE $2 OR u.email ILIKE $2)
         LIMIT 20`,
        [userId, `%${searchTerm}%`]
      );
      return result.rows;
    } catch (error) {
      logger.error('Search users error:', error.message);
      throw error;
    }
  }
}

module.exports = FriendService;
