const app = require('./src/app');
const sequelize = require('./src/config/database');

// Synchronize the ORM with database
sequelize.sync();

// Start listening on port 3000
app.listen(3000, () => console.log('Express REST API Running!'));
