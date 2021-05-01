const express = require('express');
const UserRouter = require('./routers/UserRouter');

// Create app
const app = express();

// Setup middleware
app.use(express.json());
app.use(UserRouter);

module.exports = app;
