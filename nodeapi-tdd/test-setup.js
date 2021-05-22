const FileAttachment = require('./src/models/FileAttachment');
const sequelize = require('./src/config/database');

beforeAll(async () => {
  if (process.env.NODE_ENV === 'test') {
    await sequelize.sync();
  }

  await FileAttachment.destroy({ truncate: true });
});
