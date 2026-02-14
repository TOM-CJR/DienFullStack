import axiosInstance from './axios';

/**
 * 考试API服务
 */

// 获取考试列表参数接口
interface GetExamListParams {
  page?: number;
  limit?: number;
  type?: string;
  level?: string;
  status?: string;
  keyword?: string;
}

// 考试数据接口
interface ExamData {
  title?: string;
  description?: string;
  type?: string;
  level?: string;
  duration?: number;
  totalScore?: number;
  passingScore?: number;
  startTime?: string;
  endTime?: string;
  questions?: any[];
  [key: string]: any;
}

// 考试答案提交接口
interface ExamAnswers {
  answers: Record<string, any>;
  [key: string]: any;
}

/**
 * 获取考试列表
 */
export const getExamList = async (params?: GetExamListParams) => {
  const response = await axiosInstance.get('/exams', { params });
  return response.data;
};

/**
 * 获取考试详情
 */
export const getExamDetail = async (id: string | number) => {
  const response = await axiosInstance.get(`/exams/${id}`);
  return response.data;
};

/**
 * 创建考试
 */
export const createExam = async (data: ExamData) => {
  const response = await axiosInstance.post('/exams', data);
  return response.data;
};

/**
 * 更新考试
 */
export const updateExam = async (id: string | number, data: ExamData) => {
  const response = await axiosInstance.put(`/exams/${id}`, data);
  return response.data;
};

/**
 * 删除考试
 */
export const deleteExam = async (id: string | number) => {
  const response = await axiosInstance.delete(`/exams/${id}`);
  return response.data;
};

/**
 * 报名考试
 */
export const registerExam = async (id: string | number) => {
  const response = await axiosInstance.post(`/exams/${id}/register`);
  return response.data;
};

/**
 * 提交考试答卷
 */
export const submitExam = async (id: string | number, answers: Record<string, any>) => {
  const response = await axiosInstance.post(`/exams/${id}/submit`, { answers });
  return response.data;
};
