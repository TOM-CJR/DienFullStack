// 角色权限中间件
// 用于验证用户是否有足够的权限访问特定资源

// 角色层级定义（数字越大权限越高）
const ROLE_HIERARCHY = {
  user: 0,
  verified: 1,
  admin: 2,
  super_admin: 3
};

/**
 * 检查用户是否在允许的角色列表中
 * @param {Array<String>} allowedRoles - 允许的角色数组
 * @returns {Function} Express中间件函数
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // 确保用户已通过身份验证
    if (!req.user) {
      return res.status(401).json({ message: '未授权访问，请先登录' });
    }

    // 检查用户角色是否在允许列表中
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: '权限不足，无法访问此资源',
        requiredRole: allowedRoles,
        currentRole: req.user.role
      });
    }

    next();
  };
};

/**
 * 检查用户角色是否满足最小等级要求
 * @param {String} minRole - 最小角色要求
 * @returns {Function} Express中间件函数
 */
const checkMinRole = (minRole) => {
  return (req, res, next) => {
    // 确保用户已通过身份验证
    if (!req.user) {
      return res.status(401).json({ message: '未授权访问，请先登录' });
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    // 检查用户角色等级是否满足要求
    if (userRoleLevel < requiredLevel) {
      return res.status(403).json({
        message: `权限不足，至少需要${minRole}角色`,
        requiredRole: minRole,
        currentRole: req.user.role
      });
    }

    next();
  };
};

/**
 * 快捷方法：检查是否为认证用户（verified及以上）
 */
const isVerified = checkMinRole('verified');

/**
 * 快捷方法：检查是否为管理员（admin及以上）
 */
const isAdmin = checkMinRole('admin');

/**
 * 快捷方法：检查是否为超级管理员
 */
const isSuperAdmin = checkRole(['super_admin']);

/**
 * 检查资源归属（确保用户只能修改自己创建的资源）
 * 超级管理员可以修改所有资源
 * @param {String} ownerField - 资源对象中表示所有者的字段名，默认为'author'
 * @returns {Function} Express中间件函数
 */
const checkResourceOwnership = (ownerField = 'author') => {
  return (req, res, next) => {
    // 超级管理员拥有所有权限
    if (req.user.role === 'super_admin') {
      return next();
    }

    // 这个中间件需要在资源查询之后使用
    // 资源应该被存储在 req.resource 中
    if (!req.resource) {
      return res.status(500).json({
        message: '服务器配置错误：未找到资源对象'
      });
    }

    const ownerId = req.resource[ownerField];

    // 检查用户是否为资源所有者
    if (ownerId && ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        message: '权限不足，您只能修改自己创建的资源'
      });
    }

    next();
  };
};

module.exports = {
  checkRole,
  checkMinRole,
  isVerified,
  isAdmin,
  isSuperAdmin,
  checkResourceOwnership,
  ROLE_HIERARCHY
};
