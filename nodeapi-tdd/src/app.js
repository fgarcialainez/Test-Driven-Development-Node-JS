const express = require('express');
const bcrypt = require('bcrypt')
const User = require('./models/User');

// Create app
const app = express();

// Setup middleware
app.use(express.json());

// Implement routes
app.post('/api/v1.0/users', (req, res) => {
  // Hash the password
  bcrypt.hash(req.body.password, 10).then((hash) => {
    // Create the user object
    const user = Object.assign({}, req.body, { password: hash });

    // Save the user to the database
    User.create(user).then(() => {
      return res.status(200).send({ message: 'User created' });
    });
  });
});

module.exports = app;
