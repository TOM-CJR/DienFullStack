// 奖学金申请相关API
import axios from './axios'

// 奖学金申请类型定义
export interface ScholarshipApplication {
  _id: string
  user: {
    _id: string
    name: string
    account: string
    email?: string
    phone?: string
  }
  scholarship: {
    _id: string
    title: string
    amount: number
    type: string
    quota?: number
    currentApplications?: number
    applicationDeadline: string
    announcementDate: string
    status?: string
  }
  status: 'pending' | 'approved' | 'rejected'
  appliedAt: string
  reviewedBy?: {
    _id: string
    name: string
    account: string
  }
  reviewedAt?: string
  reviewComment?: string
  createdAt: string
  updatedAt: string
}

// API响应类型
interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

/**
 * 提交奖学金申请
 * @param scholarshipId 奖学金ID
 * @returns Promise<ApiResponse>
 */
export const createScholarshipApplication = async (
  scholarshipId: string
): Promise<ApiResponse<ScholarshipApplication>> => {
  const response = await axios.post('/scholarship-applications', {
    scholarshipId
  })
  return response.data
}

/**
 * 获取我的申请列表
 * @returns Promise<ApiResponse>
 */
export const getMyApplications = async (): Promise<ApiResponse<ScholarshipApplication[]>> => {
  const response = await axios.get('/scholarship-applications/my')
  return response.data
}

/**
 * 获取所有申请列表（管理员）
 * @param params 查询参数
 * @returns Promise<ApiResponse>
 */
export const getAllApplications = async (params?: {
  status?: 'pending' | 'approved' | 'rejected' | ''
  scholarshipId?: string
  userSearch?: string
  page?: number
  limit?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}): Promise<ApiResponse<ScholarshipApplication[]>> => {
  const response = await axios.get('/scholarship-applications', { params })
  return response.data
}

/**
 * 获取申请详情
 * @param applicationId 申请ID
 * @returns Promise<ApiResponse>
 */
export const getApplicationDetail = async (
  applicationId: string
): Promise<ApiResponse<ScholarshipApplication>> => {
  const response = await axios.get(`/scholarship-applications/${applicationId}`)
  return response.data
}

/**
 * 审核申请（管理员）
 * @param applicationId 申请ID
 * @param status 审核状态
 * @param reviewComment 审核意见
 * @returns Promise<ApiResponse>
 */
export const reviewApplication = async (
  applicationId: string,
  status: 'approved' | 'rejected' | 'pending',
  reviewComment?: string
): Promise<ApiResponse<ScholarshipApplication>> => {
  const response = await axios.put(`/scholarship-applications/${applicationId}/review`, {
    status,
    reviewComment
  })
  return response.data
}

/**
 * 取消申请（用户）
 * @param applicationId 申请ID
 * @returns Promise<ApiResponse>
 */
export const cancelApplication = async (applicationId: string): Promise<ApiResponse> => {
  const response = await axios.delete(`/scholarship-applications/${applicationId}`)
  return response.data
}

/**
 * 检查用户是否已申请某个奖学金
 * @param scholarshipId 奖学金ID
 * @returns Promise<boolean>
 */
export const checkUserApplication = async (scholarshipId: string): Promise<ScholarshipApplication | null> => {
  try {
    const response = await getMyApplications()
    if (response.success && response.data) {
      const application = response.data.find(
        (app: ScholarshipApplication) => app.scholarship._id === scholarshipId
      )
      return application || null
    }
    return null
  } catch (error) {
    console.error('检查申请状态失败:', error)
    return null
  }
}
