# 数据库管理脚本使用说明

## 📋 目录

- [设置管理员权限](#设置管理员权限)
- [初始化测试数据](#初始化测试数据)
- [常见问题](#常见问题)

---

## 🔑 设置管理员权限

### 使用方法

```bash
# 进入后端目录
cd E:\Dien\DienBackend

# 列出所有用户
node scripts/setAdminRole.js list

# 设置指定账号为管理员
node scripts/setAdminRole.js <账号> admin

# 设置为超级管理员
node scripts/setAdminRole.js <账号> super_admin
```

### 示例

```bash
# 查看所有用户
node scripts/setAdminRole.js list

# 输出示例:
# 📋 数据库中的所有用户 (共 2 个):
#
# 1. 账号: test@example.com
#    名称: 测试用户
#    角色: user
#    创建时间: 2024-06-20T10:30:00.000Z

# 设置test@example.com为管理员
node scripts/setAdminRole.js test@example.com admin

# 输出:
# ✅ 成功设置账号 test@example.com 的角色为: admin
```

### 可用角色

- `user` - 普通用户（默认）
- `verified` - 认证用户
- `admin` - 管理员
- `super_admin` - 超级管理员

---

## 🌱 初始化测试数据

### 使用方法

```bash
cd E:\Dien\DienBackend
node scripts/seedData.js
```

### 数据内容

该脚本会自动创建:

1. **测试管理员账号**（如果不存在）
   - 账号: `admin@test.com`
   - 密码: `123456`
   - 角色: `admin`

2. **新闻数据** - 5条测试新闻
   - 包含不同分类：行业动态、重要通知、活动公告、成果展示
   - 包含标题、内容、摘要、发布时间等完整字段

3. **奖学金数据** - 2个测试奖学金
   - 信息学竞赛优秀奖学金
   - 科技创新特别奖学金

4. **课件数据** - 2个测试课件
   - C++编程基础教程
   - 数据结构与算法

### 示例输出

```
🌱 开始初始化数据...

✅ 使用现有管理员: admin@test.com

🗑️  清空新闻数据
✅ 成功创建 5 条新闻
🗑️  清空奖学金数据
✅ 成功创建 2 个奖学金
🗑️  清空课件数据
✅ 成功创建 2 个课件

🎉 数据初始化完成!

📊 数据统计:
   - 新闻: 5 条
   - 奖学金: 2 个
   - 课件: 2 个

✅ 数据库连接已关闭
```

---

## ❓ 常见问题

### 1. 报错：MongoDB 连接失败

**问题**: `❌ MongoDB 连接失败`

**解决方法**:
1. 确保 MongoDB 服务正在运行
2. 检查 `.env` 文件中的 `MONGO_URI` 配置
3. 尝试手动连接 MongoDB: `mongosh mongodb://localhost:27017/usersRegister`

### 2. 403 错误：权限不足

**问题**: 前端管理员创建资源时报 403 错误

**原因**: 用户角色不是 admin 或 super_admin

**解决方法**:
```bash
# 1. 查看当前用户角色
node scripts/setAdminRole.js list

# 2. 设置为管理员
node scripts/setAdminRole.js your@email.com admin
```

### 3. 前端显示"暂无新闻数据"

**问题**: 前端页面显示空数据

**原因**: 数据库中没有数据

**解决方法**:
```bash
# 运行数据初始化脚本
node scripts/seedData.js
```

### 4. Token 验证失败

**问题**: API 调用返回 401 未授权

**解决方法**:
1. 退出当前账号
2. 重新登录
3. 确保 JWT_SECRET 配置正确

---

## 🚀 快速开始

### 完整流程

```bash
# 1. 启动 MongoDB
# 确保 MongoDB 服务正在运行

# 2. 初始化测试数据
cd E:\Dien\DienBackend
node scripts/seedData.js

# 3. 启动后端服务
npm run dev

# 4. 启动前端服务（新终端）
cd E:\Dien\DienProject
npm run dev

# 5. 登录测试管理员账号
# 账号: admin@test.com
# 密码: 123456

# 6. 测试管理功能
# 访问: http://localhost:5173/users/admin/news
```

---

## 📝 注意事项

1. **数据安全**: `seedData.js` 会清空现有数据，请谨慎使用
2. **生产环境**: 测试管理员账号仅供开发测试，生产环境请修改密码
3. **权限设置**: 超级管理员 (super_admin) 拥有所有权限，请谨慎授予

---

## 🔗 相关链接

- MongoDB 官方文档: https://www.mongodb.com/docs/
- Node.js 官方文档: https://nodejs.org/docs/
