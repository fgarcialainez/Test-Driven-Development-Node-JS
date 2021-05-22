const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Token = require('../models/Token');
const Hoax = require('../models/Hoax');

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
    image: {
      type: Sequelize.STRING,
    },
  },
  {
    sequelize,
    modelName: 'user',
  }
);

// Define relationships
User.hasMany(Token, { onDelete: 'cascade', foreignKey: 'userId' });
User.hasMany(Hoax, { onDelete: 'cascade', foreignKey: 'userId' });

Hoax.belongsTo(User);

module.exports = User;
