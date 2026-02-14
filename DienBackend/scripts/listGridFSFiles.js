// 列出 GridFS 中的所有文件
// 使用方法：node scripts/listGridFSFiles.js

const mongoose = require('mongoose');
require('dotenv').config();

async function listFiles() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGO_URI);
    console.log('已连接到MongoDB');

    const db = mongoose.connection.db;
    const filesCollection = db.collection('uploads.files');

    // 查询所有文件
    const files = await filesCollection.find({}).toArray();

    console.log('\n========== GridFS 文件列表 ==========\n');
    console.log(`总共 ${files.length} 个文件\n`);

    files.forEach((file, index) => {
      console.log(`文件 #${index + 1}:`);
      console.log(`  ID: ${file._id}`);
      console.log(`  文件名: ${file.filename}`);
      console.log(`  类型: ${file.contentType}`);
      console.log(`  大小: ${(file.length / 1024).toFixed(2)} KB`);
      console.log(`  上传时间: ${file.uploadDate}`);
      console.log(`  下载URL: http://localhost:${process.env.PORT || 3001}/api/files/${file._id}`);
      console.log('');
    });

    console.log('=====================================\n');

    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

listFiles();
