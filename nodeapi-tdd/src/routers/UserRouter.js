const UserService = require('../services/UserService');
const { check, validationResult } = require('express-validator');

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
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors.array().forEach((element) => {
        validationErrors[element.param] = req.t(element.msg);
      });

      return res.status(400).send({ validationErrors: validationErrors });
    }

    try {
      // Save the user
      await UserService.save(req.body);

      // Return success message
      return res.send({ message: req.t('user_create_success') });
    } catch (err) {
      // Return 502 error
      return res.status(502).send({ message: req.t(err.message) });
    }
  }
);

router.post('/api/v1.0/users/token/:token', async (req, res) => {
  const token = req.params.token;
  try {
    await UserService.activate(token);
  } catch (err) {
    return res.status(400).send({ message: req.t(err.message) });
  }
  res.send({ message: req.t('account_activation_success') });
});

module.exports = router;
