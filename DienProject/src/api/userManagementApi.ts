import axiosInstance from './axios';
import type { User } from '@/types';

/**
 * 用户列表响应接口
 */
interface UsersListResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

/**
 * 用户统计响应接口
 */
interface UserStatisticsResponse {
  success: boolean;
  data: {
    totalUsers: number;
    todayUsers: number;
    recentActiveUsers: number;
    roleStats: Record<string, number>;
    statusStats: Record<string, number>;
  };
}

/**
 * 获取所有用户列表（分页、搜索、筛选）
 * @param params 查询参数
 * @returns 用户列表响应数据
 */
export const getAllUsers = async (params?: {
  page?: number;
  limit?: number;
  keyword?: string;
  role?: string;
  status?: string;
}): Promise<UsersListResponse> => {
  const response = await axiosInstance.get<UsersListResponse>('/user-management/users', {
    params
  });
  return response.data;
};

/**
 * 获取单个用户详细信息
 * @param userId 用户ID
 * @returns 用户详细信息
 */
export const getUserDetail = async (userId: string) => {
  const response = await axiosInstance.get(`/user-management/users/${userId}`);
  return response.data;
};

/**
 * 更改用户角色
 * @param userId 用户ID
 * @param role 新角色
 * @returns 更新响应数据
 */
export const changeUserRole = async (userId: string, role: string) => {
  const response = await axiosInstance.put(`/user-management/users/${userId}/role`, { role });
  return response.data;
};

/**
 * 更改用户状态
 * @param userId 用户ID
 * @param status 新状态
 * @returns 更新响应数据
 */
export const changeUserStatus = async (userId: string, status: string) => {
  const response = await axiosInstance.put(`/user-management/users/${userId}/status`, { status });
  return response.data;
};

/**
 * 获取用户统计数据
 * @returns 统计数据响应
 */
export const getUserStatistics = async (): Promise<UserStatisticsResponse> => {
  const response = await axiosInstance.get<UserStatisticsResponse>('/user-management/statistics');
  return response.data;
};
