import axiosInstance from './axios';

/**
 * 机构信息接口
 */
export interface Organization {
  _id: string;
  user: string;
  name: string;
  code?: string;
  type?: string;
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
 * 提交机构信息
 * @param formData 包含机构信息和文件的 FormData
 * @returns 提交响应数据
 */
export const createOrganization = async (formData: FormData) => {
  const response = await axiosInstance.post('/organizations', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * 获取我的机构信息
 * @returns 机构信息
 */
export const getMyOrganization = async () => {
  const response = await axiosInstance.get('/organizations/my');
  return response.data;
};

/**
 * 更新机构信息
 * @param id 机构ID
 * @param formData 更新数据
 * @returns 更新响应数据
 */
export const updateOrganization = async (id: string, formData: FormData) => {
  const response = await axiosInstance.put(`/organizations/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * 删除机构信息
 * @param id 机构ID
 * @returns 删除响应数据
 */
export const deleteOrganization = async (id: string) => {
  const response = await axiosInstance.delete(`/organizations/${id}`);
  return response.data;
};

/**
 * 获取所有机构信息（超级管理员）
 * @param params 查询参数
 * @returns 机构列表
 */
export const getAllOrganizations = async (params?: { status?: string; userSearch?: string }) => {
  const response = await axiosInstance.get('/organizations', { params });
  return response.data;
};

/**
 * 审核机构信息（超级管理员）
 * @param id 机构ID
 * @param status 审核状态
 * @param reviewComment 审核意见
 * @returns 审核响应数据
 */
export const reviewOrganization = async (
  id: string,
  status: 'approved' | 'rejected',
  reviewComment?: string
) => {
  const response = await axiosInstance.put(`/organizations/${id}/review`, {
    status,
    reviewComment
  });
  return response.data;
};
