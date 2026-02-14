// GridFS 存储工具
// 用于处理大文件存储，如图片、视频等

const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// 创建 GridFS 桶
let gridfsBucket = null;

/**
 * 初始化 GridFS 桶
 * @param {mongoose.Connection} connection - MongoDB 连接
 */
const initGridFS = (connection) => {
  try {
    gridfsBucket = new GridFSBucket(connection.db, {
      bucketName: 'uploads' // 桶名称，默认是 'fs'
    });
    console.log('GridFS bucket initialized');
  } catch (error) {
    console.error('Error initializing GridFS bucket:', error);
    // 初始化失败时设置为 null，后续操作会回退到磁盘存储
    gridfsBucket = null;
  }
};

/**
 * 获取 GridFS 桶实例
 * @returns {GridFSBucket|null} GridFS 桶实例或 null
 */
const getGridFSBucket = () => {
  return gridfsBucket;
};

/**
 * 上传文件到 GridFS
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {Object} options - 上传选项
 * @param {string} options.filename - 文件名
 * @param {string} options.contentType - 文件内容类型
 * @returns {Promise<string|null>} 文件 ID 或 null（如果上传失败）
 */
const uploadFile = async (fileBuffer, options) => {
  const bucket = getGridFSBucket();

  if (!bucket) {
    console.warn('GridFS bucket not available, falling back to disk storage');
    return null;
  }

  const { filename, contentType, metadata } = options;

  return new Promise((resolve, reject) => {
    try {
      const uploadStream = bucket.openUploadStream(filename, {
        contentType,
        metadata: metadata || {
          uploadedAt: new Date()
        }
      });

      uploadStream.write(fileBuffer);
      uploadStream.end();

      uploadStream.on('finish', () => {
        resolve(uploadStream.id.toString());
      });

      uploadStream.on('error', (error) => {
        console.error('Error uploading to GridFS:', error);
        resolve(null); // 上传失败时返回 null，后续会回退到磁盘存储
      });
    } catch (error) {
      console.error('Error creating upload stream:', error);
      resolve(null);
    }
  });
};

/**
 * 从 GridFS 下载文件
 * @param {string} fileId - 文件 ID
 * @returns {Promise<Buffer|null>} 文件缓冲区或 null
 */
const downloadFile = async (fileId) => {
  const bucket = getGridFSBucket();
  
  if (!bucket) {
    return null;
  }

  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      downloadStream.on('error', (error) => {
        console.error('Error downloading from GridFS:', error);
        resolve(null);
      });
    } catch (error) {
      console.error('Error creating download stream:', error);
      resolve(null);
    }
  });
};

/**
 * 删除 GridFS 中的文件
 * @param {string} fileId - 文件 ID
 * @returns {Promise<boolean>} 是否删除成功
 */
const deleteFile = async (fileId) => {
  const bucket = getGridFSBucket();
  
  if (!bucket) {
    return false;
  }

  try {
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
    return true;
  } catch (error) {
    console.error('Error deleting from GridFS:', error);
    return false;
  }
};

/**
 * 获取文件信息
 * @param {string} fileId - 文件 ID
 * @returns {Promise<Object|null>} 文件信息或 null
 */
const getFileInfo = async (fileId) => {
  const bucket = getGridFSBucket();
  
  if (!bucket) {
    return null;
  }

  try {
    const filesCollection = bucket.s.db.collection('uploads.files');
    return await filesCollection.findOne({ _id: new mongoose.Types.ObjectId(fileId) });
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};

module.exports = {
  initGridFS,
  getGridFSBucket,
  uploadFile,
  downloadFile,
  deleteFile,
  getFileInfo
};
