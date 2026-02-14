import axiosInstance from './axios';

/**
 * 学校信息接口
 */
export interface School {
  _id: string;
  user: string;
  name: string;
  code?: string;
  type?: 'primary' | 'middle' | 'high' | 'university' | '';
  contactPerson: string;
  contactPhone: string;
  email?: string;
  establishDate?: Date;
  province?: string;
  city?: string;
  address?: string;
  zipCode?: string;
  description?: string;
  logo?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: any;
  reviewedAt?: Date;
  reviewComment?: string;
  certificates: Array<{
    name: string;
    number?: string;
    fileId: string;
    expiryDate?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 提交学校信息
 * @param formData 包含学校信息和文件的 FormData
 * @returns 提交响应数据
 */
export const createSchool = async (formData: FormData) => {
  const response = await axiosInstance.post('/schools', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * 获取我的学校信息
 * @returns 学校信息
 */
export const getMySchool = async () => {
  const response = await axiosInstance.get('/schools/my');
  return response.data;
};

/**
 * 更新学校信息
 * @param id 学校ID
 * @param formData 更新数据
 * @returns 更新响应数据
 */
export const updateSchool = async (id: string, formData: FormData) => {
  const response = await axiosInstance.put(`/schools/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * 删除学校信息
 * @param id 学校ID
 * @returns 删除响应数据
 */
export const deleteSchool = async (id: string) => {
  const response = await axiosInstance.delete(`/schools/${id}`);
  return response.data;
};

/**
 * 获取所有学校信息（超级管理员）
 * @param params 查询参数
 * @returns 学校列表
 */
export const getAllSchools = async (params?: { status?: string; userSearch?: string }) => {
  const response = await axiosInstance.get('/schools', { params });
  return response.data;
};

/**
 * 审核学校信息（超级管理员）
 * @param id 学校ID
 * @param status 审核状态
 * @param reviewComment 审核意见
 * @returns 审核响应数据
 */
export const reviewSchool = async (
  id: string,
  status: 'approved' | 'rejected',
  reviewComment?: string
) => {
  const response = await axiosInstance.put(`/schools/${id}/review`, {
    status,
    reviewComment
  });
  return response.data;
};
