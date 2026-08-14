const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const toUser = (row) => ({
  id: row.id,
  username: row.username,
  email: row.email,
  avatar_url: row.avatar_url,
  status: row.status
});

const signToken = (user) => jwt.sign(
  { id: user.id, username: user.username, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

class AuthService {
  static async registerUser(username, email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const result = await query(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, username, email, avatar_url, status`,
        [username.trim(), normalizedEmail, passwordHash]
      );
      const user = toUser(result.rows[0]);
      return { user, token: signToken(user) };
    } catch (error) {
      if (error.code === '23505') {
        const duplicate = new Error('Username or email is already in use');
        duplicate.status = 409;
        throw duplicate;
      }
      throw error;
    }
  }

  static async loginUser(email, password) {
    const result = await query(
      `SELECT id, username, email, avatar_url, status, password_hash, is_active
       FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    );
    const account = result.rows[0];

    if (!account || !account.is_active || !(await bcrypt.compare(password, account.password_hash))) {
      const error = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }

    const user = toUser(account);
    return { user, token: signToken(user) };
  }
}

module.exports = AuthService;
