const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Token = require('../models/Token');

// Define User class
class User extends Sequelize.Model {}

// Initialize User model
User.init(
  {
    username: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    inactive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    activationToken: {
      type: Sequelize.STRING,
    },
    passwordResetToken: {
      type: Sequelize.STRING,
    },
  },
  {
    sequelize,
    modelName: 'user',
  }
);

// Define User - Token relationship
User.hasMany(Token, { onDelete: 'cascade', foreignKey: 'userId' });

module.exports = User;
