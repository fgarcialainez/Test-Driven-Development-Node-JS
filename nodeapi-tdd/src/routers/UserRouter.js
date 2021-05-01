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
    .withMessage('Username can not be null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('Must have min 4 and max 32 characters'),
  check('email')
    .notEmpty()
    .withMessage('Email can not be null')
    .bail()
    .isEmail()
    .withMessage('Email is not valid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error('Email is in use');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('Password can not be null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage(
      'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'
    ),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors.array().forEach((element) => {
        validationErrors[element.param] = element.msg;
      });

      return res.status(400).send({ validationErrors: validationErrors });
    }

    // Save the user
    await UserService.save(req.body);

    // Return success message
    return res.status(200).send({ message: 'User created' });
  }
);

module.exports = router;
