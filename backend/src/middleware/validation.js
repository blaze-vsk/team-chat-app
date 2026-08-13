const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const registerValidator = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
];

const loginValidator = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const createTeamValidator = [
  body('name').isLength({ min: 1 }).withMessage('Team name is required'),
  body('description').optional().isString(),
  validate
];

const sendMessageValidator = [
  body('content').isLength({ min: 1 }).withMessage('Message content is required'),
  body('type').optional().isIn(['text', 'file', 'image']),
  validate
];

module.exports = {
  registerValidator,
  loginValidator,
  createTeamValidator,
  sendMessageValidator,
  validate
};
