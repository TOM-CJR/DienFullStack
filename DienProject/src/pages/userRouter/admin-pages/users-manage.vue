<template>
  <div class="users-manage-page">
    <div class="page-header">
      <h2>用户管理</h2>
      <p>管理所有用户账号和角色权限</p>
    </div>

    <!-- 筛选器 -->
    <div class="filters-card">
      <div class="filters">
        <input
          v-model="filters.keyword"
          class="filter-input"
          placeholder="搜索用户名、账号"
          @keyup.enter="fetchUsers"
        />
        <select v-model="filters.role" class="filter-select">
          <option value="">全部角色</option>
          <option value="user">普通用户</option>
          <option value="verified">认证用户</option>
          <option value="admin">管理员</option>
          <option value="super_admin">超级管理员</option>
        </select>
        <select v-model="filters.status" class="filter-select">
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="inactive">未激活</option>
          <option value="suspended">已禁用</option>
        </select>
        <button class="btn btn-primary" @click="fetchUsers">搜索</button>
        <button class="btn btn-secondary" @click="resetFilters">重置</button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: #4299e1">👥</div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.totalUsers }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #48bb78">📈</div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.todayUsers }}</div>
          <div class="stat-label">今日新增</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #ed8936">🔥</div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.recentActiveUsers }}</div>
          <div class="stat-label">活跃用户(7天)</div>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="users-table-card">
      <table class="users-table">
        <thead>
          <tr>
            <th>头像</th>
            <th>昵称/姓名</th>
            <th>账号</th>
            <th>角色</th>
            <th>状态</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody v-if="usersList.length > 0">
          <tr v-for="user in usersList" :key="user._id">
            <td>
              <div class="user-avatar">
                <img v-if="getAvatarUrl(user.avatar)" :src="getAvatarUrl(user.avatar)" />
                <span v-else>{{ getUserInitial(user) }}</span>
              </div>
            </td>
            <td>
              <div class="user-names">
                <div class="nickname">{{ user.nickname || user.name }}</div>
                <small v-if="user.nickname">{{ user.name }}</small>
              </div>
            </td>
            <td>{{ user.account }}</td>
            <td>
              <span :class="['role-badge', `role-${user.role}`]">
                {{ getRoleText(user.role) }}
              </span>
            </td>
            <td>
              <span :class="['status-badge', `status-${user.status || 'active'}`]">
                {{ getStatusText(user.status || 'active') }}
              </span>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button class="btn-action" @click="openRoleDialog(user)">
                  更改角色
                </button>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="7" class="empty-state">暂无用户数据</td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="pagination">
        <button
          class="btn btn-secondary"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          上一页
        </button>
        <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
        <button
          class="btn btn-secondary"
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 更改角色对话框 -->
    <div v-if="showRoleDialog" class="dialog-overlay" @click="closeRoleDialog">
      <div class="dialog-content" @click.stop>
        <h3>更改用户角色</h3>
        <div class="dialog-info">
          <p><strong>用户：</strong>{{ selectedUser?.name }}</p>
          <p><strong>账号：</strong>{{ selectedUser?.account }}</p>
          <p><strong>当前角色：</strong>{{ getRoleText(selectedUser?.role || '') }}</p>
        </div>
        <div class="form-group">
          <label>新角色</label>
          <select v-model="newRole" class="form-select">
            <option value="user">普通用户</option>
            <option value="verified">认证用户</option>
            <option value="admin">管理员</option>
            <option value="super_admin">超级管理员</option>
          </select>
        </div>
        <div class="dialog-actions">
          <button class="btn btn-primary" @click="handleChangeRole">确认</button>
          <button class="btn btn-secondary" @click="closeRoleDialog">取消</button>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <div v-if="message.show" :class="['message-toast', `message-${message.type}`]">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getAllUsers, changeUserRole, getUserStatistics } from '@/api/userManagementApi'
import type { User } from '@/types'
import { getFileUrl, isValidObjectId } from '@/utils/apiConfig'

const usersList = ref<User[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const showRoleDialog = ref(false)
const selectedUser = ref<User | null>(null)
const newRole = ref('')

// 筛选条件
const filters = reactive({
  keyword: '',
  role: '',
  status: ''
})

// 统计数据
const statistics = reactive({
  totalUsers: 0,
  todayUsers: 0,
  recentActiveUsers: 0
})

// 消息提示
const message = reactive({
  show: false,
  type: 'success' as 'success' | 'error',
  text: ''
})

// 显示消息
const showMessage = (type: 'success' | 'error', text: string) => {
  message.show = true
  message.type = type
  message.text = text
  setTimeout(() => {
    message.show = false
  }, 3000)
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    const result = await getAllUsers({
      page: currentPage.value,
      limit: 20,
      keyword: filters.keyword,
      role: filters.role,
      status: filters.status
    })

    if (result.success) {
      usersList.value = result.data.users
      currentPage.value = result.data.pagination.page
      totalPages.value = result.data.pagination.totalPages
    }
  } catch (error: any) {
    showMessage('error', '获取用户列表失败')
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const result = await getUserStatistics()
    if (result.success) {
      Object.assign(statistics, result.data)
    }
  } catch (error: any) {
    console.error('获取统计数据失败:', error)
  }
}

// 重置筛选
const resetFilters = () => {
  filters.keyword = ''
  filters.role = ''
  filters.status = ''
  currentPage.value = 1
  fetchUsers()
}

// 切换页面
const changePage = (page: number) => {
  currentPage.value = page
  fetchUsers()
}

// 获取头像URL
const getAvatarUrl = (avatar?: string) => {
  if (!avatar) return undefined
  if (isValidObjectId(avatar)) {
    return getFileUrl(avatar)
  }
  return avatar
}

// 获取用户首字母
const getUserInitial = (user: User) => {
  const name = user.nickname || user.name
  return name ? name.charAt(0).toUpperCase() : 'U'
}

// 获取角色文本
const getRoleText = (role: string) => {
  switch (role) {
    case 'super_admin':
      return '超级管理员'
    case 'admin':
      return '管理员'
    case 'verified':
      return '认证用户'
    case 'user':
    default:
      return '普通用户'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return '正常'
    case 'inactive':
      return '未激活'
    case 'suspended':
      return '已禁用'
    default:
      return '正常'
  }
}

// 格式化日期
const formatDate = (date: any) => {
  if (!date) return '未知'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 打开角色对话框
const openRoleDialog = (user: User) => {
  selectedUser.value = user
  newRole.value = user.role || 'user'
  showRoleDialog.value = true
}

// 关闭角色对话框
const closeRoleDialog = () => {
  showRoleDialog.value = false
  selectedUser.value = null
  newRole.value = ''
}

// 更改角色
const handleChangeRole = async () => {
  if (!selectedUser.value) return

  try {
    const result = await changeUserRole(selectedUser.value._id, newRole.value)
    if (result.success) {
      showMessage('success', '角色更新成功')
      closeRoleDialog()
      fetchUsers()
    }
  } catch (error: any) {
    showMessage('error', error.response?.data?.message || '角色更新失败')
  }
}

onMounted(() => {
  fetchUsers()
  fetchStatistics()
})
</script>

<style scoped>
.users-manage-page {
  padding: 20px;
  background: #fafafa;
  min-height: calc(100vh - 70px);
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  color: #2d3748;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.page-header p {
  color: #718096;
  font-size: 16px;
}

/* 筛选器 */
.filters-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.filters {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-input,
.filter-select {
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 200px;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #718096;
}

/* 用户表格 */
.users-table-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead th {
  text-align: left;
  padding: 15px;
  color: #4a5568;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 2px solid #edf2f7;
}

.users-table tbody td {
  padding: 15px;
  border-bottom: 1px solid #edf2f7;
  font-size: 14px;
}

.users-table tbody tr:hover {
  background: #f7fafc;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-names {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nickname {
  font-weight: 500;
  color: #2d3748;
}

.user-names small {
  color: #718096;
  font-size: 12px;
}

.role-badge,
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.role-super_admin {
  background: #fed7d7;
  color: #c53030;
}

.role-badge.role-admin {
  background: #feebc8;
  color: #c05621;
}

.role-badge.role-verified {
  background: #c6f6d5;
  color: #2f855a;
}

.role-badge.role-user {
  background: #e2e8f0;
  color: #4a5568;
}

.status-badge.status-active {
  background: #c6f6d5;
  color: #2f855a;
}

.status-badge.status-inactive {
  background: #e2e8f0;
  color: #4a5568;
}

.status-badge.status-suspended {
  background: #fed7d7;
  color: #c53030;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #a0aec0;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 6px 12px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-action:hover {
  background: #3182ce;
  transform: translateY(-1px);
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.page-info {
  color: #4a5568;
  font-size: 14px;
}

/* 对话框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.dialog-content h3 {
  margin: 0 0 20px 0;
  color: #2d3748;
  font-size: 20px;
}

.dialog-info {
  background: #f7fafc;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.dialog-info p {
  margin: 8px 0;
  color: #2d3748;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
}

.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.form-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.dialog-actions {
  display: flex;
  gap: 10px;
}

.dialog-actions .btn {
  flex: 1;
}

/* 按钮 */
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover:not(:disabled) {
  background: #cbd5e0;
}

/* 消息提示 */
.message-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  z-index: 2000;
  animation: slideIn 0.3s ease;
}

.message-success {
  background: #48bb78;
}

.message-error {
  background: #f56565;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }

  .filter-input,
  .filter-select {
    width: 100%;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .users-table-card {
    overflow-x: scroll;
  }

  .pagination {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
