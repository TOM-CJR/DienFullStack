// 设置用户为管理员角色的工具脚本
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// 连接MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB 连接成功');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

// 设置管理员角色
const setAdminRole = async (account, role = 'admin') => {
  try {
    // 查找用户
    const user = await User.findOne({ account });

    if (!user) {
      console.log(`❌ 未找到账号: ${account}`);
      return;
    }

    // 更新角色
    user.role = role;
    await user.save();

    console.log(`✅ 成功设置账号 ${account} 的角色为: ${role}`);
    console.log(`用户信息:`);
    console.log(`  - ID: ${user._id}`);
    console.log(`  - 名称: ${user.name}`);
    console.log(`  - 账号: ${user.account}`);
    console.log(`  - 角色: ${user.role}`);
  } catch (error) {
    console.error('❌ 设置角色失败:', error.message);
  }
};

// 列出所有用户
const listUsers = async () => {
  try {
    const users = await User.find({}).select('-password');

    if (users.length === 0) {
      console.log('📋 数据库中暂无用户');
      return;
    }

    console.log(`\n📋 数据库中的所有用户 (共 ${users.length} 个):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. 账号: ${user.account}`);
      console.log(`   名称: ${user.name}`);
      console.log(`   角色: ${user.role}`);
      console.log(`   创建时间: ${user.createdAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ 获取用户列表失败:', error.message);
  }
};

// 主函数
const main = async () => {
  await connectDB();

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('\n📖 使用说明:');
    console.log('  node scripts/setAdminRole.js list                    - 列出所有用户');
    console.log('  node scripts/setAdminRole.js <账号> <角色>           - 设置用户角色');
    console.log('\n可用角色: user, verified, admin, super_admin');
    console.log('\n示例:');
    console.log('  node scripts/setAdminRole.js list');
    console.log('  node scripts/setAdminRole.js test@example.com admin');
    console.log('  node scripts/setAdminRole.js admin@dien.com super_admin\n');

    await listUsers();
  } else if (args[0] === 'list') {
    await listUsers();
  } else {
    const account = args[0];
    const role = args[1] || 'admin';

    // 验证角色
    const validRoles = ['user', 'verified', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      console.log(`❌ 无效的角色: ${role}`);
      console.log(`可用角色: ${validRoles.join(', ')}`);
    } else {
      await setAdminRole(account, role);
    }
  }

  // 关闭连接
  await mongoose.connection.close();
  console.log('\n✅ 数据库连接已关闭');
  process.exit(0);
};

// 执行
main();
