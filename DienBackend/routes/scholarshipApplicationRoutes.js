// 奖学金申请API路由
const express = require('express');
const router = express.Router();
const ScholarshipApplication = require('../models/ScholarshipApplication');
const Scholarship = require('../models/Scholarship');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// POST /api/scholarship-applications - 提交奖学金申请（需要认证）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { scholarshipId } = req.body;

    if (!scholarshipId) {
      return res.status(400).json({
        success: false,
        message: '请提供奖学金ID'
      });
    }

    // 查询奖学金信息
    const scholarship = await Scholarship.findById(scholarshipId);

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: '奖学金不存在'
      });
    }

    // 检查奖学金状态
    if (scholarship.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: '该奖学金尚未发布'
      });
    }

    // 检查发布日期
    if (new Date() < scholarship.publishDate) {
      return res.status(400).json({
        success: false,
        message: '该奖学金尚未开始申请'
      });
    }

    // 检查申请截止日期
    if (new Date() > scholarship.applicationDeadline) {
      return res.status(400).json({
        success: false,
        message: '申请已截止'
      });
    }

    // 检查是否已满额（如果设置了名额）
    if (scholarship.quota && scholarship.currentApplications >= scholarship.quota) {
      return res.status(400).json({
        success: false,
        message: '申请名额已满'
      });
    }

    // 检查用户是否已经申请过
    const existingApplication = await ScholarshipApplication.findOne({
      user: req.user.id,
      scholarship: scholarshipId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: '您已经申请过该奖学金'
      });
    }

    // 创建申请记录
    const application = await ScholarshipApplication.create({
      user: req.user.id,
      scholarship: scholarshipId,
      status: 'pending'
    });

    // 增加奖学金的申请数
    scholarship.currentApplications += 1;
    await scholarship.save();

    // 重新查询以获取populated数据
    const populatedApplication = await ScholarshipApplication.findById(application._id)
      .populate('scholarship', 'title amount type applicationDeadline announcementDate')
      .populate('user', 'name account email');

    res.status(201).json({
      success: true,
      message: '申请成功',
      data: populatedApplication
    });
  } catch (error) {
    console.error('Error creating scholarship application:', error);

    // 处理重复申请错误
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '您已经申请过该奖学金'
      });
    }

    res.status(500).json({
      success: false,
      message: '申请失败',
      error: error.message
    });
  }
});

// GET /api/scholarship-applications/my - 获取我的申请列表（需要认证）
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const applications = await ScholarshipApplication.find({ user: req.user.id })
      .populate('scholarship', 'title amount type publishDate applicationDeadline announcementDate status')
      .populate('reviewedBy', 'name account')
      .sort({ appliedAt: -1 });

    // 过滤掉奖学金已被删除的申请记录
    const validApplications = applications.filter(app => app.scholarship != null);

    // 如果有无效的申请记录，删除它们
    const invalidApplications = applications.filter(app => app.scholarship == null);
    if (invalidApplications.length > 0) {
      const invalidIds = invalidApplications.map(app => app._id);
      await ScholarshipApplication.deleteMany({ _id: { $in: invalidIds } });
      console.log(`Cleaned up ${invalidApplications.length} invalid scholarship applications`);
    }

    res.json({
      success: true,
      data: validApplications
    });
  } catch (error) {
    console.error('Error getting my applications:', error);
    res.status(500).json({
      success: false,
      message: '获取申请列表失败',
      error: error.message
    });
  }
});

// GET /api/scholarship-applications - 获取所有申请列表（管理员权限，支持筛选和搜索）
router.get('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const {
      status,
      scholarshipId,
      userSearch, // 搜索用户（账号/邮箱/姓名）
      page = 1,
      limit = 20,
      sortBy = 'appliedAt',
      order = 'desc'
    } = req.query;

    // 构建查询条件
    const query = {};

    // 状态筛选
    if (status) {
      query.status = status;
    }

    // 奖学金筛选
    if (scholarshipId) {
      query.scholarship = scholarshipId;
    }

    // 如果有用户搜索，先查询用户
    if (userSearch) {
      const User = require('../models/User');
      const users = await User.find({
        $or: [
          { account: { $regex: userSearch, $options: 'i' } },
          { email: { $regex: userSearch, $options: 'i' } },
          { name: { $regex: userSearch, $options: 'i' } },
          { phone: { $regex: userSearch, $options: 'i' } }
        ]
      }).select('_id');

      query.user = { $in: users.map(u => u._id) };
    }

    // 计算分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 排序
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    // 查询申请列表
    const applications = await ScholarshipApplication.find(query)
      .populate('user', 'name account email phone')
      .populate('scholarship', 'title amount type quota currentApplications applicationDeadline announcementDate')
      .populate('reviewedBy', 'name account')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // 过滤掉奖学金已被删除的申请记录
    const validApplications = applications.filter(app => app.scholarship != null);

    // 如果有无效的申请记录，删除它们
    const invalidApplications = applications.filter(app => app.scholarship == null);
    if (invalidApplications.length > 0) {
      const invalidIds = invalidApplications.map(app => app._id);
      await ScholarshipApplication.deleteMany({ _id: { $in: invalidIds } });
      console.log(`Cleaned up ${invalidApplications.length} invalid scholarship applications`);
    }

    // 计算有效数据的总数
    const total = await ScholarshipApplication.countDocuments(query);

    res.json({
      success: true,
      data: validApplications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting applications:', error);
    res.status(500).json({
      success: false,
      message: '获取申请列表失败',
      error: error.message
    });
  }
});

// GET /api/scholarship-applications/:id - 获取申请详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const application = await ScholarshipApplication.findById(req.params.id)
      .populate('user', 'name account email phone')
      .populate('scholarship', 'title amount type description requirements quota currentApplications publishDate applicationDeadline announcementDate')
      .populate('reviewedBy', 'name account');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: '申请记录不存在'
      });
    }

    // 如果不是管理员，只能查看自己的申请
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && application.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权查看此申请'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error getting application detail:', error);
    res.status(500).json({
      success: false,
      message: '获取申请详情失败',
      error: error.message
    });
  }
});

// PUT /api/scholarship-applications/:id/review - 审核申请（管理员权限）
router.put('/:id/review', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { status, reviewComment } = req.body;

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的审核状态（approved/rejected/pending）'
      });
    }

    const application = await ScholarshipApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: '申请记录不存在'
      });
    }

    // 记录旧状态，用于判断是否需要更新奖学金的申请计数
    const oldStatus = application.status;

    // 更新申请状态
    application.status = status;
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    application.reviewComment = reviewComment || '';

    await application.save();

    // 如果状态从pending改为rejected，需要减少奖学金的申请数
    // 如果状态从rejected改为approved或pending，需要增加奖学金的申请数
    const scholarship = await Scholarship.findById(application.scholarship);
    if (scholarship) {
      if (oldStatus === 'pending' && status === 'rejected') {
        // 减少申请数（被拒绝）
        scholarship.currentApplications = Math.max(0, scholarship.currentApplications - 1);
        await scholarship.save();
      } else if (oldStatus === 'rejected' && (status === 'approved' || status === 'pending')) {
        // 增加申请数（恢复申请）
        scholarship.currentApplications += 1;
        await scholarship.save();
      }
    }

    // 重新查询以获取populated数据
    const updatedApplication = await ScholarshipApplication.findById(application._id)
      .populate('user', 'name account email phone')
      .populate('scholarship', 'title amount type')
      .populate('reviewedBy', 'name account');

    res.json({
      success: true,
      message: '审核成功',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Error reviewing application:', error);
    res.status(500).json({
      success: false,
      message: '审核失败',
      error: error.message
    });
  }
});

// DELETE /api/scholarship-applications/:id - 取消申请（用户自己可以删除pending状态的申请）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const application = await ScholarshipApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: '申请记录不存在'
      });
    }

    // 只有申请人自己可以取消申请，且只能取消待审核的申请
    if (application.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权取消此申请'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '只能取消待审核的申请'
      });
    }

    // 减少奖学金的申请数
    const scholarship = await Scholarship.findById(application.scholarship);
    if (scholarship) {
      scholarship.currentApplications = Math.max(0, scholarship.currentApplications - 1);
      await scholarship.save();
    }

    // 删除申请记录
    await ScholarshipApplication.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '申请已取消',
      data: application
    });
  } catch (error) {
    console.error('Error canceling application:', error);
    res.status(500).json({
      success: false,
      message: '取消申请失败',
      error: error.message
    });
  }
});

module.exports = router;
