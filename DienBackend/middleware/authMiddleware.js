const { verifyToken } = require('../utils/jwtUtils');

/**
 * JWT 认证中间件
 * 验证请求头中的 Authorization token
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 从请求头获取 token (格式: "Bearer <token>")
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
        code: 'NO_TOKEN'
      });
    }

    // 提取 token
    const token = authHeader.replace('Bearer ', '');

    // 验证 token
    const decoded = verifyToken(token);

    // 将用户信息附加到请求对象，供后续路由使用
    req.user = decoded;

    // 继续执行下一个中间件或路由处理器
    next();
  } catch (error) {
    // Token 过期
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '登录已过期，请重新登录',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Token 无效
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌',
        code: 'INVALID_TOKEN'
      });
    }

    // 其他错误
    return res.status(401).json({
      success: false,
      message: '认证失败',
      code: 'AUTH_FAILED',
      error: error.message
    });
  }
};

module.exports = authMiddleware;
