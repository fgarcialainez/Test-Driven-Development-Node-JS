const UserService = require('../services/UserService');

const express = require('express');

// Create router object
const router = express.Router();

// Implement routes
router.post('/api/v1.0/users', async (req, res) => {
  // Validate the username
  const user = req.body;
  if (user.username === null) {
    return res.status(400).send({
      validationErrors: {
        username: 'Username can not be null',
      },
    });
  }

  // Save the user
  await UserService.save(req.body);

  // Return success message
  return res.status(200).send({ message: 'User created' });
});

module.exports = router;
