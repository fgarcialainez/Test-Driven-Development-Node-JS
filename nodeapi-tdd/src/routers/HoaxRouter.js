const express = require('express');
const router = express.Router();
const AuthenticationException = require('../exceptions/AuthenticationException');

router.post('/api/v1.0/hoaxes', (req, res) => {
  if (req.authenticatedUser) {
    return res.send();
  }
  throw new AuthenticationException('unauthorized_hoax_submit');
});

module.exports = router;
