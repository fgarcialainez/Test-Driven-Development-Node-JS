const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const sequelize = require('../config/database');
const EmailService = require('./EmailService');
const EmailException = require('../exceptions/EmailException');
const InvalidTokenException = require('../exceptions/InvalidTokenException');

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
  const transaction = await sequelize.transaction();
  await User.create(user, { transaction });

  try {
    // Send the activation token by email
    await EmailService.sendAccountActivation(email, user.activationToken);
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw new EmailException();
  }
};

// Find a user by email
const findByEmail = async (email) => {
  return await User.findOne({ where: { email: email } });
};

// Activate a user in the system
const activate = async (token) => {
  const user = await User.findOne({ where: { activationToken: token } });
  if (!user) {
    throw new InvalidTokenException();
  }
  user.inactive = false;
  user.activationToken = null;
  await user.save();
};

// Get active users in the system
const getUsers = async (page, size) => {
  const usersWithCount = await User.findAndCountAll({
    where: { inactive: false },
    attributes: ['id', 'username', 'email'],
    limit: size,
    offset: page * size,
  });

  return {
    content: usersWithCount.rows,
    page: page,
    size: size,
    totalPages: Math.ceil(usersWithCount.count / size),
  };
};

module.exports = { save, findByEmail, activate, getUsers };
