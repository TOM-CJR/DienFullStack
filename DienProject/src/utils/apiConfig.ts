/**
 * API 配置工具
 * 统一管理 API 基础地址，支持开发和生产环境
 */

// API 基础地址
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * 获取文件访问URL
 * @param fileId 文件ID (MongoDB ObjectId)
 * @returns 完整的文件访问URL
 */
export const getFileUrl = (fileId: string): string => {
  return `${API_BASE_URL}/api/files/${fileId}`;
};

/**
 * 判断是否为有效的 MongoDB ObjectId
 * @param id 待检查的字符串
 * @returns 是否为有效的 ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * 获取头像URL
 * @param avatar 头像字段值（可能是 ObjectId 或完整 URL）
 * @returns 完整的头像URL或null
 */
export const getAvatarUrl = (avatar?: string): string | null => {
  if (!avatar) return null;
  if (isValidObjectId(avatar)) {
    return getFileUrl(avatar);
  }
  return avatar;
};

export default {
  API_BASE_URL,
  getFileUrl,
  isValidObjectId,
  getAvatarUrl
};
