const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return next();
};

const registerValidator = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3 to 50 characters'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 12, max: 128 }).withMessage('Password must be 12 to 128 characters'),
  validate
];

const loginValidator = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isString().notEmpty().withMessage('Password is required'),
  validate
];

const createTeamValidator = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Team name must be 1 to 100 characters'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }),
  validate
];

const editMessageValidator = [
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Message content must be 1 to 5000 characters'),
  validate
];

const updateProfileValidator = [
  body('username').optional().trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3 to 50 characters'),
  body('avatar_url').optional({ values: 'falsy' }).isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('Avatar URL must use HTTPS'),
  validate
];

module.exports = {
  registerValidator,
  loginValidator,
  createTeamValidator,
  editMessageValidator,
  updateProfileValidator,
  validate
};
