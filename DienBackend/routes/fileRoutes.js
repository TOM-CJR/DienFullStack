// GridFS 文件访问路由
const express = require('express');
const router = express.Router();
const { downloadFile, getFileInfo } = require('../utils/gridfsStorage');
// GET /api/files/:id - 获取GridFS文件
router.get('/:id', async (req, res) => {
  try {
    const fileId = req.params.id;


      });
    }
    // 获取文件信息
    const fileInfo = await getFileInfo(fileId);
        message: '无效的文件ID'
      return res.status(404).json({
        success: false,
        message: '文件不存在'
    // 获取文件信息
    const fileInfo = await getFileInfo(fileId);
    if (!fileInfo) {
    console.error('Error fetching file:', error);
    res.status(500).json({
      success: false,
      message: '获取文件失败',
      error: error.message
    });
  }
});

module.exports = router;
