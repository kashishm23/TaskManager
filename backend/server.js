const app = require('./src/app');
const sequelize = require('./src/config/database');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Authenticate with the database
    await sequelize.authenticate();
    console.log('[Database]: Connection to MySQL has been established successfully.');
  } catch (error) {
    console.error('[Database]: Unable to connect to the MySQL database:', error.message);
    console.log('[Warning]: Please ensure MySQL is running, matches the credentials in your .env file, and that the database exists.');
  }

  // Start listening for requests
  app.listen(PORT, () => {
    console.log(`[Server]: Server is running on port ${PORT}`);
    console.log(`[Server]: Access http://localhost:${PORT} to test the server.`);
  });
}

startServer();
