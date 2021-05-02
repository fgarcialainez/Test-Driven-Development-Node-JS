const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const EmailService = require('./EmailService');

// Generate a random activation token
const generateToken = (length) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

// Creates a user in the system
const save = async (body) => {
  // Get body data
  const { username, email, password } = body;

  // Hash the password
  const hash = await bcrypt.hash(password, 10);

  // Create the user object
  const user = {
    username,
    email,
    password: hash,
    activationToken: generateToken(16),
  };

  // Save the user to the database
  await User.create(user);

  // Send the activation token by email
  await EmailService.sendAccountActivation(email, user.activationToken);
};

const findByEmail = async (email) => {
  return await User.findOne({ where: { email: email } });
};

module.exports = { save, findByEmail };
