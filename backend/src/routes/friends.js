const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const FriendService = require('../services/friendService');
const logger = require('../utils/logger');

// Get friend list
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const friends = await FriendService.getFriends(req.user.id);
    res.json(friends);
  } catch (error) {
    logger.error('Get friends error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Search users and show relationship status
router.get('/search/:term', authMiddleware, async (req, res) => {
  try {
    const users = await FriendService.searchUsers(req.user.id, req.params.term);
    res.json(users);
  } catch (error) {
    logger.error('Search users error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get incoming and outgoing requests
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await FriendService.getFriendRequests(req.user.id);
    res.json(requests);
  } catch (error) {
    logger.error('Get friend requests error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Send friend request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const result = await FriendService.sendFriendRequest(req.user.id, receiverId);
    res.json(result);
  } catch (error) {
    logger.error('Send friend request error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Accept friend request
router.post('/request/:requestId/accept', authMiddleware, async (req, res) => {
  try {
    const result = await FriendService.acceptFriendRequest(req.user.id, req.params.requestId);
    res.json(result);
  } catch (error) {
    logger.error('Accept friend request error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Reject friend request
router.post('/request/:requestId/reject', authMiddleware, async (req, res) => {
  try {
    const result = await FriendService.rejectFriendRequest(req.user.id, req.params.requestId);
    res.json(result);
  } catch (error) {
    logger.error('Reject friend request error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Cancel friend request
router.post('/request/:requestId/cancel', authMiddleware, async (req, res) => {
  try {
    const result = await FriendService.cancelFriendRequest(req.user.id, req.params.requestId);
    res.json(result);
  } catch (error) {
    logger.error('Cancel friend request error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Remove friend
router.delete('/:friendId', authMiddleware, async (req, res) => {
  try {
    const result = await FriendService.removeFriend(req.user.id, req.params.friendId);
    res.json(result);
  } catch (error) {
    logger.error('Remove friend error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
