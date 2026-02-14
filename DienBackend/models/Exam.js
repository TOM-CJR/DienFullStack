// 考试数据模型
const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  // 考试名称
  name: {
    type: String,
    required: [true, '请提供考试名称'],
    trim: true,
    maxlength: [200, '考试名称不能超过200个字符']
  },

  // 考试描述
  description: {
    type: String,
    required: [true, '请提供考试描述'],
    trim: true,
    maxlength: [1000, '描述不能超过1000个字符']
  },

  // 考试类型
  type: {
    type: String,
    enum: {
      values: ['gesp-cpp', 'gesp-python', 'robot-car', 'other'],
      message: '{VALUE} 不是有效的考试类型'
    },
    required: [true, '请提供考试类型']
  },

  // 考试级别
  level: {
    type: String,
    enum: {
      values: ['primary', 'middle', 'high'],
      message: '{VALUE} 不是有效的考试级别'
    },
    required: [true, '请提供考试级别']
  },

  // 题目列表（关联到Question模型）
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0
    }
  }],

  // 总分
  totalScore: {
    type: Number,
    required: [true, '请提供总分'],
    min: 0
  },

  // 及格分
  passingScore: {
    type: Number,
    required: [true, '请提供及格分'],
    min: 0
  },

  // 考试时长（分钟）
  duration: {
    type: Number,
    required: [true, '请提供考试时长'],
    min: 1
  },

  // 考试日期
  examDate: {
    type: Date,
    required: [true, '请提供考试日期']
  },

  // 报名截止日期
  registrationDeadline: {
    type: Date,
    required: [true, '请提供报名截止日期']
  },

  // 考试状态
  status: {
    type: String,
    enum: {
      values: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      message: '{VALUE} 不是有效的考试状态'
    },
    default: 'upcoming'
  },

  // 最大参与人数
  maxParticipants: {
    type: Number,
    min: 1
  },

  // 当前参与人数
  currentParticipants: {
    type: Number,
    default: 0,
    min: 0
  },

  // 创建者（关联到User模型）
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请提供创建者信息']
  },

  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  },

  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 验证及格分不能超过总分
ExamSchema.pre('save', function(next) {
  if (this.passingScore > this.totalScore) {
    next(new Error('及格分不能超过总分'));
  }
  this.updatedAt = Date.now();
  next();
});

// 创建并导出Exam模型
module.exports = mongoose.model('Exam', ExamSchema);
