const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const User = require('../models/User');
const sequelize = require('../config/database');
const EmailService = require('./EmailService');
const EmailException = require('../exceptions/EmailException');
const InvalidTokenException = require('../exceptions/InvalidTokenException');
const NotFoundException = require('../exceptions/NotFoundException');

const { randomString } = require('../shared/generator');

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
    activationToken: randomString(16),
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
const getUsers = async (page, size, authenticatedUser) => {
  const usersWithCount = await User.findAndCountAll({
    where: {
      inactive: false,
      id: {
        [Sequelize.Op.not]: authenticatedUser ? authenticatedUser.id : 0,
      },
    },
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

// Get an user in the system
const getUser = async (id) => {
  const user = await User.findOne({
    where: {
      id: id,
      inactive: false,
    },
    attributes: ['id', 'username', 'email'],
  });
  if (!user) {
    throw new NotFoundException('user_not_found');
  }
  return user;
};

// Update an user in the system
const updateUser = async (id, updatedBody) => {
  const user = await User.findOne({ where: { id: id } });
  user.username = updatedBody.username;
  await user.save();
};

// Delete an user in the system
const deleteUser = async (id) => {
  await User.destroy({ where: { id: id } });
};

// Reset user password
const passwordResetRequest = async (email) => {
  const user = await findByEmail(email);
  if (!user) {
    throw new NotFoundException('email_not_in_use');
  }
  user.passwordResetToken = randomString(16);
  await user.save();
};

module.exports = {
  save,
  findByEmail,
  activate,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  passwordResetRequest,
};
