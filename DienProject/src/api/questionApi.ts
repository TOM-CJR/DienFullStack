import axiosInstance from './axios';

/**
 * 题目API服务
 */

// 获取题目列表参数接口
interface GetQuestionListParams {
  page?: number;
  limit?: number;
  type?: string;
  difficulty?: string;
  category?: string;
  keyword?: string;
}

// 题目数据接口
interface QuestionData {
  title?: string;
  content?: string;
  type?: string;
  difficulty?: string;
  category?: string;
  options?: any[];
  answer?: any;
  explanation?: string;
  [key: string]: any;
}

// 答案提交接口
interface AnswerData {
  answer: any;
  [key: string]: any;
}

/**
 * 获取题目列表
 */
export const getQuestionList = async (params?: GetQuestionListParams) => {
  const response = await axiosInstance.get('/questions', { params });
  return response.data;
};

/**
 * 获取题目详情
 */
export const getQuestionDetail = async (id: string | number) => {
  const response = await axiosInstance.get(`/questions/${id}`);
  return response.data;
};

/**
 * 创建题目
 */
export const createQuestion = async (data: QuestionData) => {
  const response = await axiosInstance.post('/questions', data);
  return response.data;
};

/**
 * 更新题目
 */
export const updateQuestion = async (id: string | number, data: QuestionData) => {
  const response = await axiosInstance.put(`/questions/${id}`, data);
  return response.data;
};

/**
 * 删除题目
 */
export const deleteQuestion = async (id: string | number) => {
  const response = await axiosInstance.delete(`/questions/${id}`);
  return response.data;
};

/**
 * 提交答案
 */
export const submitAnswer = async (id: string | number, answer: any) => {
  const response = await axiosInstance.post(`/questions/${id}/submit`, { userAnswer: answer });
  return response.data;
};
