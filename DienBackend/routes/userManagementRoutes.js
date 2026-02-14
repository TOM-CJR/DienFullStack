// 用户管理路由（仅超级管理员可访问）
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { isSuperAdmin } = require('../middleware/roleMiddleware');

// 获取所有用户列表（分页、搜索、筛选）
router.get('/users', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      keyword = '',
      role = '',
      status = ''
    } = req.query;

    // 构建查询条件
    const query = {};

    // 关键词搜索（用户名或账号）
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { nickname: { $regex: keyword, $options: 'i' } },
        { account: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 角色筛选
    if (role) {
      query.role = role;
    }

    // 状态筛选
    if (status) {
      query.status = status;
    }

    // 计算分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询用户（排除密码）
    const users = await User.find(query)
      .select('-password')
      .populate('organization', 'name status')
      .populate('school', 'name status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 获取总数
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

// 获取单个用户详细信息
router.get('/users/:id', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('organization')
      .populate('school');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

// 更改用户角色
router.put('/users/:id/role', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    // 验证角色有效性
    if (!['user', 'verified', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: '无效的角色'
      });
    }

    // 防止修改自己的角色
    if (req.params.id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: '不能修改自己的角色'
      });
    }

    // 查询用户
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新角色
    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: '角色更新成功',
      data: {
        id: user._id,
        name: user.name,
        account: user.account,
        role: user.role
      }
    });
  } catch (error) {
    console.error('更改用户角色失败:', error);
    res.status(500).json({
      success: false,
      message: '更改用户角色失败'
    });
  }
});

// 更改用户状态
router.put('/users/:id/status', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    // 验证状态有效性
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态'
      });
    }

    // 防止修改自己的状态
    if (req.params.id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: '不能修改自己的状态'
      });
    }

    // 查询用户
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新状态
    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: '状态更新成功',
      data: {
        id: user._id,
        name: user.name,
        account: user.account,
        status: user.status
      }
    });
  } catch (error) {
    console.error('更改用户状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更改用户状态失败'
    });
  }
});

// 获取用户统计数据
router.get('/statistics', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    // 总用户数
    const totalUsers = await User.countDocuments();

    // 各角色用户数
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // 各状态用户数
    const statusStats = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // 今日新增用户
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsers = await User.countDocuments({
      createdAt: { $gte: today }
    });

    // 最近登录用户（最近7天）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActiveUsers = await User.countDocuments({
      lastLoginAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        todayUsers,
        recentActiveUsers,
        roleStats: roleStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        statusStats: statusStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

module.exports = router;
