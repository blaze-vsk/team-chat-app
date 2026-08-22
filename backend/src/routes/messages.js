const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const MessageService = require('../services/messageService');
const logger = require('../utils/logger');

// Get messages in a channel
router.get('/channel/:channelId', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const messages = await MessageService.getMessages(
      req.params.channelId,
      parseInt(limit),
      parseInt(offset)
    );
    res.json(messages);
  } catch (error) {
    logger.error('Get channel messages error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Edit message
router.put('/:messageId', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await MessageService.editMessage(req.params.messageId, req.user.id, content);
    res.json(message);
  } catch (error) {
    logger.error('Edit message error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Delete message
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    const result = await MessageService.deleteMessage(req.params.messageId, req.user.id);
    res.json(result);
  } catch (error) {
    logger.error('Delete message error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Add reaction
router.post('/:messageId/reaction', authMiddleware, async (req, res) => {
  try {
    const { reaction } = req.body;
    const result = await MessageService.addReaction(req.params.messageId, req.user.id, reaction);
    res.json(result);
  } catch (error) {
    logger.error('Add reaction error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Remove reaction
router.delete('/:messageId/reaction', authMiddleware, async (req, res) => {
  try {
    const { reaction } = req.body;
    const result = await MessageService.removeReaction(req.params.messageId, req.user.id, reaction);
    res.json(result);
  } catch (error) {
    logger.error('Remove reaction error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
