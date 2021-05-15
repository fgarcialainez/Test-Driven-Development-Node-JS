const UserService = require('../services/UserService');
const { check, validationResult } = require('express-validator');
const pagination = require('../middleware/pagination');
const ValidationException = require('../exceptions/ValidationException');
const ForbiddenException = require('../exceptions/ForbiddenException');
const FileService = require('../services/FileService');

const express = require('express');

// Create router object
const router = express.Router();

// Create a user in the system
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

// Implemented endpoint to activate a user in the system
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

// Retrieve users list endpoint
router.get('/api/v1.0/users', pagination, async (req, res) => {
  const authenticatedUser = req.authenticatedUser;
  const { page, size } = req.pagination;
  const users = await UserService.getUsers(page, size, authenticatedUser);
  res.send(users);
});

// Retrieve user endpoint
router.get('/api/v1.0/users/:id', async (req, res, next) => {
  try {
    const user = await UserService.getUser(req.params.id);
    res.send(user);
  } catch (err) {
    next(err);
  }
});

// Update user endpoint
router.put(
  '/api/v1.0/users/:id',
  check('username')
    .notEmpty()
    .withMessage('username_null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('username_size'),
  check('image').custom(async (imageAsBase64String) => {
    if (!imageAsBase64String) {
      return true;
    }
    const buffer = Buffer.from(imageAsBase64String, 'base64');
    if (!FileService.isLessThan2MB(buffer)) {
      throw new Error('profile_image_size');
    }

    const supportedType = await FileService.isSupportedFileType(buffer);
    if (!supportedType) {
      throw new Error('unsupported_image_file');
    }
    return true;
  }),
  async (req, res, next) => {
    const authenticatedUser = req.authenticatedUser;

    // eslint-disable-next-line eqeqeq
    if (!authenticatedUser || authenticatedUser.id != req.params.id) {
      return next(new ForbiddenException('unauthorized_user_update'));
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    const user = await UserService.updateUser(req.params.id, req.body);
    return res.send(user);
  }
);

// Delete user endpoint
router.delete('/api/v1.0/users/:id', async (req, res, next) => {
  const authenticatedUser = req.authenticatedUser;
  // eslint-disable-next-line eqeqeq
  if (!authenticatedUser || authenticatedUser.id != req.params.id) {
    return next(new ForbiddenException('unauthorized_user_delete'));
  }
  await UserService.deleteUser(req.params.id);
  res.send();
});

// Password reset endpoint
router.post(
  '/api/v1.0/user/password',
  check('email').isEmail().withMessage('email_invalid'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }

    try {
      await UserService.passwordResetRequest(req.body.email);
      return res.send({ message: req.t('password_reset_request_success') });
    } catch (err) {
      next(err);
    }
  }
);

// Update password endpoint
const passwordResetTokenValidator = async (req, res, next) => {
  const user = await UserService.findByPasswordResetToken(
    req.body.passwordResetToken
  );

  if (!user) {
    return next(new ForbiddenException('unauthorized_password_reset'));
  }
  next();
};

router.put(
  '/api/v1.0/user/password',
  passwordResetTokenValidator,
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

    await UserService.updatePassword(req.body);
    res.send();
  }
);

// Export the router
module.exports = router;
