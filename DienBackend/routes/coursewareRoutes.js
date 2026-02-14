// 课件API路由
const express = require('express');
const router = express.Router();
const Courseware = require('../models/Courseware');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin, isVerified } = require('../middleware/roleMiddleware');
const { uploadMemory } = require('../middleware/uploadMiddleware');
const { uploadFile, deleteFile } = require('../utils/gridfsStorage');

// GET /api/courseware - 获取课件列表（公开接口，支持分页和筛选）
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      subject,
      level,
      status,
      keyword,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // 构建查询条件
    const query = {};

    // 状态筛选：如果指定了status则筛选，否则默认只显示已发布的课件
    if (status) {
      query.status = status;
    } else {
      query.status = 'published'; // 前端默认只显示已发布的课件
    }

    // 类型筛选
    if (type) {
      query.type = type;
    }

    // 学科筛选
    if (subject) {
      query.subject = subject;
    }

    // 难度等级筛选
    if (level) {
      query.level = level;
    }

    // 关键词搜索（名称或描述）
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 计算分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 排序
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    // 查询课件列表
    const coursewareList = await Courseware.find(query)
      .populate('uploader', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // 计算总数
    const total = await Courseware.countDocuments(query);

    res.json({
      success: true,
      data: coursewareList,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    // 错误已通过响应返回
    res.status(500).json({
      success: false,
      message: '获取课件列表失败',
      error: error.message
    });
  }
});

// GET /api/courseware/:id - 获取课件详情（公开接口，自动增加浏览量）
router.get('/:id', async (req, res) => {
  try {
    const courseware = await Courseware.findById(req.params.id).populate('uploader', 'name email');

    if (!courseware) {
      return res.status(404).json({
        success: false,
        message: '课件不存在'
      });
    }

    // 增加浏览次数
    courseware.viewCount += 1;
    await courseware.save();

    res.json({
      success: true,
      data: courseware
    });
  } catch (error) {
    // 错误已通过响应返回
    res.status(500).json({
      success: false,
      message: '获取课件详情失败',
      error: error.message
    });
  }
});

// POST /api/courseware - 创建课件（需要admin权限，支持文档上传）
router.post('/', authMiddleware, isAdmin, uploadMemory.single('documentFile'), async (req, res) => {
  try {
    const { name, description, type, subject, level, status } = req.body;

    // 验证必填字段
    if (!name || !description || !type || !subject || !level) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段（名称、描述、类型、学科、难度）'
      });
    }

    // 创建课件对象
    const coursewareData = {
      name,
      description,
      type,
      subject,
      level,
      status: status || 'draft',
      uploader: req.user.id
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
          coursewareData.documentFile = fileId;
          coursewareData.documentFileName = fixedFilename;
          coursewareData.documentFileType = req.file.mimetype;
        } else {
          // 如果 GridFS 上传失败，回退到磁盘存储
          coursewareData.documentFile = `/uploads/courseware/${req.file.filename}`;
          coursewareData.documentFileName = fixedFilename;
          coursewareData.documentFileType = req.file.mimetype;
        }
      } catch (error) {
        // 如果 GridFS 上传失败，回退到磁盘存储
        coursewareData.documentFile = `/uploads/courseware/${req.file.filename}`;
        coursewareData.documentFileName = fixedFilename;
        coursewareData.documentFileType = req.file.mimetype;
      }
    }

    const courseware = await Courseware.create(coursewareData);

    res.status(201).json({
      success: true,
      message: '课件创建成功',
      data: courseware
    });
  } catch (error) {
    // 错误已通过响应返回
    res.status(400).json({
      success: false,
      message: '课件创建失败',
      error: error.message
    });
  }
});

// PUT /api/courseware/:id - 更新课件（需要admin权限，支持文档上传）
router.put('/:id', authMiddleware, isAdmin, uploadMemory.single('documentFile'), async (req, res) => {
  try {
    const courseware = await Courseware.findById(req.params.id);

    if (!courseware) {
      return res.status(404).json({
        success: false,
        message: '课件不存在'
      });
    }

    const { name, description, type, subject, level, status } = req.body;

    // 更新字段
    if (name) courseware.name = name;
    if (description) courseware.description = description;
    if (type) courseware.type = type;
    if (subject) courseware.subject = subject;
    if (level) courseware.level = level;
    if (status) courseware.status = status;

    // 处理文档更新
    const removeDocument = req.body.removeDocument === 'true';

    if (removeDocument) {
      // 用户要求删除文档
      const oldDocumentFile = courseware.documentFile;
      const isOldDocumentGridFS = oldDocumentFile && /^[0-9a-fA-F]{24}$/.test(oldDocumentFile);

      // 删除旧文档
      if (isOldDocumentGridFS) {
        try {
          await deleteFile(oldDocumentFile);
        } catch (deleteError) {
          // 静默处理错误
        }
      }

      // 清空文档字段
      courseware.documentFile = undefined;
      courseware.documentFileName = undefined;
      courseware.documentFileType = undefined;

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
      const oldDocumentFile = courseware.documentFile;
      const isOldDocumentGridFS = oldDocumentFile && /^[0-9a-fA-F]{24}$/.test(oldDocumentFile);

      try {
        // 上传到 GridFS
        const fileId = await uploadFile(req.file.buffer, {
          filename: fixedFilename,
          contentType: req.file.mimetype
        });
        // 存储文件 ID 和文件信息
        if (fileId) {
          courseware.documentFile = fileId;
          courseware.documentFileName = fixedFilename;
          courseware.documentFileType = req.file.mimetype;

          // 新文档上传成功后，删除旧文档
          if (isOldDocumentGridFS) {
            try {
              await deleteFile(oldDocumentFile);
            } catch (deleteError) {
              // 静默处理错误
            }
          }
        } else {
          // 如果 GridFS 上传失败，回退到磁盘存储
          courseware.documentFile = `/uploads/courseware/${req.file.filename}`;
          courseware.documentFileName = fixedFilename;
          courseware.documentFileType = req.file.mimetype;
        }
      } catch (error) {
        // 如果 GridFS 上传失败，回退到磁盘存储
        courseware.documentFile = `/uploads/courseware/${req.file.filename}`;
        courseware.documentFileName = fixedFilename;
        courseware.documentFileType = req.file.mimetype;
      }
    }

    await courseware.save();

    // 重新查询以获取populated数据
    const updatedCourseware = await Courseware.findById(courseware._id).populate('uploader', 'name email');

    res.json({
      success: true,
      message: '课件更新成功',
      data: updatedCourseware
    });
  } catch (error) {
    // 错误已通过响应返回
    res.status(400).json({
      success: false,
      message: '课件更新失败',
      error: error.message
    });
  }
});

// DELETE /api/courseware/:id - 删除课件（需要admin权限）
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const courseware = await Courseware.findById(req.params.id);

    if (!courseware) {
      return res.status(404).json({
        success: false,
        message: '课件不存在'
      });
    }

    // 如果有文档文件且是GridFS文件ID，则删除文件
    if (courseware.documentFile && /^[0-9a-fA-F]{24}$/.test(courseware.documentFile)) {
      try {
        await deleteFile(courseware.documentFile);
      } catch (error) {
        // 继续删除课件，即使文档删除失败
      }
    }

    // 如果有缩略图且是GridFS文件ID，则删除文件
    if (courseware.thumbnailUrl && /^[0-9a-fA-F]{24}$/.test(courseware.thumbnailUrl)) {
      try {
        await deleteFile(courseware.thumbnailUrl);
      } catch (error) {
        // 继续删除课件，即使缩略图删除失败
      }
    }

    // 删除课件记录
    await Courseware.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '课件删除成功',
      data: courseware
    });
  } catch (error) {
    // 错误已通过响应返回
    res.status(500).json({
      success: false,
      message: '课件删除失败',
      error: error.message
    });
  }
});

// POST /api/courseware/:id/favorite - 收藏课件（需要verified权限）
router.post('/:id/favorite', authMiddleware, isVerified, async (req, res) => {
  try {
    const courseware = await Courseware.findById(req.params.id);

    if (!courseware) {
      return res.status(404).json({
        success: false,
        message: '课件不存在'
      });
    }

    // 这里可以扩展到用户模型中添加收藏列表
    // 目前仅返回成功消息
    res.json({
      success: true,
      message: '课件收藏成功',
      data: {
        coursewareId: courseware._id,
        coursewareName: courseware.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '收藏课件失败',
      error: error.message
    });
  }
});

// POST /api/courseware/:id/download - 下载课件（公开接口，已移除下载量统计）
router.post('/:id/download', async (req, res) => {
  try {
    const courseware = await Courseware.findById(req.params.id);

    if (!courseware) {
      return res.status(404).json({
        success: false,
        message: '课件不存在'
      });
    }

    res.json({
      success: true,
      message: '下载链接获取成功',
      data: {
        documentFile: courseware.documentFile,
        documentFileName: courseware.documentFileName || courseware.name,
        documentFileType: courseware.documentFileType
      }
    });
  } catch (error) {
    // 错误已通过响应返回
    res.status(500).json({
      success: false,
      message: '获取下载链接失败',
      error: error.message
    });
  }
});

module.exports = router;
