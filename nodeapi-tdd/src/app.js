const express = require('express');

const app = express();

// Implement routes
app.post('/api/v1.0/users', (req, res) => {
  return res.status(200).send({ message: 'User created' });
});

module.exports = app;
