const UserService = require('../services/UserService');

const express = require('express');

// Create router object
const router = express.Router();

// Define validator functions
const validateUsername = (req, res, next) => {
  // Validate the username
  const user = req.body;
  if (user.username === null) {
    req.validationErrors = {
      username: 'Username can not be null',
    };
  }

  // Call next middleware
  next();
};

const validateEmail = (req, res, next) => {
  // Validate the email
  const user = req.body;
  if (user.email === null) {
    req.validationErrors = {
      ...req.validationErrors,
      email: 'Email can not be null',
    };
  }

  // Call next middleware
  next();
};

// Implement routes
router.post(
  '/api/v1.0/users',
  validateUsername,
  validateEmail,
  async (req, res) => {
    if (req.validationErrors) {
      const response = { validationErrors: { ...req.validationErrors } };
      return res.status(400).send(response);
    }

    // Save the user
    await UserService.save(req.body);

    // Return success message
    return res.status(200).send({ message: 'User created' });
  }
);

module.exports = router;
