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

// Update profile
router.put('/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { username, display_name, status_message, avatar_url, status } = req.body;
    
    let user = await UserService.updateUserProfile(
      req.params.userId,
      username,
      display_name,
      status_message,
      avatar_url
    );

    if (status) {
      await UserService.updateUserStatus(req.params.userId, status);
      user.status = status;
    }

    res.json(user);
  } catch (error) {
    logger.error('Update profile error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
