const Sequelize = require('sequelize');

const sequelize = new Sequelize('nodeapi-tdd', 'my-db-user', 'my-db-p4wd', {
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

module.exports = sequelize;
