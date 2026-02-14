import axiosInstance from './axios';

/**
 * 课件API服务
 */

// 获取课件列表参数接口
interface GetCoursewareListParams {
  page?: number;
  limit?: number;
  type?: string;
  subject?: string;
  level?: string;
  keyword?: string;
}

/**
 * 获取课件列表
 */
export const getCoursewareList = async (params?: GetCoursewareListParams) => {
  const response = await axiosInstance.get('/courseware', { params });
  return response.data;
};

/**
 * 获取课件详情
 */
export const getCoursewareDetail = async (id: string | number) => {
  const response = await axiosInstance.get(`/courseware/${id}`);
  return response.data;
};

/**
 * 创建课件
 */
export const createCourseware = async (data: FormData) => {
  const response = await axiosInstance.post('/courseware', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * 更新课件
 */
export const updateCourseware = async (id: string | number, data: FormData) => {
  const response = await axiosInstance.put(`/courseware/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * 删除课件
 */
export const deleteCourseware = async (id: string | number) => {
  const response = await axiosInstance.delete(`/courseware/${id}`);
  return response.data;
};

/**
 * 收藏课件
 */
export const favoriteCourseware = async (id: string | number) => {
  const response = await axiosInstance.post(`/courseware/${id}/favorite`);
  return response.data;
};

/**
 * 下载课件
 */
export const downloadCourseware = async (id: string | number) => {
  const response = await axiosInstance.get(`/courseware/${id}/download`, {
    responseType: 'blob'
  });
  return response.data;
};
