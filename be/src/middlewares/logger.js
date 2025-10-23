const winston = require('winston');
const morgan = require('morgan');
const config = require('../config/env');

// Create Winston logger
const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Morgan middleware for HTTP logging
const httpLogger = morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
});

module.exports = logger;
module.exports.httpLogger = httpLogger;
