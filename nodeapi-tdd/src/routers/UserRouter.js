const UserService = require('../services/UserService');
const { check, validationResult } = require('express-validator');
const ValidationException = require('../exceptions/ValidationException');

const express = require('express');

// Create router object
const router = express.Router();

// Implement routes
router.post(
  '/api/v1.0/users',
  check('username')
    .notEmpty()
    .withMessage('username_null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('username_size'),
  check('email')
    .notEmpty()
    .withMessage('email_null')
    .bail()
    .isEmail()
    .withMessage('email_invalid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error('email_in_use');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('password_null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('password_size')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('password_pattern'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }

    try {
      // Save the user
      await UserService.save(req.body);

      // Return success message
      return res.send({ message: req.t('user_create_success') });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/api/v1.0/users/token/:token', async (req, res, next) => {
  const token = req.params.token;
  try {
    // Activate the user
    await UserService.activate(token);

    // Return success
    return res.send({ message: req.t('account_activation_success') });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
