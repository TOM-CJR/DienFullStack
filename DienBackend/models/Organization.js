// 导入mongoose模块
const mongoose = require('mongoose');

// 定义机构Schema
const OrganizationSchema = new mongoose.Schema({
  // 提交用户
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请提供用户ID']
  },
  // 机构名称
  name: {
    type: String,
    required: [true, '请提供机构名称'],
    trim: true,
    maxlength: [100, '机构名称不能超过100个字符']
  },
  // 机构代码
  code: {
    type: String,
    trim: true,
    maxlength: [50, '机构代码不能超过50个字符']
  },
  // 机构类型
  type: {
    type: String,
    trim: true,
    maxlength: [50, '机构类型不能超过50个字符']
  },
  // 联系人
  contactPerson: {
    type: String,
    required: [true, '请提供联系人'],
    trim: true,
    maxlength: [50, '联系人不能超过50个字符']
  },
  // 联系电话
  contactPhone: {
    type: String,
    required: [true, '请提供联系电话'],
    trim: true,
    match: [/^1[3-9]\d{9}$/, '请提供有效的手机号']
  },
  // 机构邮箱
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, '请提供有效的邮箱地址']
  },
  // 成立时间
  establishDate: {
    type: Date
  },
  // 省份
  province: {
    type: String,
    trim: true,
    maxlength: [50, '省份不能超过50个字符']
  },
  // 城市
  city: {
    type: String,
    trim: true,
    maxlength: [50, '城市不能超过50个字符']
  },
  // 详细地址
  address: {
    type: String,
    trim: true,
    maxlength: [200, '详细地址不能超过200个字符']
  },
  // 邮编
  zipCode: {
    type: String,
    trim: true,
    match: [/^\d{6}$/, '请提供有效的邮编（6位数字）']
  },
  // 机构简介
  description: {
    type: String,
    trim: true,
    maxlength: [1000, '机构简介不能超过1000个字符']
  },
  // 机构LOGO（GridFS ID）
  logo: {
    type: String,
    default: null
  },

  // 审核相关
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewComment: {
    type: String,
    trim: true,
    maxlength: [500, '审核意见不能超过500个字符']
  },

  // 证书附件数组
  certificates: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, '证书名称不能超过100个字符']
    },
    number: {
      type: String,
      trim: true,
      maxlength: [100, '证书编号不能超过100个字符']
    },
    fileId: {
      type: String,
      required: true
    },
    expiryDate: {
      type: Date
    }
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
OrganizationSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// 创建并导出Organization模型
module.exports = mongoose.model('Organization', OrganizationSchema);
