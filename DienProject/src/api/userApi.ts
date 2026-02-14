import axiosInstance from './axios';
import type { User } from '@/types';

/**
 * 登录响应接口
 */
interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

/**
 * 注册响应接口
 */
interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

/**
 * 刷新 Token 响应接口
 */
interface RefreshResponse {
  success: boolean;
  message: string;
  token: string;
}

/**
 * 获取用户信息响应接口
 */
interface ProfileResponse {
  success: boolean;
  user: User;
}

/**
 * 用户登录
 * @param account 邮箱或手机号
 * @param password 密码
 * @returns 登录响应数据
 */
export const login = async (account: string, password: string): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>('/users/login', {
    account,
    password
  });
  return response.data;
};

/**
 * 用户注册
 * @param name 用户名
 * @param account 邮箱或手机号
 * @param password 密码
 * @returns 注册响应数据
 */
export const register = async (
  name: string,
  account: string,
  password: string
): Promise<RegisterResponse> => {
  const response = await axiosInstance.post<RegisterResponse>('/users/register', {
    name,
    account,
    password
  });
  return response.data;
};

/**
 * 刷新 JWT Token
 * @returns 刷新响应数据
 */
export const refreshToken = async (): Promise<RefreshResponse> => {
  const response = await axiosInstance.post<RefreshResponse>('/users/refresh');
  return response.data;
};

/**
 * 获取当前用户信息
 * @returns 用户信息响应数据
 */
export const getUserProfile = async (): Promise<ProfileResponse> => {
  const response = await axiosInstance.get<ProfileResponse>('/users/profile');
  return response.data;
};

/**
 * 更新个人资料
 * @param data 个人资料数据
 * @returns 更新响应数据
 */
export const updateProfile = async (data: Partial<User>) => {
  const response = await axiosInstance.put('/users/profile', data);
  return response.data;
};

/**
 * 上传头像
 * @param formData 包含头像文件的 FormData
 * @returns 上传响应数据
 */
export const uploadAvatar = async (formData: FormData) => {
  const response = await axiosInstance.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * 删除头像
 * @returns 删除响应数据
 */
export const deleteAvatar = async () => {
  const response = await axiosInstance.delete('/users/avatar');
  return response.data;
};

/**
 * 修改密码
 * @param oldPassword 旧密码
 * @param newPassword 新密码
 * @returns 修改响应数据
 */
export const changePassword = async (oldPassword: string, newPassword: string) => {
  const response = await axiosInstance.put('/users/password', {
    oldPassword,
    newPassword
  });
  return response.data;
};
