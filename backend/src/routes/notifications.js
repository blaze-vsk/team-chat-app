const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const NotificationService = require('../services/notificationService');
const logger = require('../utils/logger');

// List notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await NotificationService.getNotifications(req.user.id);
    res.json(notifications);
  } catch (error) {
    logger.error('List notifications error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Mark single as read
router.post('/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    const result = await NotificationService.markAsRead(req.user.id, req.params.notificationId);
    res.json(result);
  } catch (error) {
    logger.error('Mark notification read error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Mark all as read
router.post('/read-all', authMiddleware, async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user.id);
    res.json(result);
  } catch (error) {
    logger.error('Mark all notifications read error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
