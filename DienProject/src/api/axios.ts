import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import TokenManager from '@/utils/tokenManager';
import { useUserStore } from '@/stores/user';
import router from '@/router';

// API 基础地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// 创建 axios 实例
const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 是否正在刷新 token 的标志
let isRefreshing = false;
// 失败请求队列
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

/**
 * 处理队列中的请求
 */
const processQueue = (error: any = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });

  failedQueue = [];
};

/**
 * 处理登出逻辑
 */
const handleLogout = (message: string = '登录已过期，请重新登录') => {
  const userStore = useUserStore();

  // 清除 token 和用户信息
  TokenManager.clearToken();
  userStore.logout();

  // 显示提示消息
  alert(message);

  // 重定向到首页
  if (router.currentRoute.value.path !== '/home') {
    router.push('/home');
  }
};

/**
 * 请求拦截器
 * 在每个请求发送前添加 Authorization token
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TokenManager.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 * 处理 token 过期和自动刷新
 */
axiosInstance.interceptors.response.use(
  async (response: AxiosResponse) => {
    // 请求成功，自动刷新 token（延长有效期）
    // 只在非刷新接口且有 token 时调用
    if (response.config.url !== '/users/refresh' && TokenManager.hasToken()) {
      try {
        // 使用原生 axios 发送刷新请求，避免拦截器循环
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/api/users/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${TokenManager.getToken()}`
            }
          }
        );

        if (refreshResponse.data.success && refreshResponse.data.token) {
          // 更新 token
          TokenManager.setToken(refreshResponse.data.token);
        }
      } catch (refreshError) {
        // 刷新失败，忽略（会在下次请求时处理）
        console.warn('Token 自动刷新失败', refreshError);
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // 如果错误不是 401，直接返回错误
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // 检查错误代码
    const errorCode = (error.response?.data as any)?.code;

    // Token 过期
    if (errorCode === 'TOKEN_EXPIRED') {
      // 如果正在刷新 token，将请求加入队列
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      // 开始刷新 token
      isRefreshing = true;
      originalRequest._retry = true;

      try {
        // 尝试刷新 token
        const response = await axios.post(
          `${API_BASE_URL}/api/users/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${TokenManager.getToken()}`
            }
          }
        );

        if (response.data.success && response.data.token) {
          // 保存新 token
          TokenManager.setToken(response.data.token);

          // 处理队列中的请求
          processQueue();

          // 重试原始请求
          return axiosInstance(originalRequest);
        } else {
          throw new Error('刷新 token 失败');
        }
      } catch (refreshError) {
        // 刷新失败，清除所有状态并重定向
        processQueue(refreshError);
        handleLogout('登录已过期，请重新登录');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 其他 401 错误（无 token、token 无效等）
    handleLogout('认证失败，请重新登录');
    return Promise.reject(error);
  }
);

export default axiosInstance;
