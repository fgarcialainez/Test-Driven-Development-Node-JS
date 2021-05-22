const express = require('express');
const router = express.Router();
const AuthenticationException = require('../exceptions/AuthenticationException');
const HoaxService = require('../services/HoaxService');
const { check, validationResult } = require('express-validator');
const ValidationException = require('../exceptions/ValidationException');

router.post(
  '/api/v1.0/hoaxes',
  check('content')
    .isLength({ min: 10, max: 5000 })
    .withMessage('hoax_content_size'),
  async (req, res, next) => {
    if (!req.authenticatedUser) {
      return next(new AuthenticationException('unauthorized_hoax_submit'));
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    await HoaxService.save(req.body);
    return res.send({ message: req.t('hoax_submit_success') });
  }
);

module.exports = router;
