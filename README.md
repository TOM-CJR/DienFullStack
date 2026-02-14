# 快速命令参考

## 💻 本地开发

### 前端 (DienProject)

```bash
cd E:\Dien\DienProject

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问地址: http://localhost:5173
```

### 后端 (DienBackend)

```bash
cd E:\Dien\DienBackend

# 安装依赖
npm install

# 开发模式(热重载)
npm run dev

# 或普通启动
npm start

# 服务地址: http://localhost:3001
```

---

## 🚀 生产部署

### 前端构建

```bash
cd E:\Dien\DienProject

# 1. 修改生产配置
notepad .env.production
# 修改 VITE_API_BASE_URL 为服务器地址

# 2. 构建
npm run build

# 3. 构建产物在 dist 目录
# 上传 dist 目录到服务器的 /var/www/Dien/DienProject/
```

### 后端部署

```bash
# 在服务器上

cd /var/www/Dien/DienBackend

# 1. 安装依赖
npm install --production

# 2. 配置环境变量
cp .env.production .env
nano .env
# 修改 MONGO_URI, JWT_SECRET, CORS_ORIGIN

# 3. 启动服务
pm2 start npm --name "dien-backend" -- start

# 4. 保存配置
pm2 save

# 5. 设置开机自启
pm2 startup
```

---

## 🔧 PM2 管理命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs dien-backend
pm2 logs dien-backend --lines 100

# 重启
pm2 restart dien-backend

# 停止
pm2 stop dien-backend

# 删除
pm2 delete dien-backend

# 监控
pm2 monit
```

---

## 🌐 Nginx 命令

```bash
# 检查配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx

# 重启
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 查看访问日志
sudo tail -f /var/log/nginx/access.log
```

---

## 💾 数据库命令

```bash
# 连接 MongoDB
mongosh

# 查看数据库
show dbs

# 使用数据库
use usersRegister

# 查看集合
show collections

# 查询数据
db.users.find()

# MongoDB 服务管理
sudo systemctl status mongodb
sudo systemctl start mongodb
sudo systemctl stop mongodb
sudo systemctl restart mongodb
```

---

## 🔍 故障排查命令

### 检查端口占用

```bash
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Linux
sudo netstat -tlnp | grep :3001
sudo lsof -i :3001
```

### 检查进程

```bash
# Windows
tasklist | findstr node

# Linux
ps aux | grep node
```

### 检查防火墙

```bash
# Linux
sudo ufw status
sudo ufw allow 3001/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 测试 API

```bash
# 测试后端健康状态
curl http://localhost:3001/api/users

# 测试特定接口
curl http://localhost:3001/api/scholarships
```

---

## 📦 文件传输

### 上传到服务器

```bash
# 上传单个文件
scp file.txt user@server:/path/

# 上传目录
scp -r folder/ user@server:/path/

# 上传前端构建产物
scp -r dist/ user@server:/var/www/Dien/DienProject/
```

### 从服务器下载

```bash
# 下载文件
scp user@server:/path/file.txt ./

# 下载目录
scp -r user@server:/path/folder/ ./

# 下载日志
scp user@server:/var/log/nginx/error.log ./
```

---

## 🔐 权限管理

```bash
# 修改文件所有者
sudo chown -R www-data:www-data /var/www/Dien

# 修改文件权限
sudo chmod -R 755 /var/www/Dien

# 给脚本执行权限
chmod +x script.sh
```

---

## 📊 系统监控

```bash
# 查看系统资源
top
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看 CPU 使用
mpstat

# 查看网络连接
netstat -tlnp
```

---

## 🔄 Git 操作

```bash
# 克隆项目
git clone <repository-url>

# 拉取最新代码
git pull

# 查看状态
git status

# 添加修改
git add .

# 提交
git commit -m "message"

# 推送
git push
```

---

## 🧹 清理命令

```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules
npm install

# 清理 PM2 日志
pm2 flush

# 清理 Nginx 日志
sudo truncate -s 0 /var/log/nginx/access.log
sudo truncate -s 0 /var/log/nginx/error.log
```

---

## 📝 环境变量查看

```bash
# 查看所有环境变量
printenv

# 查看特定变量
echo $NODE_ENV
echo $PORT

# Windows
set NODE_ENV
set PORT
```

---

## 🎯 快速修复

### 前端连不上后端

```bash
# 1. 检查后端是否运行
pm2 status

# 2. 检查配置
cat .env.production

# 3. 重启后端
pm2 restart dien-backend

# 4. 查看日志
pm2 logs dien-backend
```

### CORS 错误

```bash
# 1. 检查后端 CORS 配置
cat DienBackend/.env | grep CORS_ORIGIN

# 2. 修改配置
nano DienBackend/.env

# 3. 重启后端
pm2 restart dien-backend
```

### 页面 404

```bash
# 1. 检查 Nginx 配置
sudo nginx -t

# 2. 重载 Nginx
sudo systemctl reload nginx

# 3. 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

---

**提示**: 将此文件保存到书签,方便随时查阅!
