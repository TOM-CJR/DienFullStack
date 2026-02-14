// 奖学金API路由
const express = require('express');
const router = express.Router();
const Scholarship = require('../models/Scholarship');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { uploadMemory } = require('../middleware/uploadMiddleware');
const { uploadFile, deleteFile } = require('../utils/gridfsStorage');

// GET /api/scholarships - 获取奖学金列表（公开接口，支持分页和筛选）
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      keyword,
      sortBy = 'createdAt',
      order = 'desc',
      isPublic = 'true' // 是否公开访问（前端展示）
    } = req.query;

    // 构建查询条件
    const query = {};

    // 如果是公开访问（前端展示），只显示发布日期 <= 当前时间的奖学金
    if (isPublic === 'true') {
      query.publishDate = { $lte: new Date() };
      query.status = 'published'; // 只显示已发布的奖学金
    } else {
      // 管理后台访问，可以看到所有奖学金
      if (status) {
        query.status = status;
      }
    }

    // 类型筛选
    if (type) {
      query.type = type;
    }

    // 关键词搜索（标题或描述）
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { requirements: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 计算分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 排序
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    // 查询奖学金列表
    const scholarshipList = await Scholarship.find(query)
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // 计算总数
    const total = await Scholarship.countDocuments(query);

    res.json({
      success: true,
      data: scholarshipList,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting scholarship list:', error);
    res.status(500).json({
      success: false,
      message: '获取奖学金列表失败',
      error: error.message
    });
  }
});

// GET /api/scholarships/:id - 获取奖学金详情（公开接口，自动增加浏览量）
router.get('/:id', async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id).populate('createdBy', 'name email');

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: '奖学金不存在'
      });
    }

    // 增加浏览量
    scholarship.views += 1;
    await scholarship.save();

    res.json({
      success: true,
      data: scholarship
    });
  } catch (error) {
    console.error('Error getting scholarship detail:', error);
    res.status(500).json({
      success: false,
      message: '获取奖学金详情失败',
      error: error.message
    });
  }
});

// POST /api/scholarships - 创建奖学金（需要admin权限，支持文档上传）
router.post('/', authMiddleware, isAdmin, uploadMemory.single('documentFile'), async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      type,
      requirements,
      quota,
      publishDate,
      applicationDeadline,
      announcementDate,
      status,
      tags
    } = req.body;

    // 验证必填字段
    if (!title || !description || !amount || !type || !publishDate || !applicationDeadline || !announcementDate) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段（标题、描述、金额、类型、发布日期、申请截止日期、公布日期）'
      });
    }

    // 创建奖学金对象
    const scholarshipData = {
      title,
      description,
      amount: parseFloat(amount),
      type,
      requirements: requirements || '',
      quota: quota ? parseInt(quota) : undefined,
      publishDate,
      applicationDeadline,
      announcementDate,
      status: status || 'draft',
      createdBy: req.user.id,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : []
    };

    // 如果上传了文档文件
    if (req.file) {
      // 修复文件名编码问题
      let fixedFilename = req.file.originalname;
      try {
        // 检测并修复双重编码问题
        const buffer = Buffer.from(fixedFilename, 'latin1');
        fixedFilename = buffer.toString('utf8');
      } catch (err) {
        // 使用原始名称
      }

      try {
        // 上传到 GridFS
        const fileId = await uploadFile(req.file.buffer, {
          filename: fixedFilename,
          contentType: req.file.mimetype
        });
        // 存储文件 ID 和文件信息
        if (fileId) {
          scholarshipData.documentFile = fileId;
          scholarshipData.documentFileName = fixedFilename;
          scholarshipData.documentFileType = req.file.mimetype;
        } else {
          // 如果 GridFS 上传失败，回退到磁盘存储
          scholarshipData.documentFile = `/uploads/scholarships/${req.file.filename}`;
          scholarshipData.documentFileName = fixedFilename;
          scholarshipData.documentFileType = req.file.mimetype;
        }
      } catch (error) {
        console.error('Error uploading document to GridFS:', error);
        // 如果 GridFS 上传失败，回退到磁盘存储
        scholarshipData.documentFile = `/uploads/scholarships/${req.file.filename}`;
        scholarshipData.documentFileName = fixedFilename;
        scholarshipData.documentFileType = req.file.mimetype;
      }
    }

    const scholarship = await Scholarship.create(scholarshipData);

    res.status(201).json({
      success: true,
      message: '奖学金创建成功',
      data: scholarship
    });
  } catch (error) {
    console.error('Error creating scholarship:', error);
    res.status(400).json({
      success: false,
      message: '奖学金创建失败',
      error: error.message
    });
  }
});

// PUT /api/scholarships/:id - 更新奖学金（需要admin权限，支持文档上传）
router.put('/:id', authMiddleware, isAdmin, uploadMemory.single('documentFile'), async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: '奖学金不存在'
      });
    }

    const {
      title,
      description,
      amount,
      type,
      requirements,
      quota,
      publishDate,
      applicationDeadline,
      announcementDate,
      status,
      tags
    } = req.body;

    // 更新字段
    if (title) scholarship.title = title;
    if (description) scholarship.description = description;
    if (amount !== undefined) scholarship.amount = parseFloat(amount);
    if (type) scholarship.type = type;
    if (requirements !== undefined) scholarship.requirements = requirements;
    if (quota !== undefined) scholarship.quota = parseInt(quota);
    if (publishDate) scholarship.publishDate = publishDate;
    if (applicationDeadline) scholarship.applicationDeadline = applicationDeadline;
    if (announcementDate) scholarship.announcementDate = announcementDate;
    if (status) scholarship.status = status;
    if (tags) {
      scholarship.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    // 处理文档更新
    const removeDocument = req.body.removeDocument === 'true';

    if (removeDocument) {
      // 用户要求删除文档
      const oldDocumentFile = scholarship.documentFile;
      const isOldDocumentGridFS = oldDocumentFile && /^[0-9a-fA-F]{24}$/.test(oldDocumentFile);

      // 删除旧文档
      if (isOldDocumentGridFS) {
        try {
          await deleteFile(oldDocumentFile);
          console.log('Successfully deleted old document file');
        } catch (deleteError) {
          console.error('Error deleting old document file:', deleteError);
        }
      }

      // 清空文档字段
      scholarship.documentFile = undefined;
      scholarship.documentFileName = undefined;
      scholarship.documentFileType = undefined;

    } else if (req.file) {
      // 上传了新的文档文件
      // 修复文件名编码问题
      let fixedFilename = req.file.originalname;
      try {
        const buffer = Buffer.from(fixedFilename, 'latin1');
        fixedFilename = buffer.toString('utf8');
      } catch (err) {
        // 使用原始名称
      }

      // 保存旧的文档文件ID（如果存在且是GridFS文件）
      const oldDocumentFile = scholarship.documentFile;
      const isOldDocumentGridFS = oldDocumentFile && /^[0-9a-fA-F]{24}$/.test(oldDocumentFile);

      try {
        // 上传到 GridFS
        const fileId = await uploadFile(req.file.buffer, {
          filename: fixedFilename,
          contentType: req.file.mimetype
        });
        // 存储文件 ID 和文件信息
        if (fileId) {
          scholarship.documentFile = fileId;
          scholarship.documentFileName = fixedFilename;
          scholarship.documentFileType = req.file.mimetype;

          // 新文档上传成功后，删除旧文档
          if (isOldDocumentGridFS) {
            try {
              await deleteFile(oldDocumentFile);
              console.log('Successfully deleted old document file');
            } catch (deleteError) {
              console.error('Error deleting old document file:', deleteError);
            }
          }
        } else {
          // 如果 GridFS 上传失败，回退到磁盘存储
          scholarship.documentFile = `/uploads/scholarships/${req.file.filename}`;
          scholarship.documentFileName = fixedFilename;
          scholarship.documentFileType = req.file.mimetype;
        }
      } catch (error) {
        console.error('Error uploading new document to GridFS:', error);
        // 如果 GridFS 上传失败，回退到磁盘存储
        scholarship.documentFile = `/uploads/scholarships/${req.file.filename}`;
        scholarship.documentFileName = fixedFilename;
        scholarship.documentFileType = req.file.mimetype;
      }
    }

    await scholarship.save();

    // 重新查询以获取populated数据
    const updatedScholarship = await Scholarship.findById(scholarship._id).populate('createdBy', 'name email');

    res.json({
      success: true,
      message: '奖学金更新成功',
      data: updatedScholarship
    });
  } catch (error) {
    console.error('Error updating scholarship:', error);
    res.status(400).json({
      success: false,
      message: '奖学金更新失败',
      error: error.message
    });
  }
});

// DELETE /api/scholarships/:id - 删除奖学金（需要admin权限）
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: '奖学金不存在'
      });
    }

    // 删除相关的申请记录
    const ScholarshipApplication = require('../models/ScholarshipApplication');
    try {
      const deleteResult = await ScholarshipApplication.deleteMany({ scholarship: req.params.id });
      console.log(`Deleted ${deleteResult.deletedCount} scholarship applications`);
    } catch (error) {
      console.error('Error deleting related applications:', error);
      // 继续删除奖学金，即使申请记录删除失败
    }

    // 如果有文档文件且是GridFS文件ID，则删除文件
    if (scholarship.documentFile && /^[0-9a-fA-F]{24}$/.test(scholarship.documentFile)) {
      try {
        await deleteFile(scholarship.documentFile);
        console.log('Successfully deleted scholarship document file');
      } catch (error) {
        console.error('Error deleting document file from GridFS:', error);
        // 继续删除奖学金，即使文档删除失败
      }
    }

    // 删除奖学金记录
    await Scholarship.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '奖学金删除成功',
      data: scholarship
    });
  } catch (error) {
    console.error('Error deleting scholarship:', error);
    res.status(500).json({
      success: false,
      message: '奖学金删除失败',
      error: error.message
    });
  }
});

// POST /api/scholarships/:id/apply - 申请奖学金（已弃用，请使用 /api/scholarship-applications）
// 保留此接口以兼容旧代码
router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    // 重定向到新的申请接口
    const ScholarshipApplication = require('../models/ScholarshipApplication');

    const scholarship = await Scholarship.findById(req.params.id);

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
      scholarship: req.params.id
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
      scholarship: req.params.id,
      status: 'pending'
    });

    // 增加申请数
    scholarship.currentApplications += 1;
    await scholarship.save();

    res.json({
      success: true,
      message: '申请成功',
      data: {
        applicationId: application._id,
        scholarshipId: scholarship._id,
        scholarshipTitle: scholarship.title,
        amount: scholarship.amount,
        currentApplications: scholarship.currentApplications,
        quota: scholarship.quota
      }
    });
  } catch (error) {
    console.error('Error applying for scholarship:', error);

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

module.exports = router;
