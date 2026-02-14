import axiosInstance from './axios';

/**
 * 新闻API服务
 */

// 新闻对象接口
export interface NewsItem {
  _id: string;
  id?: string;
  title: string;
  category: string;
  status: string;
  creator?: string;
  author?: any;
  createdAt: string;
  updatedAt: string;
  summary?: string;
  content: string;
  coverImage?: string;
  documentFile?: string;
  documentFileName?: string;
  documentFileType?: string;
  views?: number;
  tags?: string[];
  publishedAt?: string;
}

// 获取新闻列表参数接口
interface GetNewsListParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  keyword?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

/**
 * 获取新闻列表
 */
export const getNewsList = async (params?: GetNewsListParams) => {
  const response = await axiosInstance.get('/news', { params });
  return response.data;
};

/**
 * 获取新闻详情
 */
export const getNewsDetail = async (id: string | number) => {
  const response = await axiosInstance.get(`/news/${id}`);
  return response.data;
};

/**
 * 创建新闻
 */
export const createNews = async (data: FormData) => {
  const response = await axiosInstance.post('/news', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * 更新新闻
 */
export const updateNews = async (id: string | number, data: FormData) => {
  const response = await axiosInstance.put(`/news/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * 删除新闻
 */
export const deleteNews = async (id: string | number) => {
  const response = await axiosInstance.delete(`/news/${id}`);
  return response.data;
};
