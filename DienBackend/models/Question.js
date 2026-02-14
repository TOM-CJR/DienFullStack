// 题库数据模型
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  // 题目名称
  name: {
    type: String,
    required: [true, '请提供题目名称'],
    trim: true,
    maxlength: [200, '题目名称不能超过200个字符']
  },

  // 题目描述
  description: {
    type: String,
    required: [true, '请提供题目描述'],
    trim: true
  },

  // 题目类型
  type: {
    type: String,
    enum: {
      values: ['single', 'multiple', 'judgment', 'fill', 'programming'],
      message: '{VALUE} 不是有效的题目类型'
    },
    required: [true, '请提供题目类型']
  },

  // 难度等级
  difficulty: {
    type: String,
    enum: {
      values: ['easy', 'medium', 'hard'],
      message: '{VALUE} 不是有效的难度等级'
    },
    required: [true, '请提供难度等级']
  },

  // 题目分类（编程语言分类）
  category: {
    type: String,
    enum: {
      values: ['block', 'cpp', 'python', 'scratch', 'javascript', 'java', 'csharp', 'other'],
      message: '{VALUE} 不是有效的编程语言分类'
    },
    required: [true, '请提供题目分类'],
    trim: true
  },

  // 选项（用于选择题、判断题）
  options: [{
    key: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    }
  }],

  // 正确答案（可以是字符串、数组或对象，取决于题目类型）
  answer: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, '请提供正确答案']
  },

  // 答案解析
  explanation: {
    type: String,
    trim: true
  },

  // 测试用例（用于编程题）
  testCases: [{
    input: {
      type: String,
      required: true
    },
    expectedOutput: {
      type: String,
      required: true
    },
    isHidden: {
      type: Boolean,
      default: false
    }
  }],

  // 时间限制（毫秒，用于编程题）
  timeLimit: {
    type: Number,
    min: 0
  },

  // 内存限制（MB，用于编程题）
  memoryLimit: {
    type: Number,
    min: 0
  },

  // 创建者（关联到User模型）
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请提供创建者信息']
  },

  // 答题次数
  attemptCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // 正确次数
  correctCount: {
    type: Number,
    default: 0,
    min: 0
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

// 计算正确率的虚拟字段
QuestionSchema.virtual('correctRate').get(function() {
  if (this.attemptCount === 0) return 0;
  return (this.correctCount / this.attemptCount * 100).toFixed(2);
});

// 更新时间中间件（Mongoose 8.x 兼容写法）
QuestionSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// 确保虚拟字段在JSON序列化时被包含
QuestionSchema.set('toJSON', { virtuals: true });
QuestionSchema.set('toObject', { virtuals: true });

// 创建并导出Question模型
module.exports = mongoose.model('Question', QuestionSchema);
