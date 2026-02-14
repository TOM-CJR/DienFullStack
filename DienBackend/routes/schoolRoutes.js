// 学校信息路由
const express = require('express');
const router = express.Router();
const School = require('../models/School');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { isSuperAdmin } = require('../middleware/roleMiddleware');
const { uploadMemory } = require('../middleware/uploadMiddleware');
const { uploadFile, deleteFile } = require('../utils/gridfsStorage');
const multer = require('multer');

// 创建multer实例用于多文件上传
const uploadMultiple = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  }
});

// 提交学校信息
router.post('/', authMiddleware, uploadMultiple.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'certificates', maxCount: 10 }
]), async (req, res) => {
  try {
    // 检查是否已提交过学校信息
    const existingSchool = await School.findOne({ user: req.user.id });
    if (existingSchool && existingSchool.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: '您已提交过学校信息，请等待审核'
      });
    }

    // 解析表单数据
    const schoolData = JSON.parse(req.body.data || '{}');

    // 上传LOGO
    let logoFileId = null;
    if (req.files && req.files.logo && req.files.logo[0]) {
      const logoFile = req.files.logo[0];

      // 修复中文文件名
      let fixedFilename = logoFile.originalname;
      try {
        const buffer = Buffer.from(fixedFilename, 'latin1');
        fixedFilename = buffer.toString('utf8');
      } catch (err) {
        console.warn('文件名编码转换失败:', err);
      }

      logoFileId = await uploadFile(logoFile.buffer, {
        filename: fixedFilename,
        contentType: logoFile.mimetype,
        metadata: {
          userId: req.user.id,
          type: 'school_logo'
        }
      });
    }

    // 上传证书文件
    const certificates = [];
    if (req.files && req.files.certificates) {
      const certFiles = req.files.certificates;
      const certData = JSON.parse(req.body.certificatesData || '[]');

      for (let i = 0; i < certFiles.length; i++) {
        const file = certFiles[i];

        // 修复中文文件名
        let fixedFilename = file.originalname;
        try {
          const buffer = Buffer.from(fixedFilename, 'latin1');
          fixedFilename = buffer.toString('utf8');
        } catch (err) {
          console.warn('文件名编码转换失败:', err);
        }

        const fileId = await uploadFile(file.buffer, {
          filename: fixedFilename,
          contentType: file.mimetype,
          metadata: {
            userId: req.user.id,
            type: 'school_certificate'
          }
        });

        if (fileId && certData[i]) {
          certificates.push({
            name: certData[i].name,
            number: certData[i].number,
            fileId: fileId,
            expiryDate: certData[i].expiryDate ? new Date(certData[i].expiryDate) : null
          });
        }
      }
    }

    // 创建学校信息
    const school = await School.create({
      user: req.user.id,
      name: schoolData.name,
      code: schoolData.code,
      type: schoolData.type,
      contactPerson: schoolData.contactPerson,
      contactPhone: schoolData.contactPhone,
      email: schoolData.email,
      establishDate: schoolData.establishDate ? new Date(schoolData.establishDate) : null,
      province: schoolData.province,
      city: schoolData.city,
      address: schoolData.address,
      zipCode: schoolData.zipCode,
      description: schoolData.description,
      logo: logoFileId,
      certificates: certificates,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: '学校信息提交成功，请等待审核',
      data: school
    });
  } catch (error) {
    console.error('提交学校信息失败:', error);
    res.status(500).json({
      success: false,
      message: '提交学校信息失败'
    });
  }
});

// 获取我的学校信息
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const school = await School.findOne({ user: req.user.id })
      .populate('reviewedBy', 'name');

    if (!school) {
      return res.status(404).json({
        success: false,
        message: '未找到学校信息'
      });
    }

    res.status(200).json({
      success: true,
      data: school
    });
  } catch (error) {
    console.error('获取学校信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学校信息失败'
    });
  }
});

// 更新学校信息（仅pending状态可编辑）
router.put('/:id', authMiddleware, uploadMultiple.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'certificates', maxCount: 10 }
]), async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: '学校信息不存在'
      });
    }

    // 验证所有权
    if (school.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权修改此学校信息'
      });
    }

    // 如果之前已审核（approved或rejected），修改后重新提交审核
    const needsReview = school.status !== 'pending';
    if (needsReview) {
      school.status = 'pending';
      school.reviewedBy = null;
      school.reviewedAt = null;
      school.reviewComment = '';
    }

    // 解析表单数据
    const schoolData = JSON.parse(req.body.data || '{}');

    // 更新基本信息
    if (schoolData.name) school.name = schoolData.name;
    if (schoolData.code !== undefined) school.code = schoolData.code;
    if (schoolData.type !== undefined) school.type = schoolData.type;
    if (schoolData.contactPerson) school.contactPerson = schoolData.contactPerson;
    if (schoolData.contactPhone) school.contactPhone = schoolData.contactPhone;
    if (schoolData.email !== undefined) school.email = schoolData.email;
    if (schoolData.establishDate !== undefined) {
      school.establishDate = schoolData.establishDate ? new Date(schoolData.establishDate) : null;
    }
    if (schoolData.province !== undefined) school.province = schoolData.province;
    if (schoolData.city !== undefined) school.city = schoolData.city;
    if (schoolData.address !== undefined) school.address = schoolData.address;
    if (schoolData.zipCode !== undefined) school.zipCode = schoolData.zipCode;
    if (schoolData.description !== undefined) school.description = schoolData.description;

    // 更新LOGO
    if (req.files && req.files.logo && req.files.logo[0]) {
      const logoFile = req.files.logo[0];

      // 删除旧LOGO
      if (school.logo) {
        await deleteFile(school.logo);
      }

      // 修复中文文件名
      let fixedFilename = logoFile.originalname;
      try {
        const buffer = Buffer.from(fixedFilename, 'latin1');
        fixedFilename = buffer.toString('utf8');
      } catch (err) {
        console.warn('文件名编码转换失败:', err);
      }

      const logoFileId = await uploadFile(logoFile.buffer, {
        filename: fixedFilename,
        contentType: logoFile.mimetype,
        metadata: {
          userId: req.user.id,
          type: 'school_logo'
        }
      });

      school.logo = logoFileId;
    }

    await school.save();

    res.status(200).json({
      success: true,
      message: '学校信息更新成功',
      data: school
    });
  } catch (error) {
    console.error('更新学校信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新学校信息失败'
    });
  }
});

// 取消学校认证（删除学校信息）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: '学校信息不存在'
      });
    }

    // 验证所有权
    if (school.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除此学校信息'
      });
    }

    // 从用户表中解除关联
    await User.findByIdAndUpdate(req.user.id, {
      school: null
    });

    // 删除相关文件
    if (school.logo) {
      await deleteFile(school.logo);
    }
    for (const cert of school.certificates) {
      await deleteFile(cert.fileId);
    }

    await School.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: '学校认证已取消'
    });
  } catch (error) {
    console.error('取消学校认证失败:', error);
    res.status(500).json({
      success: false,
      message: '取消学校认证失败'
    });
  }
});

// 获取所有学校信息（超级管理员）
router.get('/', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const { status = '', userSearch = '' } = req.query;

    // 构建查询条件
    const query = {};
    if (status) {
      query.status = status;
    }

    // 如果有用户搜索条件，先查找用户
    if (userSearch) {
      const users = await User.find({
        $or: [
          { email: { $regex: userSearch, $options: 'i' } },
          { phone: { $regex: userSearch, $options: 'i' } },
          { account: { $regex: userSearch, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = users.map(u => u._id);
      query.user = { $in: userIds };
    }

    const schools = await School.find(query)
      .populate('user', 'name account email phone')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: schools
    });
  } catch (error) {
    console.error('获取学校列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学校列表失败'
    });
  }
});

// 审核学校信息（超级管理员）
router.put('/:id/review', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const { status, reviewComment } = req.body;

    // 验证审核状态
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的审核状态'
      });
    }

    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: '学校信息不存在'
      });
    }

    const oldStatus = school.status;

    // 更新审核信息
    school.status = status;
    school.reviewedBy = req.user.id;
    school.reviewedAt = new Date();
    school.reviewComment = reviewComment || '';
    await school.save();

    // 如果审核通过，关联到用户
    if (status === 'approved') {
      await User.findByIdAndUpdate(school.user, {
        school: school._id
      });
    }

    // 如果从批准改为拒绝，或者拒绝，都需要从用户表解除关联
    if (status === 'rejected' || (oldStatus === 'approved' && status === 'rejected')) {
      await User.findByIdAndUpdate(school.user, {
        school: null
      });
    }

    res.status(200).json({
      success: true,
      message: `学校信息已${status === 'approved' ? '批准' : '拒绝'}`,
      data: school
    });
  } catch (error) {
    console.error('审核学校信息失败:', error);
    res.status(500).json({
      success: false,
      message: '审核学校信息失败'
    });
  }
});

module.exports = router;
