const jwt = require('jsonwebtoken');

// JWT 密钥（从环境变量读取，默认值仅用于开发）
const JWT_SECRET = process.env.JWT_SECRET || 'dien-project-secret-key-2026';
const JWT_EXPIRE = '5h'; // 10 小时过期

/**
 * 生成 JWT Token
 * @param {Object} payload - 用户信息 { id, account, role }
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

/**
 * 验证 JWT Token
 * @param {String} token - JWT token
 * @returns {Object} 解码后的用户信息
 * @throws {Error} Token 无效或过期时抛出错误
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

module.exports = { generateToken, verifyToken, JWT_SECRET };
