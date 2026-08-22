const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class AuthService {
  static async registerUser(username, email, password) {
    try {
      // Check if user exists
      const existingUser = await query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
      if (existingUser.rows.length > 0) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Insert user
      const result = await query(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, username, email, avatar_url, status`,
        [username, email, passwordHash]
      );

      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'supersecretjwtkey123', {
        expiresIn: '24h'
      });

      logger.info(`User ${user.username} registered successfully`);
      return { user, token };
    } catch (error) {
      logger.error('Registration service error:', error.message);
      throw error;
    }
  }

  static async loginUser(email, password) {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw new Error('Invalid email or password');
      }

      const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'supersecretjwtkey123', {
        expiresIn: '24h'
      });

      logger.info(`User ${user.username} logged in successfully`);

      // Remove sensitive data
      delete user.password_hash;
      return { user, token };
    } catch (error) {
      logger.error('Login service error:', error.message);
      throw error;
    }
  }
}

module.exports = AuthService;
