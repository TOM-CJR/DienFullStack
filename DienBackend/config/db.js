// 导入mongoose模块
const mongoose = require('mongoose');
// 导入dotenv模块以读取环境变量
require('dotenv').config();
// 导入GridFS工具
const { initGridFS } = require('../utils/gridfsStorage');

// 定义数据库连接函数
const connectDB = async () => {
  try {
    // 连接到MongoDB数据库
    // 连接字符串从.env文件中读取，格式为：mongodb://localhost:27017/usersRegister
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // 连接成功时输出连接信息
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // 初始化GridFS桶
    initGridFS(conn.connection);
  } catch (error) {
    // 连接失败时输出错误信息
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // 退出进程，状态码为1表示异常退出
    process.exit(1);
  }
};

// 导出连接数据库的函数
module.exports = connectDB;