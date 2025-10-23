const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const hash = async (text) => {
  return await bcrypt.hash(text, SALT_ROUNDS);
};

const compare = async (text, hashedText) => {
  return await bcrypt.compare(text, hashedText);
};

module.exports = {
  hash,
  compare
};
