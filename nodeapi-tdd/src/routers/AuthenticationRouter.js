const express = require('express');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const UserService = require('../services/UserService');
const TokenService = require('../services/TokenService');
const AuthenticationException = require('../exceptions/AuthenticationException');
const ForbiddenException = require('../exceptions/ForbiddenException');

const router = express.Router();

// Authenticate a user in the system
router.post(
  '/api/v1.0/auth',
  check('email').isEmail(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AuthenticationException());
    }

    const { email, password } = req.body;
    const user = await UserService.findByEmail(email);
    if (!user) {
      return next(new AuthenticationException());
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return next(new AuthenticationException());
    }
    if (user.inactive) {
      return next(new ForbiddenException());
    }

    const token = await TokenService.createToken(user);
    res.send({
      id: user.id,
      username: user.username,
      token,
    });
  }
);

module.exports = router;
