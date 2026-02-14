// 用户活动记录API服务
import axiosInstance from './axios';

// 活动类型
export type ActivityType = 'scholarship_apply' | 'courseware_favorite' | 'question_submit' | 'exam_register';

// 资源类型
export type ResourceType = 'scholarship' | 'courseware' | 'question' | 'exam';

// 活动状态
export type ActivityStatus = 'active' | 'completed' | 'cancelled';

// 用户活动接口
export interface UserActivity {
  _id: string;
  userId: string;
  activityType: ActivityType;
  resourceType: ResourceType;
  resourceId: string;
  data: any;
  status: ActivityStatus;
  createdAt: string;
  updatedAt: string;
}

// 获取当前用户的活动记录
export const getMyActivities = async (params?: {
  activityType?: ActivityType;
  resourceType?: ResourceType;
  status?: ActivityStatus;
  page?: number;
  limit?: number;
}) => {
  const response = await axiosInstance.get('/user-activities/my', { params });
  return response.data;
};

// 创建活动记录
export const createActivity = async (data: {
  activityType: ActivityType;
  resourceType: ResourceType;
  resourceId: string;
  data?: any;
}) => {
  const response = await axiosInstance.post('/user-activities', data);
  return response.data;
};

// 删除活动记录（通过ID）
export const deleteActivity = async (id: string) => {
  const response = await axiosInstance.delete(`/user-activities/${id}`);
  return response.data;
};

// 删除活动记录（通过资源ID）
export const deleteActivityByResource = async (resourceId: string, activityType: ActivityType) => {
  const response = await axiosInstance.delete(`/user-activities/by-resource/${resourceId}`, {
    params: { activityType }
  });
  return response.data;
};

// 检查活动记录是否存在
export const checkActivity = async (activityType: ActivityType, resourceId: string) => {
  const response = await axiosInstance.get('/user-activities/check', {
    params: { activityType, resourceId }
  });
  return response.data;
};

// 检查是否存在（返回boolean）
export const checkActivityExists = async (activityType: ActivityType, resourceId: string): Promise<boolean> => {
  try {
    const result = await checkActivity(activityType, resourceId);
    return result.exists || false;
  } catch (error) {
    console.error('检查活动记录失败:', error);
    return false;
  }
};

// 收藏/取消收藏课件
export const toggleCoursewareFavorite = async (coursewareId: string, isFavorited: boolean) => {
  if (isFavorited) {
    // 取消收藏
    return await deleteActivityByResource(coursewareId, 'courseware_favorite');
  } else {
    // 添加收藏
    return await createActivity({
      activityType: 'courseware_favorite',
      resourceType: 'courseware',
      resourceId: coursewareId
    });
  }
};

// 申请奖学金
export const applyScholarship = async (scholarshipId: string, applicationData?: any) => {
  return await createActivity({
    activityType: 'scholarship_apply',
    resourceType: 'scholarship',
    resourceId: scholarshipId,
    data: applicationData
  });
};

// 报名考试
export const registerExam = async (examId: string, registrationData?: any) => {
  return await createActivity({
    activityType: 'exam_register',
    resourceType: 'exam',
    resourceId: examId,
    data: registrationData
  });
};

// 提交答题记录
export const submitQuestion = async (questionId: string, answerData: any) => {
  return await createActivity({
    activityType: 'question_submit',
    resourceType: 'question',
    resourceId: questionId,
    data: answerData
  });
};
