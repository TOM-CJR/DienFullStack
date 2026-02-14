// 修复已存在文件的文件名编码问题
// 使用方法：node scripts/fixExistingFilenames.js

const mongoose = require('mongoose');
require('dotenv').config();

async function fixFilenames() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('已连接到MongoDB\n');

    const db = mongoose.connection.db;
    const filesCollection = db.collection('uploads.files');
    const newsCollection = db.collection('news');

    // 查询所有文件
    const files = await filesCollection.find({}).toArray();

    console.log('========== 开始修复文件名 ==========\n');
    console.log(`找到 ${files.length} 个文件\n`);

    let fixedCount = 0;

    for (const file of files) {
      try {
        const originalFilename = file.filename;

        // 尝试修复文件名编码
        const buffer = Buffer.from(originalFilename, 'latin1');
        const fixedFilename = buffer.toString('utf8');

        // 检查是否真的需要修复（修复后的文件名应该不同）
        if (originalFilename !== fixedFilename && fixedFilename.match(/[\u4e00-\u9fa5]/)) {
          console.log(`文件 ${file._id}:`);
          console.log(`  原文件名: ${originalFilename}`);
          console.log(`  修复后: ${fixedFilename}`);

          // 更新 GridFS 文件元数据
          await filesCollection.updateOne(
            { _id: file._id },
            { $set: { filename: fixedFilename } }
          );

          // 更新所有引用此文件的新闻记录
          const result = await newsCollection.updateMany(
            { documentFile: file._id.toString() },
            { $set: { documentFileName: fixedFilename } }
          );

          if (result.modifiedCount > 0) {
            console.log(`  更新了 ${result.modifiedCount} 条新闻记录`);
          }

          fixedCount++;
          console.log('  ✓ 已修复\n');
        }
      } catch (err) {
        console.error(`修复文件 ${file._id} 时出错:`, err.message);
      }
    }

    console.log('=====================================');
    console.log(`总共修复了 ${fixedCount} 个文件\n`);

    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

fixFilenames();
