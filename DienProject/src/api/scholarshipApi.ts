import axiosInstance from './axios';

/**
 * 奖学金API服务
 */

// 奖学金对象接口
export interface ScholarshipItem {
  _id: string;
  id?: string;
  title: string;
  description: string;
  amount: number;
  type: string;
  requirements?: string;
  quota?: number;
  currentApplications?: number;
  publishDate: string;
  applicationDeadline: string;
  announcementDate: string;
  documentFile?: string;
  documentFileName?: string;
  documentFileType?: string;
  status: string;
  createdBy?: any;
  views?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// 获取奖学金列表参数接口
interface GetScholarshipListParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  keyword?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  isPublic?: 'true' | 'false'; // 是否公开访问（前端展示）
}

/**
 * 获取奖学金列表
 */
export const getScholarshipList = async (params?: GetScholarshipListParams) => {
  const response = await axiosInstance.get('/scholarships', { params });
  return response.data;
};

/**
 * 获取奖学金详情
 */
export const getScholarshipDetail = async (id: string | number) => {
  const response = await axiosInstance.get(`/scholarships/${id}`);
  return response.data;
};

/**
 * 创建奖学金
 */
export const createScholarship = async (data: FormData) => {
  const response = await axiosInstance.post('/scholarships', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * 更新奖学金
 */
export const updateScholarship = async (id: string | number, data: FormData) => {
  const response = await axiosInstance.put(`/scholarships/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * 删除奖学金
 */
export const deleteScholarship = async (id: string | number) => {
  const response = await axiosInstance.delete(`/scholarships/${id}`);
  return response.data;
};

/**
 * 申请奖学金
 */
export const applyScholarship = async (id: string | number) => {
  const response = await axiosInstance.post(`/scholarships/${id}/apply`);
  return response.data;
};
