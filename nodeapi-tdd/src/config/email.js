const nodemailer = require('nodemailer');
const config = require('config');

// Load SMTP server configuration
const mailConfig = config.get('mail');

// Create the email transporter
const transporter = nodemailer.createTransport({ ...mailConfig });

module.exports = transporter;
