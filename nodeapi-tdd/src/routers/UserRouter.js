const UserService = require('../services/UserService');
const { check, validationResult } = require('express-validator');

const express = require('express');

// Create router object
const router = express.Router();

// Implement routes
router.post(
  '/api/v1.0/users',
  check('username').notEmpty().withMessage('Username can not be null'),
  check('email').notEmpty().withMessage('Email can not be null'),
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
