const app = require('./src/app');
const sequelize = require('./src/config/database');
const TokenService = require('./src/services/TokenService');
const logger = require('./src/shared/logger');
const FileService = require('./src/services/FileService');

// Synchronize the ORM with database
sequelize.sync();

// Clean tokens
TokenService.scheduleCleanup();

// Cleanup attachments
FileService.removeUnusedAttachments();

// Start listening on port 3000
app.listen(process.env.PORT || 3000, () =>
  logger.info('app is running. version: ' + process.env.npm_package_version)
);
