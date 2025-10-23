const config = require('./env');

module.exports = {
  customer: {
    secret: config.jwt.customerSecret,
    expiresIn: config.jwt.expiry
  },
  delivery: {
    secret: config.jwt.deliverySecret,
    expiresIn: config.jwt.expiry
  },
  admin: {
    secret: config.jwt.adminSecret,
    expiresIn: config.jwt.expiry
  }
};
