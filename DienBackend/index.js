// 导入必要的模块
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

// 初始化express应用
const app = express();

// 配置CORS
// 允许所有跨域请求，生产环境中应该配置具体的域名
app.use(cors({
  origin: '*', // 允许所有来源的请求
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 允许的HTTP方法，包括预检请求OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // 允许的请求头
  credentials: true, // 允许携带凭证
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'] // 允许前端访问的响应头
}));

// 添加内容安全策略头
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; connect-src *; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src * data:;"
  );
  next();
});

// 配置中间件：解析JSON请求体
app.use(express.json());

// 配置中间件：解析URL编码的请求体
app.use(express.urlencoded({ extended: true }));

// 连接数据库
connectDB();

// 配置静态文件服务（用于访问上传的文件）
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 从 GridFS 提供文件服务
const { getGridFSBucket } = require('./utils/gridfsStorage');
const mongoose = require('mongoose');

app.get('/api/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const bucket = getGridFSBucket();

    if (!bucket) {
      return res.status(500).json({
        success: false,
        message: 'GridFS 未初始化'
      });
    }

    // 验证 ObjectId 格式
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: '无效的文件ID格式'
      });
    }

    // 检查文件是否存在
    const filesCollection = bucket.s.db.collection('uploads.files');
    const objectId = new mongoose.Types.ObjectId(fileId);
    const file = await filesCollection.findOne({ _id: objectId });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 设置响应头
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    res.set('Content-Length', file.length);

    // 流式传输文件
    const downloadStream = bucket.openDownloadStream(objectId);
    downloadStream.pipe(res);

    downloadStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: '文件读取失败'
        });
      }
    });
  } catch (error) {
    console.error('Error serving file:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '文件服务错误',
        error: error.message
      });
    }
  }
});

// 定义API路由
// 用户相关路由
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/user-management', require('./routes/userManagementRoutes'));
app.use('/api/organizations', require('./routes/organizationRoutes'));
app.use('/api/schools', require('./routes/schoolRoutes'));

// 资源管理路由
app.use('/api/news', require('./routes/newsRoutes'));
app.use('/api/courseware', require('./routes/coursewareRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/scholarships', require('./routes/scholarshipRoutes'));
app.use('/api/scholarship-applications', require('./routes/scholarshipApplicationRoutes'));

// 用户活动记录路由
app.use('/api/user-activities', require('./routes/userActivityRoutes'));

// 定义端口号，优先使用环境变量中的PORT，否则使用5000
const PORT = process.env.PORT || 5000;

// 启动服务器，明确指定监听所有网络接口(0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});