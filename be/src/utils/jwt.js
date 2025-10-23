const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const generateToken = (payload, role) => {
  const config = jwtConfig[role];
  if (!config) {
    throw new Error(`Invalid role: ${role}`);
  }
  
  return jwt.sign(payload, config.secret, {
    expiresIn: config.expiresIn
  });
};

const verifyToken = (token, role) => {
  const config = jwtConfig[role];
  if (!config) {
    throw new Error(`Invalid role: ${role}`);
  }
  
  return jwt.verify(token, config.secret);
};

module.exports = {
  generateToken,
  verifyToken
};
