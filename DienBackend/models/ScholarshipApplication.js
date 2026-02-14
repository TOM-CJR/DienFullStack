// 奖学金申请记录模型
const mongoose = require('mongoose');

const ScholarshipApplicationSchema = new mongoose.Schema({
  // 申请用户
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请提供申请用户信息']
  },

  // 申请的奖学金
  scholarship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship',
    required: [true, '请提供奖学金信息']
  },

  // 申请状态
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: '{VALUE} 不是有效的申请状态'
    },
    default: 'pending'
  },

  // 申请时间
  appliedAt: {
    type: Date,
    default: Date.now
  },

  // 审核人（关联到User模型）
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // 审核时间
  reviewedAt: {
    type: Date,
    default: null
  },

  // 审核意见/拒绝原因
  reviewComment: {
    type: String,
    trim: true,
    default: ''
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

// 更新时间中间件
ScholarshipApplicationSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// 创建复合索引，确保用户不能重复申请同一个奖学金
ScholarshipApplicationSchema.index({ user: 1, scholarship: 1 }, { unique: true });

// 创建并导出ScholarshipApplication模型
module.exports = mongoose.model('ScholarshipApplication', ScholarshipApplicationSchema);
