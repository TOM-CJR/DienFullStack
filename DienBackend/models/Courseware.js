// 课件资源数据模型
const mongoose = require('mongoose');

const CoursewareSchema = new mongoose.Schema({
  // 课件名称
  name: {
    type: String,
    required: [true, '请提供课件名称'],
    trim: true,
    maxlength: [200, '课件名称不能超过200个字符']
  },

  // 课件描述
  description: {
    type: String,
    required: [true, '请提供课件描述'],
    trim: true,
    maxlength: [1000, '描述不能超过1000个字符']
  },

  // 课件类型
  type: {
    type: String,
    enum: {
      values: ['video', 'document', 'ppt', 'code', 'other'],
      message: '{VALUE} 不是有效的课件类型'
    },
    required: [true, '请提供课件类型']
  },

  // 学科分类
  subject: {
    type: String,
    enum: {
      values: ['computer', 'math', 'physics', 'chemistry', 'biology', 'other'],
      message: '{VALUE} 不是有效的学科分类'
    },
    required: [true, '请提供学科分类']
  },

  // 难度等级
  level: {
    type: String,
    enum: {
      values: ['beginner', 'intermediate', 'advanced'],
      message: '{VALUE} 不是有效的难度等级'
    },
    required: [true, '请提供难度等级']
  },

  // 课件文档文件（GridFS ID 或文件路径）
  documentFile: {
    type: String,
    trim: true
  },

  // 文档文件名
  documentFileName: {
    type: String,
    trim: true
  },

  // 文档文件类型
  documentFileType: {
    type: String,
    trim: true
  },

  // 缩略图URL（可选）
  thumbnailUrl: {
    type: String,
    trim: true
  },

  // 上传者（关联到User模型）
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请提供上传者信息']
  },

  // 课件状态
  status: {
    type: String,
    enum: {
      values: ['draft', 'published', 'archived'],
      message: '{VALUE} 不是有效的状态'
    },
    default: 'draft'
  },

  // 浏览次数
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // 收藏次数
  favoriteCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // 评分
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  // 评分人数
  ratingCount: {
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

// 更新时间中间件
CoursewareSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// 删除前钩子 - 清理关联的GridFS文件
// 注意：这个钩子只在使用 document.deleteOne() 时触发，不在 Model.deleteOne() 时触发
CoursewareSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const { deleteFile } = require('../utils/gridfsStorage');

  // 如果有文档文件且是GridFS文件ID，则删除文件
  if (this.documentFile && /^[0-9a-fA-F]{24}$/.test(this.documentFile)) {
    try {
      await deleteFile(this.documentFile);
    } catch (error) {
      // 静默处理错误
    }
  }

  // 如果有缩略图且是GridFS文件ID，则删除文件
  if (this.thumbnailUrl && /^[0-9a-fA-F]{24}$/.test(this.thumbnailUrl)) {
    try {
      await deleteFile(this.thumbnailUrl);
    } catch (error) {
      // 静默处理错误
    }
  }
});

// 创建并导出Courseware模型
module.exports = mongoose.model('Courseware', CoursewareSchema);
