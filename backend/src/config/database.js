const { Sequelize } = require('sequelize');
require('dotenv').config();

const DB_NAME = process.env.MYSQLDATABASE || process.env.DB_NAME;
const DB_USER = process.env.MYSQLUSER || process.env.DB_USER;
const DB_PASSWORD = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD;
const DB_HOST = process.env.MYSQLHOST || process.env.DB_HOST;
const DB_PORT = process.env.MYSQLPORT || process.env.DB_PORT || 3306;

const sequelize = new Sequelize(
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (msg) => console.log(`[Sequelize]: ${msg}`) : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // Useful for some production environments / SSL config if needed
    }
  }
);

module.exports = sequelize;
