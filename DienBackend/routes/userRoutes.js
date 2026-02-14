// 导入express模块并创建路由
const express = require('express');
const router = express.Router();
// 导入User模型
const User = require('../models/User');
// 导入JWT工具函数
const { generateToken } = require('../utils/jwtUtils');
// 导入认证中间件
const authMiddleware = require('../middleware/authMiddleware');
// 导入文件上传中间件
const { uploadMemory } = require('../middleware/uploadMiddleware');
// 导入GridFS工具
const { uploadFile, deleteFile } = require('../utils/gridfsStorage');

router.post('/register', async (req, res) => {
  try {
    // 从请求体中获取用户注册数据
    const { name, account, password } = req.body;

    // 检查账户是否已存在
    const existingUser = await User.findOne({ account });
    if (existingUser) {
      return res.status(400).json({ success: false, message: '该账户已被注册' });
    }

    // 创建新用户
    const user = await User.create({
      name,
      account,
      password
    });

    // 生成 JWT Token
    const token = generateToken({
      id: user._id.toString(),
      account: user.account,
      role: user.role
    });

    // 返回注册成功响应
    res.status(201).json({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: user._id,
        name: user.name,
        account: user.account,
        role: user.role
      }
    });
  } catch (error) {
    // 处理错误
    console.error('注册失败:', error);
    res.status(500).json({ success: false, message: '注册失败，请稍后重试' });
  }
});

router.post('/login', async (req, res) => {
  try {
    // 从请求体中获取用户登录数据
    const { account, password } = req.body;

    // 检查账户是否已存在
    const existingUser = await User.findOne({ account });
    if (!existingUser) {
      return res.status(400).json({ success: false, message: '该账户未被注册' });
    }
    // 检查密码是否匹配
    if (!(await existingUser.matchPassword(password))) {
      return res.status(400).json({ success: false, message: '密码错误' });
    }

    // 更新最后登录时间
    existingUser.lastLoginAt = new Date();
    await existingUser.save();

    // 生成 JWT Token
    const token = generateToken({
      id: existingUser._id.toString(),
      account: existingUser.account,
      role: existingUser.role
    });

    // 返回查询到的用户信息
    res.status(200).json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: existingUser._id,
        name: existingUser.name,
        nickname: existingUser.nickname,
        account: existingUser.account,
        role: existingUser.role,
        avatar: existingUser.avatar
      }
    });
  } catch (error) {
    // 处理错误
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败，请稍后重试' });
  }
});

// 刷新 Token 接口（需要认证）
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    // 从中间件获取当前用户信息
    const { id, account, role } = req.user;

    // 生成新的 token
    const newToken = generateToken({ id, account, role });

    res.status(200).json({
      success: true,
      message: 'Token 刷新成功',
      token: newToken
    });
  } catch (error) {
    console.error('Token 刷新失败:', error);
    res.status(500).json({
      success: false,
      message: 'Token 刷新失败，请重新登录'
    });
  }
});

// 获取用户信息接口（需要认证）
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // 从中间件获取用户 ID
    const userId = req.user.id;

    // 查询用户信息（排除密码字段），关联机构和学校
    const user = await User.findById(userId)
      .select('-password')
      .populate('organization', 'name status')
      .populate('school', 'name status');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        nickname: user.nickname,
        account: user.account,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        gender: user.gender,
        birthDate: user.birthDate,
        status: user.status,
        organization: user.organization,
        school: user.school,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

// 更新个人资料接口（需要认证）
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, nickname, phone, gender, birthDate } = req.body;

    // 查询用户
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新字段（只更新允许的字段）
    if (name !== undefined) user.name = name;
    if (nickname !== undefined) user.nickname = nickname;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
    if (birthDate !== undefined) user.birthDate = birthDate;

    await user.save();

    res.status(200).json({
      success: true,
      message: '个人资料更新成功',
      user: {
        id: user._id,
        name: user.name,
        nickname: user.nickname,
        account: user.account,
        phone: user.phone,
        gender: user.gender,
        birthDate: user.birthDate
      }
    });
  } catch (error) {
    console.error('更新个人资料失败:', error);
    res.status(500).json({
      success: false,
      message: '更新个人资料失败'
    });
  }
});

// 上传头像接口（需要认证）
router.post('/avatar', authMiddleware, uploadMemory.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传头像文件'
      });
    }

    // 验证文件类型（只允许图片）
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: '请上传图片文件'
      });
    }

    // 验证文件大小（限制5MB）
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: '图片大小不能超过5MB'
      });
    }

    // 修复中文文件名编码
    let fixedFilename = req.file.originalname;
    try {
      const buffer = Buffer.from(fixedFilename, 'latin1');
      fixedFilename = buffer.toString('utf8');
    } catch (err) {
      console.warn('文件名编码转换失败:', err);
    }

    // 上传到GridFS
    const fileId = await uploadFile(req.file.buffer, {
      filename: fixedFilename,
      contentType: req.file.mimetype,
      metadata: {
        userId: req.user.id,
        type: 'avatar',
        uploadedAt: new Date()
      }
    });

    if (!fileId) {
      return res.status(500).json({
        success: false,
        message: '头像上传失败'
      });
    }

    // 获取用户并删除旧头像
    const user = await User.findById(req.user.id);
    if (user.avatar && /^[0-9a-fA-F]{24}$/.test(user.avatar)) {
      await deleteFile(user.avatar);
    }

    // 更新用户avatar字段
    user.avatar = fileId;
    await user.save();

    res.status(200).json({
      success: true,
      message: '头像上传成功',
      avatar: fileId
    });
  } catch (error) {
    console.error('头像上传失败:', error);
    res.status(500).json({
      success: false,
      message: '头像上传失败'
    });
  }
});

// 删除头像接口（需要认证）
router.delete('/avatar', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 如果存在头像且是GridFS ID，则删除
    if (user.avatar && /^[0-9a-fA-F]{24}$/.test(user.avatar)) {
      await deleteFile(user.avatar);
    }

    // 清空头像字段
    user.avatar = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: '头像删除成功'
    });
  } catch (error) {
    console.error('头像删除失败:', error);
    res.status(500).json({
      success: false,
      message: '头像删除失败'
    });
  }
});

// 修改密码接口（需要认证）
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // 验证新密码格式
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码不能少于6个字符'
      });
    }

    // 获取用户并验证旧密码
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: '旧密码错误'
      });
    }

    // 更新密码（触发pre-save加密中间件）
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('密码修改失败:', error);
    res.status(500).json({
      success: false,
      message: '密码修改失败'
    });
  }
});

// 导出路由
module.exports = router;
