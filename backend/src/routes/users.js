const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const UserService = require('../services/userService');
const { updateProfileValidator } = require('../middleware/validation');
const logger = require('../utils/logger');

router.use(authMiddleware);

const sendError = (res, error) => {
  logger.error('User request failed', { message: error.message });
  return res.status(error.status || 400).json({ error: error.message });
};

router.get('/me', async (req, res) => {
  try {
    res.json(await UserService.getUserById(req.user.id));
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/search/:term', async (req, res) => {
  try {
    res.json(await UserService.searchUsers(req.params.term));
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const user = req.user.id === req.params.userId
      ? await UserService.getUserById(req.user.id)
      : await UserService.getPublicUserById(req.params.userId);
    res.json(user);
  } catch (error) {
    sendError(res, error);
  }
});

router.put('/:userId', updateProfileValidator, async (req, res) => {
  if (req.user.id !== req.params.userId) return res.status(403).json({ error: 'Unauthorized' });
  try {
    res.json(await UserService.updateUserProfile(req.params.userId, req.body.username, req.body.avatar_url));
  } catch (error) {
    sendError(res, error);
  }
});

module.exports = router;
