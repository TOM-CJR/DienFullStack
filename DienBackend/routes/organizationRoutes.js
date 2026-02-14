// 机构信息路由
const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
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

// 提交机构信息
router.post('/', authMiddleware, uploadMultiple.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'certificates', maxCount: 10 }
]), async (req, res) => {
  try {
    // 检查是否已提交过机构信息
    const existingOrg = await Organization.findOne({ user: req.user.id });
    if (existingOrg && existingOrg.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: '您已提交过机构信息，请等待审核'
      });
    }

    // 解析表单数据
    const orgData = JSON.parse(req.body.data || '{}');

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
          type: 'organization_logo'
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
            type: 'organization_certificate'
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

    // 创建机构信息
    const organization = await Organization.create({
      user: req.user.id,
      name: orgData.name,
      code: orgData.code,
      type: orgData.type,
      contactPerson: orgData.contactPerson,
      contactPhone: orgData.contactPhone,
      email: orgData.email,
      establishDate: orgData.establishDate ? new Date(orgData.establishDate) : null,
      province: orgData.province,
      city: orgData.city,
      address: orgData.address,
      zipCode: orgData.zipCode,
      description: orgData.description,
      logo: logoFileId,
      certificates: certificates,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: '机构信息提交成功，请等待审核',
      data: organization
    });
  } catch (error) {
    console.error('提交机构信息失败:', error);
    res.status(500).json({
      success: false,
      message: '提交机构信息失败'
    });
  }
});

// 获取我的机构信息
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const organization = await Organization.findOne({ user: req.user.id })
      .populate('reviewedBy', 'name');

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '未找到机构信息'
      });
    }

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('获取机构信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取机构信息失败'
    });
  }
});

// 更新机构信息（仅pending状态可编辑）
router.put('/:id', authMiddleware, uploadMultiple.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'certificates', maxCount: 10 }
]), async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '机构信息不存在'
      });
    }

    // 验证所有权
    if (organization.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权修改此机构信息'
      });
    }

    // 如果之前已审核（approved或rejected），修改后重新提交审核
    const needsReview = organization.status !== 'pending';
    if (needsReview) {
      organization.status = 'pending';
      organization.reviewedBy = null;
      organization.reviewedAt = null;
      organization.reviewComment = '';
    }

    // 解析表单数据
    const orgData = JSON.parse(req.body.data || '{}');

    // 更新基本信息
    if (orgData.name) organization.name = orgData.name;
    if (orgData.code !== undefined) organization.code = orgData.code;
    if (orgData.type !== undefined) organization.type = orgData.type;
    if (orgData.contactPerson) organization.contactPerson = orgData.contactPerson;
    if (orgData.contactPhone) organization.contactPhone = orgData.contactPhone;
    if (orgData.email !== undefined) organization.email = orgData.email;
    if (orgData.establishDate !== undefined) {
      organization.establishDate = orgData.establishDate ? new Date(orgData.establishDate) : null;
    }
    if (orgData.province !== undefined) organization.province = orgData.province;
    if (orgData.city !== undefined) organization.city = orgData.city;
    if (orgData.address !== undefined) organization.address = orgData.address;
    if (orgData.zipCode !== undefined) organization.zipCode = orgData.zipCode;
    if (orgData.description !== undefined) organization.description = orgData.description;

    // 更新LOGO
    if (req.files && req.files.logo && req.files.logo[0]) {
      const logoFile = req.files.logo[0];

      // 删除旧LOGO
      if (organization.logo) {
        await deleteFile(organization.logo);
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
          type: 'organization_logo'
        }
      });

      organization.logo = logoFileId;
    }

    await organization.save();

    res.status(200).json({
      success: true,
      message: '机构信息更新成功',
      data: organization
    });
  } catch (error) {
    console.error('更新机构信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新机构信息失败'
    });
  }
});

// 取消机构认证（删除机构信息）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '机构信息不存在'
      });
    }

    // 验证所有权
    if (organization.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除此机构信息'
      });
    }

    // 从用户表中解除关联
    await User.findByIdAndUpdate(req.user.id, {
      organization: null
    });

    // 删除相关文件
    if (organization.logo) {
      await deleteFile(organization.logo);
    }
    for (const cert of organization.certificates) {
      await deleteFile(cert.fileId);
    }

    await Organization.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: '机构认证已取消'
    });
  } catch (error) {
    console.error('取消机构认证失败:', error);
    res.status(500).json({
      success: false,
      message: '取消机构认证失败'
    });
  }
});

// 获取所有机构信息（超级管理员）
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

    const organizations = await Organization.find(query)
      .populate('user', 'name account email phone')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: organizations
    });
  } catch (error) {
    console.error('获取机构列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取机构列表失败'
    });
  }
});

// 审核机构信息（超级管理员）
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

    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '机构信息不存在'
      });
    }

    const oldStatus = organization.status;

    // 更新审核信息
    organization.status = status;
    organization.reviewedBy = req.user.id;
    organization.reviewedAt = new Date();
    organization.reviewComment = reviewComment || '';
    await organization.save();

    // 如果审核通过，关联到用户
    if (status === 'approved') {
      await User.findByIdAndUpdate(organization.user, {
        organization: organization._id
      });
    }

    // 如果从批准改为拒绝，或者拒绝，都需要从用户表解除关联
    if (status === 'rejected' || (oldStatus === 'approved' && status === 'rejected')) {
      await User.findByIdAndUpdate(organization.user, {
        organization: null
      });
    }

    res.status(200).json({
      success: true,
      message: `机构信息已${status === 'approved' ? '批准' : '拒绝'}`,
      data: organization
    });
  } catch (error) {
    console.error('审核机构信息失败:', error);
    res.status(500).json({
      success: false,
      message: '审核机构信息失败'
    });
  }
});

module.exports = router;
