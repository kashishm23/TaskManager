const mysql = require('mysql2/promise');
const { sequelize } = require('../models');
require('dotenv').config();

async function syncDatabase() {
  console.log('[Database Sync]: Starting synchronization process...');

  let connection;
  try {
    // 1. Connect directly to MySQL server without selecting a database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('[Database Sync]: Connected to MySQL server.');

    // 2. Create the database if it doesn't already exist
    const dbName = process.env.DB_NAME || 'team_task_manager';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`[Database Sync]: Database "${dbName}" checked/created.`);
  } catch (error) {
    console.error('[Database Sync Error]: Failed to create database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }

  try {
    // 3. Connect via Sequelize and sync all defined models (creates tables & foreign keys)
    // Using { alter: true } matches models changes with MySQL tables structure
    await sequelize.sync({ alter: true });
    console.log('[Database Sync]: Sequelize models synced successfully. All tables created.');
    process.exit(0);
  } catch (error) {
    console.error('[Database Sync Error]: Failed to sync models with database:', error.message);
    process.exit(1);
  }
}

syncDatabase();
