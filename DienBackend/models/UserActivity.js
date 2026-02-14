// 用户活动记录数据模型
const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema({
  // 用户ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请提供用户ID']
  },

  // 活动类型
  activityType: {
    type: String,
    enum: {
      values: ['scholarship_apply', 'courseware_favorite', 'question_submit', 'exam_register'],
      message: '{VALUE} 不是有效的活动类型'
    },
    required: [true, '请提供活动类型']
  },

  // 资源类型
  resourceType: {
    type: String,
    enum: {
      values: ['scholarship', 'courseware', 'question', 'exam'],
      message: '{VALUE} 不是有效的资源类型'
    },
    required: [true, '请提供资源类型']
  },

  // 资源ID
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, '请提供资源ID']
  },

  // 额外数据（如答题结果、申请表单等）
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // 状态
  status: {
    type: String,
    enum: {
      values: ['active', 'completed', 'cancelled'],
      message: '{VALUE} 不是有效的状态'
    },
    default: 'active'
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

// 创建复合唯一索引，防止用户对同一资源重复创建相同类型的活动
UserActivitySchema.index({ userId: 1, activityType: 1, resourceId: 1 }, { unique: true });

// 创建查询索引
UserActivitySchema.index({ userId: 1, activityType: 1 });
UserActivitySchema.index({ userId: 1, resourceType: 1 });

// 更新时间中间件
UserActivitySchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// 创建并导出UserActivity模型
module.exports = mongoose.model('UserActivity', UserActivitySchema);
