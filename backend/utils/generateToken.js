const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET tidak ditemukan');
  }

  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRE || '24h'
    }
  );
};

module.exports = generateToken;