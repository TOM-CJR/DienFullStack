// 新闻API路由
const express = require('express');
const router = express.Router();
const News = require('../models/News');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { uploadMemory } = require('../middleware/uploadMiddleware');
const { uploadFile, deleteFile } = require('../utils/gridfsStorage');

// GET /api/news - 获取新闻列表（公开接口，支持分页和筛选）
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      keyword,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // 构建查询条件
    const query = {};

    // 状态筛选：如果指定了status则筛选，否则显示所有状态（管理后台需要）
    if (status) {
      query.status = status;
    }

    // 分类筛选
    if (category) {
      query.category = category;
    }

    // 关键词搜索（标题或内容）
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
        { summary: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 计算分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 排序
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    // 查询新闻列表
    const newsList = await News.find(query)
      .populate('author', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // 计算总数
    const total = await News.countDocuments(query);

    res.json({
      success: true,
      data: newsList,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting news list:', error);
    res.status(500).json({
      success: false,
      message: '获取新闻列表失败',
      error: error.message
    });
  }
});

// GET /api/news/:id - 获取新闻详情（公开接口，自动增加浏览量）
router.get('/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate('author', 'name email');

    if (!news) {
      return res.status(404).json({
        success: false,
        message: '新闻不存在'
      });
    }

    // 增加浏览量
    news.views += 1;
    await news.save();

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取新闻详情失败',
      error: error.message
    });
  }
});

// POST /api/news - 创建新闻（需要admin权限，支持封面图片和文档上传）
router.post('/', authMiddleware, isAdmin, uploadMemory.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'documentFile', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, content, summary, category, status, tags } = req.body;

    // 验证必填字段
    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: '请提供标题、内容和分类'
      });
    }

    // 创建新闻对象
    const newsData = {
      title,
      content,
      summary: summary || '',
      category,
      status: status || 'draft',
      author: req.user.id,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : []
    };

    // 处理封面图片上传
    if (req.files && req.files['coverImage'] && req.files['coverImage'][0]) {
      const coverImageFile = req.files['coverImage'][0];
      // 修复文件名编码问题
      let fixedFilename = coverImageFile.originalname;
      try {
        const buffer = Buffer.from(fixedFilename, 'latin1');
        fixedFilename = buffer.toString('utf8');
      } catch (err) {
        // 使用原始名称
      }

      try {
        // 上传到 GridFS
        const fileId = await uploadFile(coverImageFile.buffer, {
          filename: fixedFilename,
          contentType: coverImageFile.mimetype,
          metadata: {
            newsId: null, // 新闻ID，稍后会更新
            type: 'coverImage'
          }
        });
        // 存储文件 ID
        if (fileId) {
          newsData.coverImage = fileId;
        } else {
          // 如果 GridFS 上传失败，回退到磁盘存储
          newsData.coverImage = `/uploads/news/${coverImageFile.filename}`;
        }
      } catch (error) {
        console.error('Error uploading cover image to GridFS:', error);
        // 如果 GridFS 上传失败，回退到磁盘存储
        newsData.coverImage = `/uploads/news/${coverImageFile.filename}`;
      }
    }

    // 如果上传了文档文件
    if (req.files && req.files['documentFile'] && req.files['documentFile'][0]) {
      const documentFile = req.files['documentFile'][0];
      // 修复文件名编码问题
      let fixedFilename = documentFile.originalname;
      try {
        // 检测并修复双重编码问题
        const buffer = Buffer.from(fixedFilename, 'latin1');
        fixedFilename = buffer.toString('utf8');
      } catch (err) {
        // 使用原始名称
      }

      try {
        // 上传到 GridFS
        const fileId = await uploadFile(documentFile.buffer, {
          filename: fixedFilename,
          contentType: documentFile.mimetype
        });
        // 存储文件 ID 和文件信息
        if (fileId) {
          newsData.documentFile = fileId;
          newsData.documentFileName = fixedFilename;
          newsData.documentFileType = documentFile.mimetype;
        } else {
          // 如果 GridFS 上传失败，回退到磁盘存储
          newsData.documentFile = `/uploads/news/${documentFile.filename}`;
          newsData.documentFileName = fixedFilename;
          newsData.documentFileType = documentFile.mimetype;
        }
      } catch (error) {
        console.error('Error uploading document to GridFS:', error);
        // 如果 GridFS 上传失败，回退到磁盘存储
        newsData.documentFile = `/uploads/news/${documentFile.filename}`;
        newsData.documentFileName = fixedFilename;
        newsData.documentFileType = documentFile.mimetype;
      }
    }

    // 如果状态为已发布，设置发布时间
    if (newsData.status === 'published' && !newsData.publishedAt) {
      newsData.publishedAt = new Date();
    }

    const news = await News.create(newsData);

    // 更新封面图片的metadata，添加newsId
    if (news.coverImage && /^[0-9a-fA-F]{24}$/.test(news.coverImage)) {
      try {
        const mongoose = require('mongoose');
        const conn = mongoose.connection;
        // 直接更新 GridFS files 集合中的 metadata
        await conn.db.collection('uploads.files').updateOne(
          { _id: new mongoose.Types.ObjectId(news.coverImage) },
          { $set: { 'metadata.newsId': news._id, 'metadata.type': 'coverImage' } }
        );
      } catch (error) {
        console.error('Error updating cover image metadata:', error);
        // 继续执行，不影响新闻创建
      }
    }

    res.status(201).json({
      success: true,
      message: '新闻创建成功',
      data: news
    });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(400).json({
      success: false,
      message: '新闻创建失败',
      error: error.message
    });
  }
});

// PUT /api/news/:id - 更新新闻（需要admin权限，支持封面图片和文档上传）
router.put('/:id', authMiddleware, isAdmin, uploadMemory.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'documentFile', maxCount: 1 }]), async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: '新闻不存在'
      });
    }

    const { title, content, summary, category, status, tags } = req.body;

    // 更新字段
    if (title) news.title = title;
    if (content) news.content = content;
    if (summary !== undefined) news.summary = summary;
    if (category) news.category = category;
    if (tags) {
      news.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    // 状态更新处理
    if (status) {
      const oldStatus = news.status;
      news.status = status;

      // 如果从非发布状态变为发布状态，设置发布时间
      if (oldStatus !== 'published' && status === 'published') {
        news.publishedAt = new Date();
      }
    }

    // 处理封面图片更新
    if (req.files && req.files['coverImage'] && req.files['coverImage'][0]) {
      const coverImageFile = req.files['coverImage'][0];
      
      // 保存旧的封面图片ID（如果存在且是GridFS文件）
      const oldCoverImage = news.coverImage;
      const isOldCoverImageGridFS = oldCoverImage && /^[0-9a-fA-F]{24}$/.test(oldCoverImage);
      
      // 修复文件名编码问题
      let fixedFilename = coverImageFile.originalname;
      try {
        const buffer = Buffer.from(fixedFilename, 'latin1');
        fixedFilename = buffer.toString('utf8');
      } catch (err) {
        // 使用原始名称
      }
      
      try {
        // 上传新封面图片到 GridFS
        const fileId = await uploadFile(coverImageFile.buffer, {
          filename: fixedFilename,
          contentType: coverImageFile.mimetype,
          metadata: {
            newsId: news._id,
            type: 'coverImage'
          }
        });
        
        // 存储文件 ID
        if (fileId) {
          news.coverImage = fileId;
          
          // 新封面图片上传成功后，删除旧封面图片
          if (isOldCoverImageGridFS) {
            try {
              await deleteFile(oldCoverImage);
            } catch (deleteError) {
              console.error('Error deleting old cover image:', deleteError);
            }
          }
        } else {
          // 如果 GridFS 上传失败，回退到磁盘存储
          news.coverImage = `/uploads/news/${coverImageFile.filename}`;
          
          // 新封面图片上传成功后，删除旧封面图片
          if (isOldCoverImageGridFS) {
            try {
              await deleteFile(oldCoverImage);
            } catch (deleteError) {
              console.error('Error deleting old cover image:', deleteError);
            }
          }
        }
      } catch (error) {
        console.error('Error uploading new cover image to GridFS:', error);
        // 如果 GridFS 上传失败，回退到磁盘存储
        news.coverImage = `/uploads/news/${coverImageFile.filename}`;
        
        // 新封面图片上传成功后，删除旧封面图片
        if (isOldCoverImageGridFS) {
          try {
            await deleteFile(oldCoverImage);
          } catch (deleteError) {
            console.error('Error deleting old cover image:', deleteError);
          }
        }
      }
    }

    // 处理文档更新
    const removeDocument = req.body.removeDocument === 'true';

    if (removeDocument) {
      // 用户要求删除文档
      const oldDocumentFile = news.documentFile;
      const isOldDocumentGridFS = oldDocumentFile && /^[0-9a-fA-F]{24}$/.test(oldDocumentFile);

      // 删除旧文档
      if (isOldDocumentGridFS) {
        try {
          await deleteFile(oldDocumentFile);
        } catch (deleteError) {
          console.error('Error deleting old document file:', deleteError);
        }
      }

      // 清空文档字段
      news.documentFile = undefined;
      news.documentFileName = undefined;
      news.documentFileType = undefined;

    } else if (req.files && req.files['documentFile'] && req.files['documentFile'][0]) {
      // 上传了新的文档文件
      const documentFile = req.files['documentFile'][0];
      // 修复文件名编码问题
      let fixedFilename = documentFile.originalname;
      try {
        const buffer = Buffer.from(fixedFilename, 'latin1');
        fixedFilename = buffer.toString('utf8');
      } catch (err) {
        // 使用原始名称
      }

      // 保存旧的文档文件ID（如果存在且是GridFS文件）
      const oldDocumentFile = news.documentFile;
      const isOldDocumentGridFS = oldDocumentFile && /^[0-9a-fA-F]{24}$/.test(oldDocumentFile);

      try {
        // 上传到 GridFS
        const fileId = await uploadFile(documentFile.buffer, {
          filename: fixedFilename,
          contentType: documentFile.mimetype
        });
        // 存储文件 ID 和文件信息
        if (fileId) {
          news.documentFile = fileId;
          news.documentFileName = fixedFilename;
          news.documentFileType = documentFile.mimetype;

          // 新文档上传成功后，删除旧文档
          if (isOldDocumentGridFS) {
            try {
              await deleteFile(oldDocumentFile);
            } catch (deleteError) {
              console.error('Error deleting old document file:', deleteError);
            }
          }
        } else {
          // 如果 GridFS 上传失败，回退到磁盘存储
          news.documentFile = `/uploads/news/${documentFile.filename}`;
          news.documentFileName = fixedFilename;
          news.documentFileType = documentFile.mimetype;
        }
      } catch (error) {
        console.error('Error uploading new document to GridFS:', error);
        // 如果 GridFS 上传失败，回退到磁盘存储
        news.documentFile = `/uploads/news/${documentFile.filename}`;
        news.documentFileName = fixedFilename;
        news.documentFileType = documentFile.mimetype;
      }
    }

    await news.save();

    // 重新查询以获取populated数据
    const updatedNews = await News.findById(news._id).populate('author', 'name email');

    res.json({
      success: true,
      message: '新闻更新成功',
      data: updatedNews
    });
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(400).json({
      success: false,
      message: '新闻更新失败',
      error: error.message
    });
  }
});

// DELETE /api/news/:id - 删除新闻（需要admin权限）
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: '新闻不存在'
      });
    }

    // 如果有封面图片且是GridFS文件ID，则删除文件
    if (news.coverImage && /^[0-9a-fA-F]{24}$/.test(news.coverImage)) {
      try {
        await deleteFile(news.coverImage);
      } catch (error) {
        console.error('Error deleting cover image from GridFS:', error);
        // 继续删除新闻，即使图片删除失败
      }
    }

    // 如果有文档文件且是GridFS文件ID，则删除文件
    if (news.documentFile && /^[0-9a-fA-F]{24}$/.test(news.documentFile)) {
      try {
        await deleteFile(news.documentFile);
      } catch (error) {
        console.error('Error deleting document file from GridFS:', error);
        // 继续删除新闻，即使文档删除失败
      }
    }

    // 删除新闻记录
    await News.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '新闻删除成功',
      data: news
    });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({
      success: false,
      message: '新闻删除失败',
      error: error.message
    });
  }
});

module.exports = router;
