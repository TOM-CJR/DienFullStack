// 前端权限工具函数
// 用于检查用户权限、角色显示等

import type { User } from '@/types';

// 角色类型定义
export type UserRole = 'user' | 'verified' | 'admin' | 'super_admin';

// 角色层级定义（数字越大权限越高）
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  verified: 1,
  admin: 2,
  super_admin: 3
};

// 角色显示配置
const ROLE_DISPLAY: Record<UserRole, { text: string; color: string; icon: string }> = {
  user: {
    text: '普通用户',
    color: '#8c8c8c',
    icon: '👤'
  },
  verified: {
    text: '认证用户',
    color: '#1890ff',
    icon: '✓'
  },
  admin: {
    text: '管理员',
    color: '#52c41a',
    icon: '⚙️'
  },
  super_admin: {
    text: '超级管理员',
    color: '#f5222d',
    icon: '👑'
  }
};

/**
 * 检查用户是否有指定角色
 * @param user - 用户对象
 * @param role - 角色名称
 * @returns 是否有该角色
 */
export const hasRole = (user: User | null | undefined, role: UserRole): boolean => {
  if (!user) return false;
  return user.role === role;
};

/**
 * 检查用户角色是否满足最小等级要求
 * @param user - 用户对象
 * @param minRole - 最小角色要求
 * @returns 是否满足最小等级
 */
export const hasMinRole = (user: User | null | undefined, minRole: UserRole): boolean => {
  if (!user) return false;

  const userLevel = ROLE_HIERARCHY[user.role as UserRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;

  return userLevel >= requiredLevel;
};

/**
 * 检查是否为认证用户（verified及以上）
 * @param user - 用户对象
 * @returns 是否为认证用户
 */
export const isVerified = (user: User | null | undefined): boolean => {
  return hasMinRole(user, 'verified');
};

/**
 * 检查是否为管理员（admin及以上）
 * @param user - 用户对象
 * @returns 是否为管理员
 */
export const isAdmin = (user: User | null | undefined): boolean => {
  return hasMinRole(user, 'admin');
};

/**
 * 检查是否为超级管理员
 * @param user - 用户对象
 * @returns 是否为超级管理员
 */
export const isSuperAdmin = (user: User | null | undefined): boolean => {
  return hasRole(user, 'super_admin');
};

/**
 * 获取角色显示配置
 * @param role - 角色名称
 * @returns 角色显示配置（文本、颜色、图标）
 */
export const getRoleDisplay = (role: UserRole) => {
  return ROLE_DISPLAY[role] || ROLE_DISPLAY.user;
};

/**
 * 获取资源权限对象
 * @param user - 用户对象
 * @param resourceType - 资源类型
 * @returns 权限对象（canView, canInteract, canManage）
 */
export const getResourcePermission = (
  user: User | null | undefined,
  resourceType: 'news' | 'courseware' | 'exam' | 'question' | 'scholarship'
) => {
  const canView = true; // 所有用户都可以查看

  let canInteract = false; // 是否可以互动（收藏、做题、报名等）
  let canManage = false; // 是否可以管理

  if (user) {
    // 认证用户及以上可以互动
    canInteract = isVerified(user);

    // 管理员及以上可以管理
    canManage = isAdmin(user);
  }

  return {
    canView,
    canInteract,
    canManage
  };
};

/**
 * 检查用户是否可以访问路由
 * @param user - 用户对象
 * @param requiredRole - 路由要求的最小角色
 * @returns 是否可以访问
 */
export const canAccessRoute = (
  user: User | null | undefined,
  requiredRole?: UserRole
): boolean => {
  if (!requiredRole) return true; // 无角色要求的路由任何人都可以访问
  return hasMinRole(user, requiredRole);
};
