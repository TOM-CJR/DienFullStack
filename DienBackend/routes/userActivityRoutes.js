// 用户活动记录API路由
const express = require('express');
const router = express.Router();
const UserActivity = require('../models/UserActivity');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/user-activities/my - 获取当前用户的所有活动记录
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { activityType, resourceType, status, page = 1, limit = 50 } = req.query;

    // 构建查询条件
    const query = { userId: req.user.id };

    if (activityType) {
      query.activityType = activityType;
    }

    if (resourceType) {
      query.resourceType = resourceType;
    }

    if (status) {
      query.status = status;
    }

    // 计算分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询活动记录
    const activities = await UserActivity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 计算总数
    const total = await UserActivity.countDocuments(query);

    res.json({
      success: true,
      data: activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取活动记录失败',
      error: error.message
    });
  }
});

// GET /api/user-activities/check - 检查是否存在某个活动记录
router.get('/check', authMiddleware, async (req, res) => {
  try {
    const { activityType, resourceId } = req.query;

    if (!activityType || !resourceId) {
      return res.status(400).json({
        success: false,
        message: '请提供activityType和resourceId参数'
      });
    }

    const activity = await UserActivity.findOne({
      userId: req.user.id,
      activityType,
      resourceId,
      status: 'active'
    });

    res.json({
      success: true,
      exists: !!activity,
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '检查活动记录失败',
      error: error.message
    });
  }
});

// POST /api/user-activities - 创建活动记录
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { activityType, resourceType, resourceId, data } = req.body;

    // 验证必填字段
    if (!activityType || !resourceType || !resourceId) {
      return res.status(400).json({
        success: false,
        message: '请提供activityType、resourceType和resourceId'
      });
    }

    // 对于答题记录，允许重复提交，使用更新或创建
    if (activityType === 'question_submit') {
      const activity = await UserActivity.findOneAndUpdate(
        {
          userId: req.user.id,
          activityType,
          resourceId
        },
        {
          userId: req.user.id,
          activityType,
          resourceType,
          resourceId,
          data: data || {},
          status: 'active',
          updatedAt: Date.now()
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      return res.status(201).json({
        success: true,
        message: '答题记录保存成功',
        data: activity
      });
    }

    // 对于课件收藏，检查是否已存在
    if (activityType === 'courseware_favorite') {
      const existingActivity = await UserActivity.findOne({
        userId: req.user.id,
        activityType,
        resourceId
      });

      if (existingActivity) {
        return res.status(400).json({
          success: false,
          message: '该课件已收藏',
          code: 'ALREADY_FAVORITED'
        });
      }
    }

    // 其他类型的活动记录，使用原有的创建逻辑
    const activityData = {
      userId: req.user.id,
      activityType,
      resourceType,
      resourceId,
      data: data || {},
      status: 'active'
    };

    const activity = await UserActivity.create(activityData);

    // 如果是课件收藏，增加课件的收藏次数
    if (activityType === 'courseware_favorite' && resourceType === 'courseware') {
      const Courseware = require('../models/Courseware');
      try {
        await Courseware.findByIdAndUpdate(resourceId, {
          $inc: { favoriteCount: 1 }
        });
      } catch (err) {
        console.error('更新课件收藏次数失败:', err);
      }
    }

    res.status(201).json({
      success: true,
      message: '活动记录创建成功',
      data: activity
    });
  } catch (error) {
    // 处理重复记录错误
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '该活动记录已存在',
        error: error.message
      });
    }

    // 处理验证错误
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        error: error.message
      });
    }

    // 处理CastError (通常是ObjectId格式错误)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: '资源ID格式不正确',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: '创建活动记录失败',
      error: error.message
    });
  }
});

// DELETE /api/user-activities/:id - 删除活动记录
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const activity = await UserActivity.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: '活动记录不存在或无权删除'
      });
    }

    // 如果是课件收藏，减少课件的收藏次数
    if (activity.activityType === 'courseware_favorite' && activity.resourceType === 'courseware') {
      const Courseware = require('../models/Courseware');
      try {
        await Courseware.findByIdAndUpdate(activity.resourceId, {
          $inc: { favoriteCount: -1 }
        });
      } catch (err) {
        console.error('更新课件收藏次数失败:', err);
      }
    }

    await activity.deleteOne();

    res.json({
      success: true,
      message: '活动记录删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除活动记录失败',
      error: error.message
    });
  }
});

// DELETE /api/user-activities/by-resource/:resourceId - 根据资源ID删除活动记录
router.delete('/by-resource/:resourceId', authMiddleware, async (req, res) => {
  try {
    const { activityType } = req.query;

    if (!activityType) {
      return res.status(400).json({
        success: false,
        message: '请提供activityType参数'
      });
    }

    // 先查找活动记录
    const activity = await UserActivity.findOne({
      userId: req.user.id,
      activityType,
      resourceId: req.params.resourceId
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: '活动记录不存在'
      });
    }

    // 如果是课件收藏，减少课件的收藏次数
    if (activityType === 'courseware_favorite' && activity.resourceType === 'courseware') {
      const Courseware = require('../models/Courseware');
      try {
        await Courseware.findByIdAndUpdate(req.params.resourceId, {
          $inc: { favoriteCount: -1 }
        });
      } catch (err) {
        console.error('更新课件收藏次数失败:', err);
      }
    }

    // 删除活动记录
    await activity.deleteOne();

    res.json({
      success: true,
      message: '活动记录删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除活动记录失败',
      error: error.message
    });
  }
});

module.exports = router;
