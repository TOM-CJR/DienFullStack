// 文件上传中间件
// 使用multer处理文件上传，包含安全验证和存储配置

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 文件类型白名单（MIME类型）
const ALLOWED_FILE_TYPES = {
  // 图片类型
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],

  // 文档类型
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],

  // 视频类型
  'video/mp4': ['.mp4'],
  'video/mpeg': ['.mpeg', '.mpg'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],

  // 压缩文件
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
  'application/x-7z-compressed': ['.7z'],

  // 文本文件
  'text/plain': ['.txt'],
  'text/csv': ['.csv']
};

// 单个文件大小限制（100MB）
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// 配置存储
const storage = multer.diskStorage({
  // 设置上传目录
  destination: (req, file, cb) => {
    // 根据上传类型创建不同的目录
    let uploadPath = 'uploads/';

    // 根据请求路径判断资源类型
    if (req.baseUrl.includes('/courseware')) {
      uploadPath += 'courseware/';
    } else if (req.baseUrl.includes('/news')) {
      uploadPath += 'news/';
    } else if (req.baseUrl.includes('/scholarships')) {
      uploadPath += 'scholarships/';
    } else if (req.baseUrl.includes('/questions')) {
      uploadPath += 'questions/';
    } else if (req.baseUrl.includes('/exams')) {
      uploadPath += 'exams/';
    } else {
      uploadPath += 'others/';
    }

    // 确保目录存在
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  // 设置文件名
  filename: (req, file, cb) => {
    // 获取文件扩展名
    const ext = path.extname(file.originalname);

    // 生成唯一文件名：时间戳-随机数-原始文件名（移除扩展名）
    const basename = path.basename(file.originalname, ext);
    // 移除特殊字符，只保留字母、数字、下划线和连字符
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${sanitizedBasename}${ext}`;

    cb(null, uniqueName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const mimeType = file.mimetype;

  // 检查MIME类型是否在白名单中
  if (ALLOWED_FILE_TYPES[mimeType]) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ALLOWED_FILE_TYPES[mimeType];

    // 验证文件扩展名
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`文件扩展名 ${ext} 与MIME类型 ${mimeType} 不匹配`), false);
    }
  } else {
    cb(new Error(`不支持的文件类型: ${mimeType}`), false);
  }
};

// 创建multer实例（磁盘存储）
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE  // 限制文件大小
  }
});

// 创建multer实例（内存存储，用于GridFS）
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE  // 限制文件大小
  }
});

// 错误处理中间件
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: '文件太大',
        maxSize: `${MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }
    return res.status(400).json({
      message: '文件上传错误',
      error: err.message
    });
  } else if (err) {
    // 自定义错误（如文件类型不支持）
    return res.status(400).json({
      message: err.message
    });
  }
  next();
};

module.exports = upload;
module.exports.uploadMemory = uploadMemory;
module.exports.handleUploadError = handleUploadError;
module.exports.ALLOWED_FILE_TYPES = ALLOWED_FILE_TYPES;
module.exports.MAX_FILE_SIZE = MAX_FILE_SIZE;
