// 新闻数据模型
const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  // 新闻标题
  title: {
    type: String,
    required: [true, '请提供新闻标题'],
    trim: true,
    maxlength: [200, '标题不能超过200个字符']
  },

  // 新闻内容
  content: {
    type: String,
    required: [true, '请提供新闻内容'],
    trim: true
  },

  // 新闻摘要
  summary: {
    type: String,
    trim: true,
    maxlength: [500, '摘要不能超过500个字符']
  },

  // 新闻分类
  category: {
    type: String,
    enum: {
      values: ['industry', 'notice', 'activity', 'achievement'],
      message: '{VALUE} 不是有效的新闻分类'
    },
    required: [true, '请提供新闻分类']
  },

  // 封面图片URL
  coverImage: {
    type: String,
    required: [true, '请提供新闻封面图片'],
    trim: true
  },

  // 新闻文档文件（Word、PDF等）
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

  // 作者（关联到User模型）
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请提供作者信息']
  },

  // 新闻状态
  status: {
    type: String,
    enum: {
      values: ['draft', 'published', 'archived'],
      message: '{VALUE} 不是有效的状态'
    },
    default: 'draft'
  },

  // 发布时间
  publishedAt: {
    type: Date
  },

  // 浏览量
  views: {
    type: Number,
    default: 0,
    min: 0
  },

  // 标签
  tags: [{
    type: String,
    trim: true
  }],

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
NewsSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// 删除前钩子 - 清理关联的GridFS文件
// 注意：这个钩子只在使用 document.deleteOne() 时触发，不在 Model.deleteOne() 时触发
NewsSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const { deleteFile } = require('../utils/gridfsStorage');

  // 如果有封面图片且是GridFS文件ID，则删除文件
  if (this.coverImage && /^[0-9a-fA-F]{24}$/.test(this.coverImage)) {
    try {
      await deleteFile(this.coverImage);
    } catch (error) {
      console.error('Error deleting cover image in pre-delete hook:', error);
    }
  }

  // 如果有文档文件且是GridFS文件ID，则删除文件
  if (this.documentFile && /^[0-9a-fA-F]{24}$/.test(this.documentFile)) {
    try {
      await deleteFile(this.documentFile);
    } catch (error) {
      console.error('Error deleting document file in pre-delete hook:', error);
    }
  }
});

// 创建并导出News模型
module.exports = mongoose.model('News', NewsSchema);
