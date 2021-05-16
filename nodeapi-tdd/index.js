const app = require('./src/app');
const sequelize = require('./src/config/database');
const TokenService = require('./src/services/TokenService');
const logger = require('./src/shared/logger');

// Synchronize the ORM with database
sequelize.sync();

// Clean tokens
TokenService.scheduleCleanup();

// Start listening on port 3000
logger.error('error');
logger.warn('warn');
logger.info('info');
logger.verbose('verbose');
logger.debug('debug');
logger.silly('silly');

app.listen(3000, () => logger.info('app is running!'));
