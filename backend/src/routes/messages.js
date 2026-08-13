const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const MessageService = require('../services/messageService');
const { sendMessageValidator } = require('../middleware/validation');
const logger = require('../utils/logger');

// Get messages in a team
router.get('/team/:teamId', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const messages = await MessageService.getMessages(
      req.params.teamId,
      parseInt(limit),
      parseInt(offset)
    );
    res.json(messages);
  } catch (error) {
    logger.error('Get messages error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Edit message
router.put('/:messageId', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await MessageService.editMessage(req.params.messageId, content);
    res.json(message);
  } catch (error) {
    logger.error('Edit message error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Delete message
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    await MessageService.deleteMessage(req.params.messageId);
    res.json({ message: 'Message deleted' });
  } catch (error) {
    logger.error('Delete message error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
