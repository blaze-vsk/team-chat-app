const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const { registerValidator, loginValidator } = require('../middleware/validation');
const logger = require('../utils/logger');

// Register
router.post('/register', registerValidator, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const result = await AuthService.registerUser(username, email, password);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Register error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', loginValidator, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.loginUser(email, password);
    res.json(result);
  } catch (error) {
    logger.error('Login error:', error.message);
    res.status(401).json({ error: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
