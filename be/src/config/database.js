const mysql = require('mysql2/promise');
const config = require('./env');
const logger = require('../middlewares/logger');

let pool;

const createPool = () => {
  pool = mysql.createPool(config.db);
  logger.info('Database pool created');
  return pool;
};

const getPool = () => {
  if (!pool) {
    return createPool();
  }
  return pool;
};

const testConnection = async () => {
  try {
    const connection = await getPool().getConnection();
    logger.info('Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = {
  getPool,
  createPool,
  testConnection
};
