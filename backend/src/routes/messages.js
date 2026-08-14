const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const MessageService = require('../services/messageService');
const { editMessageValidator } = require('../middleware/validation');
const logger = require('../utils/logger');

router.use(authMiddleware);

const sendError = (res, error) => {
  logger.error('Message request failed', { message: error.message });
  return res.status(error.status || 400).json({ error: error.message });
};

router.get('/team/:teamId', async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const requestedOffset = Number.parseInt(req.query.offset, 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
    const offset = Number.isFinite(requestedOffset) ? Math.max(requestedOffset, 0) : 0;
    const messages = await MessageService.getMessages(req.params.teamId, req.user.id, limit, offset);
    res.json(messages);
  } catch (error) {
    sendError(res, error);
  }
});

router.put('/:messageId', editMessageValidator, async (req, res) => {
  try {
    const message = await MessageService.editMessage(req.params.messageId, req.user.id, req.body.content.trim());
    res.json(message);
  } catch (error) {
    sendError(res, error);
  }
});

router.delete('/:messageId', async (req, res) => {
  try {
    res.json(await MessageService.deleteMessage(req.params.messageId, req.user.id));
  } catch (error) {
    sendError(res, error);
  }
});

module.exports = router;
