// 奖学金数据模型
const mongoose = require('mongoose');

const ScholarshipSchema = new mongoose.Schema({
  // 奖学金标题
  title: {
    type: String,
    required: [true, '请提供奖学金标题'],
    trim: true,
    maxlength: [200, '标题不能超过200个字符']
  },

  // 奖学金描述
  description: {
    type: String,
    required: [true, '请提供奖学金描述'],
    trim: true
  },

  // 奖学金金额
  amount: {
    type: Number,
    required: [true, '请提供奖学金金额'],
    min: [0, '金额不能为负数']
  },

  // 奖学金类型
  type: {
    type: String,
    enum: {
      values: ['merit', 'need', 'special', 'research'],
      message: '{VALUE} 不是有效的奖学金类型'
    },
    required: [true, '请提供奖学金类型']
  },

  // 申请要求
  requirements: {
    type: String,
    trim: true
  },

  // 名额
  quota: {
    type: Number,
    min: [1, '名额至少为1']
  },

  // 当前申请数
  currentApplications: {
    type: Number,
    default: 0,
    min: 0
  },

  // 发布日期（决定前端是否显示）
  publishDate: {
    type: Date,
    required: [true, '请提供发布日期']
  },

  // 申请截止日期
  applicationDeadline: {
    type: Date,
    required: [true, '请提供申请截止日期']
  },

  // 公布日期
  announcementDate: {
    type: Date,
    required: [true, '请提供公布日期']
  },

  // 附件文档（只能上传一份，参考新闻模型）
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

  // 奖学金状态
  status: {
    type: String,
    enum: {
      values: ['draft', 'published', 'archived'],
      message: '{VALUE} 不是有效的状态'
    },
    default: 'draft'
  },

  // 创建者（关联到User模型）
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请提供创建者信息']
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
ScholarshipSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// 删除前钩子 - 清理关联的GridFS文件
// 注意：这个钩子只在使用 document.deleteOne() 时触发，不在 Model.deleteOne() 时触发
ScholarshipSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const { deleteFile } = require('../utils/gridfsStorage');

  // 如果有文档文件且是GridFS文件ID，则删除文件
  if (this.documentFile && /^[0-9a-fA-F]{24}$/.test(this.documentFile)) {
    try {
      await deleteFile(this.documentFile);
      console.log('Successfully deleted scholarship document file in pre-delete hook');
    } catch (error) {
      console.error('Error deleting document file in pre-delete hook:', error);
    }
  }
});

// 创建并导出Scholarship模型
module.exports = mongoose.model('Scholarship', ScholarshipSchema);
