// 导入mongoose模块
const mongoose = require('mongoose');
// 导入bcryptjs模块用于密码加密
const bcrypt = require('bcryptjs');

// 定义用户Schema
const UserSchema = new mongoose.Schema({
  // 用户名
  name: {
    type: String,
    required: [true, '请提供用户名'], // 必填字段，自定义错误信息
    trim: true, // 去除首尾空格
    maxlength: [8, '用户名不能超过8个字符'] // 最大长度限制
  },
  // 账户（邮箱或手机号）
  account: {
    type: String,
    required: [true, '请提供邮箱或手机号'], // 必填字段
    unique: true, // 唯一索引，确保账户不重复
    trim: true, // 去除首尾空格
    lowercase: true // 转换为小写存储
  },
  // 密码
  password: {
    type: String,
    required: [true, '请提供密码'], // 必填字段
    minlength: [6, '密码不能少于6个字符'] // 最小长度限制
  },
  // 用户角色（可选，默认user）
  role: {
    type: String,
    enum: ['user', 'verified', 'admin', 'super_admin'], // 四级角色体系
    default: 'user' // 默认角色为user
  },
  // 认证状态
  verified: {
    type: Boolean,
    default: false
  },
  // 认证时间
  verifiedAt: {
    type: Date
  },
  // 新增字段：个人中心相关
  nickname: {
    type: String,
    trim: true,
    maxlength: [20, '昵称不能超过20个字符']
  },
  avatar: {
    type: String, // GridFS文件ID或URL
    default: null
  },
  phone: {
    type: String,
    trim: true,
    match: [/^1[3-9]\d{9}$/, '请提供有效的手机号']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: ''
  },
  birthDate: {
    type: Date
  },
  lastLoginAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  // 关联机构和学校（外键引用）
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    default: null
  },
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now // 默认值为当前时间
  },
  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 密码加密中间件：在保存用户之前加密密码
UserSchema.pre('save', async function() {
  // 更新时间
  this.updatedAt = new Date();

  // 如果密码没有被修改，直接跳过加密
  if (!this.isModified('password')) {
    return;
  }

  // 生成盐值，用于加密
  const salt = await bcrypt.genSalt(12);
  // 使用盐值加密密码
  this.password = await bcrypt.hash(this.password, salt);
});

// 自定义方法：验证密码
UserSchema.methods.matchPassword = async function(enteredPassword) {
  // 比较输入的密码和数据库中加密的密码
  return await bcrypt.compare(enteredPassword, this.password);
};

// 创建并导出User模型
// 模型名称为'User'，对应的集合名称会自动转换为复数形式'users'
module.exports = mongoose.model('User', UserSchema);
