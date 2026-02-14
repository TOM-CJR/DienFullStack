// 检查文件名编码
const mongoose = require('mongoose');
require('dotenv').config();

async function checkEncoding() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('已连接到MongoDB\n');

    const db = mongoose.connection.db;
    const filesCollection = db.collection('uploads.files');

    // 查询最新的文档文件
    const file = await filesCollection.findOne(
      { filename: /\.docx$/ },
      { sort: { uploadDate: -1 } }
    );

    if (!file) {
      console.log('没有找到文档文件');
      await mongoose.connection.close();
      return;
    }

    console.log('========== 文件名编码测试 ==========\n');
    console.log('文件ID:', file._id);
    console.log('\n--- 不同方式显示文件名 ---');
    console.log('1. 直接输出:', file.filename);
    console.log('2. Buffer输出:', Buffer.from(file.filename, 'utf8'));
    console.log('3. 字节数组:', Array.from(Buffer.from(file.filename, 'utf8')));
    console.log('4. 编码后:', encodeURIComponent(file.filename));
    console.log('5. JSON输出:', JSON.stringify({ filename: file.filename }));

    // 测试下载URL
    const downloadUrl = `http://localhost:${process.env.PORT || 3001}/api/files/${file._id}`;
    console.log('\n下载URL:', downloadUrl);
    console.log('\n提示: 请在浏览器中打开上述URL，检查下载的文件名是否正确');
    console.log('      或在前端页面查看文档名称是否正常显示');

    console.log('\n=====================================\n');

    await mongoose.connection.close();
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

checkEncoding();
