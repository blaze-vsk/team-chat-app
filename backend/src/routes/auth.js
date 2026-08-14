const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const { registerValidator, loginValidator } = require('../middleware/validation');
const logger = require('../utils/logger');

const sendError = (res, event, error, fallbackStatus) => {
  logger.error(event, { message: error.message });
  return res.status(error.status || fallbackStatus).json({ error: error.message });
};

router.post('/register', registerValidator, async (req, res) => {
  try {
    const result = await AuthService.registerUser(req.body.username, req.body.email, req.body.password);
    res.status(201).json(result);
  } catch (error) {
    sendError(res, 'Register error', error, 400);
  }
});

router.post('/login', loginValidator, async (req, res) => {
  try {
    const result = await AuthService.loginUser(req.body.email, req.body.password);
    res.json(result);
  } catch (error) {
    sendError(res, 'Login error', error, 401);
  }
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
