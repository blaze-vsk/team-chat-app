const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ConversationService = require('../services/conversationService');
const logger = require('../utils/logger');

// Get active DM conversation list for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const list = await ConversationService.getConversationsForUser(req.user.id);
    res.json(list);
  } catch (error) {
    logger.error('Get conversations error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Create or retrieve conversation ID for target recipient user
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const conversationId = await ConversationService.getOrCreateConversation(req.user.id, recipientId);
    res.json({ conversationId });
  } catch (error) {
    logger.error('Get/Create conversation error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get messages for conversation
router.get('/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const messages = await ConversationService.getMessages(
      req.params.conversationId,
      parseInt(limit),
      parseInt(offset)
    );
    res.json(messages);
  } catch (error) {
    logger.error('Get conversation messages error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
