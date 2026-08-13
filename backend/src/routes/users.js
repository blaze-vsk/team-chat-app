const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const UserService = require('../services/userService');
const logger = require('../utils/logger');

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await UserService.getUserById(req.user.id);
    res.json(user);
  } catch (error) {
    logger.error('Get current user error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const user = await UserService.getUserById(req.params.userId);
    res.json(user);
  } catch (error) {
    logger.error('Get user error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Search users
router.get('/search/:term', authMiddleware, async (req, res) => {
  try {
    const users = await UserService.searchUsers(req.params.term);
    res.json(users);
  } catch (error) {
    logger.error('Search users error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Update profile
router.put('/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { username, avatar_url } = req.body;
    const user = await UserService.updateUserProfile(req.params.userId, username, avatar_url);
    res.json(user);
  } catch (error) {
    logger.error('Update profile error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
