// 首页轮播图数据的API接口
export interface Sliderlist {
  id: string;           // 轮播图ID
  text: string;         // 轮播图标题
  caption: string;      // 轮播图副标题
  imgSrc: string;       // 轮播图图片路径
}

// 最新资讯数据的API接口
export interface NewsItem {
  id: string;           // 资讯ID
  title: string;        // 资讯标题
  description: string;  // 资讯描述
  image: string;        // 资讯图片路径
}

// 用户数据的API接口
export interface User {
  _id: string;                     // MongoDB用户ID
  id?: number;                     // 用户ID（兼容旧字段）
  name: string;                    // 真实姓名
  nickname?: string;               // 昵称（显示在界面上）
  email?: string;                  // 邮箱地址（可选）
  phone?: string;                  // 手机号码（可选）
  avatar?: string;                 // 头像文件ID或URL（可选）
  account: string;                 // 账号名
  role: 'user' | 'verified' | 'admin' | 'super_admin';  // 用户角色：四级角色体系
  verified?: boolean;              // 认证状态（可选）
  verifiedAt?: string;             // 认证时间（可选）
  gender?: 'male' | 'female' | 'other' | '';  // 性别（可选）
  birthDate?: string;              // 出生日期（可选）
  lastLoginAt?: string;            // 最后登录时间（可选）
  status?: 'active' | 'inactive' | 'suspended';  // 账号状态（可选）
  organization?: any;              // 关联机构（可选）
  school?: any;                    // 关联学校（可选）
  createdAt?: string;              // 创建时间（可选）
  updatedAt?: string;              // 更新时间（可选）
  // 兼容旧字段
  registrationDate?: string;       // 注册时间（兼容旧字段）
  lastLoginDate?: string;          // 最后登录时间（兼容旧字段）
}

// 课件类型定义
export interface Courseware {
  id: number;                                  // 课件ID
  name: string;                                // 课件名称
  description: string;                         // 课件描述
  type: 'video' | 'document' | 'ppt' | 'code' | 'other';  // 课件类型
  typeText: string;                            // 课件类型文本
  subject: 'computer' | 'math' | 'physics' | 'chemistry' | 'biology' | 'other';  // 学科分类
  subjectText: string;                         // 学科分类文本
  level: 'beginner' | 'intermediate' | 'advanced';  // 难度等级
  levelText: string;                           // 难度等级文本
  uploadDate: string;                          // 上传日期（格式：YYYY-MM-DD）
  favoriteDate?: string;                       // 收藏日期（可选，格式：YYYY-MM-DD）
  views: number;                               // 浏览量
  rating: number;                              // 评分（0-5）
  isFavorited: boolean;                        // 是否收藏
}

// 新闻信息类型定义
export interface News {
  id: number | string;                         // 新闻ID（支持字符串和数字）
  title: string;                               // 新闻标题
  content: string;                             // 新闻内容
  date: string;                                // 发布日期（格式：YYYY-MM-DD）
  category: 'industry' | 'notice' | 'activity' | 'achievement';  // 新闻分类
  categoryText: string;                        // 新闻分类文本
  documentFile?: string;                       // 文档文件ID或路径（可选）
  documentFileName?: string;                   // 文档文件名（可选）
  documentFileType?: string;                   // 文档文件类型（可选）
  coverImage: string;                          // 封面图片路径
}

// 考试信息类型定义
export interface Exam {
  id: number;                                  // 考试ID
  name: string;                                // 考试名称
  description: string;                         // 考试描述
  type: 'gesp-cpp' | 'gesp-python' | 'robot-car' | 'other';  // 考试类型
  typeText: string;                            // 考试类型文本
  level: 'primary' | 'middle' | 'high';        // 考试级别
  levelText: string;                           // 考试级别文本
  examDate: string;                            // 考试日期（格式：YYYY-MM-DD HH:MM）
  registrationDeadline: string;                // 报名截止日期（格式：YYYY-MM-DD HH:MM）
  status: 'upcoming' | 'ongoing' | 'completed';  // 考试状态
  statusText: string;                          // 考试状态文本
}

// 题库类型定义
export interface Question {
  id: number;                                  // 题目ID
  name: string;                                // 题目名称
  description: string;                         // 题目描述
  type: 'single' | 'multiple' | 'judgment' | 'fill' | 'programming';  // 题目类型
  typeText: string;                            // 题目类型文本
  difficulty: 'easy' | 'medium' | 'hard';      // 难度等级
  difficultyText: string;                      // 难度等级文本
  category: string;                            // 题目分类
  categoryText: string;                        // 题目分类文本
  addDate: string;                             // 添加时间
  attemptCount: number;                        // 答题次数
  correctRate: number;                         // 正确率
  isAnswered: boolean;                         // 是否已回答
}

// 奖学金类型定义
export interface Scholarship {
  id: number;                                  // 奖学金ID
  name: string;                                // 奖学金名称
  description: string;                         // 奖学金描述
  amount: number;                              // 奖学金金额
  type: 'merit' | 'special' | 'poverty' | 'competition';  // 奖学金类型
  typeText: string;                            // 奖学金类型文本
  deadline: string;                            // 申请截止日期（格式：YYYY-MM-DD）
  publishDate: string;                         // 发布日期（格式：YYYY-MM-DD）
  resultDate?: string;                         // 结果日期（可选，格式：YYYY-MM-DD）
  status: 'available' | 'applying' | 'approved' | 'rejected' | 'expired';  // 奖学金状态
  statusText: string;                          // 奖学金状态文本
  requirements: string;                        // 申请要求
}

// 机构信息类型定义
export interface Organization {
  id: number;                                  // 机构ID
  name: string;                                // 机构名称
  code?: string;                               // 机构代码
  type: 'school' | 'company' | 'government' | 'other';  // 机构类型
  typeText: string;                            // 机构类型文本
  contactPerson: string;                       // 联系人
  contactPhone: string;                        // 联系电话
  contactEmail: string;                        // 联系邮箱
  email?: string;                              // 电子邮箱（备用）
  establishDate?: string;                      // 成立时间
  province?: string;                           // 省份
  city?: string;                               // 城市
  address: string;                             // 机构地址
  zipCode?: string;                            // 邮编
  description: string;                         // 机构描述
  status: 'verified' | 'pending' | 'rejected';  // 机构状态
  statusText: string;                          // 机构状态文本
}

// 机构资质证书类型
export interface Certificate {
  id?: number;                                 // 证书ID
  name: string;                                // 证书名称
  number: string;                              // 证书编号
  expiryDate: string;                          // 有效期至
}

// 学校信息类型定义
export interface School {
  id: number;                                  // 学校ID
  name: string;                                // 学校名称
  code?: string;                               // 学校代码
  type?: string;                               // 学校类型
  principal?: string;                          // 校长
  contactPerson: string;                       // 联系人
  contactPhone: string;                        // 联系电话
  contactEmail: string;                        // 联系邮箱
  email?: string;                              // 电子邮箱（备用）
  establishDate?: string;                      // 建校时间
  province?: string;                           // 省份
  city?: string;                               // 城市
  district?: string;                           // 区县
  address: string;                             // 学校地址
  zipCode?: string;                            // 邮编
  website?: string;                            // 学校网址
  studentCount?: string;                       // 学生人数
  teacherCount?: string;                       // 教师人数
  classCount?: string;                         // 班级数量
  description: string;                         // 学校描述
  level: 'primary' | 'middle' | 'high' | 'university' | 'other';  // 学校级别
  levelText: string;                           // 学校级别文本
  status: 'verified' | 'pending' | 'rejected';  // 学校状态
  statusText: string;                          // 学校状态文本
}