<template>
  <div class="profile-page">
    <div class="page-header">
      <h2>个人信息</h2>
      <p>查看和更新您的个人资料</p>
    </div>

    <div class="profile-content">
      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar-container">
            <div class="avatar" @click="triggerFileInput">
              <img v-if="avatarUrl" :src="avatarUrl" alt="头像" />
              <span v-else class="avatar-text">{{ userInitial }}</span>
              <div class="avatar-overlay">
                <span>点击更换</span>
              </div>
            </div>
            <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleAvatarUpload" />
            <div class="avatar-actions">
              <button class="avatar-btn" @click="triggerFileInput">更换头像</button>
              <button v-if="avatarUrl" class="avatar-btn-delete" @click="handleDeleteAvatar">
                删除头像
              </button>
            </div>
          </div>
          <div class="user-basic-info">
            <h3>{{ userStore.user?.nickname || userStore.user?.name || '用户名' }}</h3>
            <p class="user-role">{{ userRole }}</p>
            <p class="user-account">账号：{{ userStore.user?.account }}</p>
          </div>
        </div>

        <div class="profile-form">
          <div class="form-section">
            <h4>基本信息</h4>
            <div class="form-grid">
              <div class="form-group">
                <label>昵称</label>
                <input v-model="formData.nickname" type="text" :readonly="!isEditing" placeholder="请输入昵称" />
              </div>
              <div class="form-group">
                <label>姓名</label>
                <input v-model="formData.name" type="text" :readonly="!isEditing" placeholder="请输入姓名" />
              </div>
              <div class="form-group">
                <label>性别</label>
                <select v-model="formData.gender" :disabled="!isEditing">
                  <option value="">请选择</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div class="form-group">
                <label>手机号</label>
                <input v-model="formData.phone" type="tel" :readonly="!isEditing" placeholder="请输入手机号" />
              </div>
              <div class="form-group">
                <label>出生日期</label>
                <input v-model="formData.birthDate" type="date" :readonly="!isEditing" />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>账号信息</h4>
            <div class="form-grid">
              <div class="form-group">
                <label>账号</label>
                <input type="text" :value="userStore.user?.account" readonly />
              </div>
              <div class="form-group">
                <label>角色</label>
                <input type="text" :value="userRole" readonly />
              </div>
              <div class="form-group">
                <label>注册时间</label>
                <input type="text" :value="registrationDate" readonly />
              </div>
              <div class="form-group">
                <label>最后登录</label>
                <input type="text" :value="lastLoginDate" readonly />
              </div>
              <div class="form-group">
                <label>账号状态</label>
                <input type="text" :value="accountStatus" readonly />
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button v-if="!isEditing" class="btn btn-primary" @click="isEditing = true">
              编辑资料
            </button>
            <template v-else>
              <button class="btn btn-primary" @click="handleSaveProfile">保存</button>
              <button class="btn btn-secondary" @click="handleCancelEdit">取消</button>
            </template>
            <button class="btn btn-secondary" @click="showPasswordDialog = true">
              修改密码
            </button>
          </div>
        </div>
      </div>

      <!-- 我的奖学金申请 -->
      <div class="profile-card" style="margin-top: 20px;">
        <div class="profile-section-header">
          <h3>我的奖学金申请</h3>
          <p>查看您的奖学金申请记录和审核状态</p>
        </div>

        <div v-if="loadingApplications" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="applications.length === 0" class="empty-state">
          <p>暂无申请记录</p>
        </div>

        <div v-else class="applications-list">
          <div v-for="application in applications" :key="application._id" class="application-card">
            <div class="application-header">
              <div class="application-title">
                <h4>{{ application.scholarship?.title || '奖学金已删除' }}</h4>
                <span v-if="application.scholarship?.amount" class="application-amount">
                  ¥{{ application.scholarship.amount.toLocaleString('zh-CN') }}
                </span>
              </div>
              <span :class="['status-badge', `status-${application.status}`]">
                {{ getApplicationStatusText(application.status) }}
              </span>
            </div>

            <div class="application-info">
              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">申请时间：</span>
                  <span class="info-value">{{ formatDate(application.appliedAt) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">申请截止：</span>
                  <span class="info-value">{{ formatDate(application.scholarship?.applicationDeadline) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">公布日期：</span>
                  <span class="info-value">{{ formatDate(application.scholarship?.announcementDate) }}</span>
                </div>
              </div>

              <div v-if="application.status !== 'pending'" class="review-info">
                <div class="info-row">
                  <div class="info-item">
                    <span class="info-label">审核人：</span>
                    <span class="info-value">{{ application.reviewedBy?.name || '未知' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">审核时间：</span>
                    <span class="info-value">{{ formatDate(application.reviewedAt) }}</span>
                  </div>
                </div>
                <div v-if="application.reviewComment" class="review-comment">
                  <span class="info-label">审核意见：</span>
                  <span class="info-value">{{ application.reviewComment }}</span>
                </div>
              </div>
            </div>

            <div v-if="application.status === 'pending'" class="application-actions">
              <button class="btn-cancel" @click="handleCancelApplication(application._id)">
                取消申请
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 密码修改对话框 -->
    <div v-if="showPasswordDialog" class="dialog-overlay" @click="closePasswordDialog">
      <div class="dialog-content" @click.stop>
        <h3>修改密码</h3>
        <div class="form-group">
          <label>旧密码</label>
          <input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" />
        </div>
        <div class="form-group">
          <label>新密码</label>
          <input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码（至少6位）" />
        </div>
        <div class="form-group">
          <label>确认新密码</label>
          <input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
        </div>
        <div class="dialog-actions">
          <button class="btn btn-primary" @click="handleChangePassword">确认</button>
          <button class="btn btn-secondary" @click="closePasswordDialog">取消</button>
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
import { ref, computed, onMounted, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import { uploadAvatar, deleteAvatar, updateProfile, changePassword } from '@/api/userApi'
import { getMyApplications, cancelApplication } from '@/api/scholarshipApplicationApi'
import type { ScholarshipApplication } from '@/api/scholarshipApplicationApi'
import { getAvatarUrl } from '@/utils/apiConfig'

const userStore = useUserStore()
const fileInput = ref<HTMLInputElement | null>(null)
const isEditing = ref(false)
const showPasswordDialog = ref(false)

// 奖学金申请相关
const applications = ref<ScholarshipApplication[]>([])
const loadingApplications = ref(false)

// 表单数据
const formData = reactive({
  nickname: '',
  name: '',
  gender: '',
  phone: '',
  birthDate: ''
})

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 消息提示
const message = reactive({
  show: false,
  type: 'success',
  text: ''
})

// 头像URL
const avatarUrl = computed(() => {
  return getAvatarUrl(userStore.user?.avatar)
})

// 用户名首字母
const userInitial = computed(() => {
  const displayName = userStore.user?.nickname || userStore.user?.name
  if (!displayName) return '用'
  return displayName.charAt(0).toUpperCase()
})

// 用户角色
const userRole = computed(() => {
  const role = userStore.user?.role
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
})

// 注册时间
const registrationDate = computed(() => {
  if (!userStore.user?.createdAt) return '未知'
  return new Date(userStore.user.createdAt).toLocaleDateString('zh-CN')
})

// 最后登录时间
const lastLoginDate = computed(() => {
  if (!userStore.user?.lastLoginAt) return '未知'
  return new Date(userStore.user.lastLoginAt).toLocaleString('zh-CN')
})

// 账号状态
const accountStatus = computed(() => {
  const status = userStore.user?.status
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
})

// 初始化表单数据
const initFormData = () => {
  formData.nickname = userStore.user?.nickname || ''
  formData.name = userStore.user?.name || ''
  formData.gender = userStore.user?.gender || ''
  formData.phone = userStore.user?.phone || ''
  formData.birthDate = userStore.user?.birthDate
    ? new Date(userStore.user.birthDate).toISOString().split('T')[0] || ''
    : ''
}

// 显示消息
const showMessage = (type: 'success' | 'error', text: string) => {
  message.show = true
  message.type = type
  message.text = text
  setTimeout(() => {
    message.show = false
  }, 3000)
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理头像上传
const handleAvatarUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showMessage('error', '请上传图片文件')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    showMessage('error', '图片大小不能超过5MB')
    return
  }

  const formData = new FormData()
  formData.append('avatar', file)

  try {
    const result = await uploadAvatar(formData)
    if (result.success) {
      await userStore.fetchUserInfo()
      showMessage('success', '头像上传成功')
    }
  } catch (error: any) {
    showMessage('error', error.response?.data?.message || '头像上传失败')
  }

  target.value = ''
}

// 删除头像
const handleDeleteAvatar = async () => {
  if (!confirm('确定要删除头像吗？')) return

  try {
    const result = await deleteAvatar()
    if (result.success) {
      await userStore.fetchUserInfo()
      showMessage('success', '头像删除成功')
    }
  } catch (error: any) {
    showMessage('error', error.response?.data?.message || '头像删除失败')
  }
}

// 保存个人资料
const handleSaveProfile = async () => {
  try {
    const updateData: any = {
      name: formData.name,
      nickname: formData.nickname,
      phone: formData.phone,
      gender: formData.gender
    }

    if (formData.birthDate) {
      updateData.birthDate = new Date(formData.birthDate).toISOString()
    }

    const result = await updateProfile(updateData)
    if (result.success) {
      await userStore.fetchUserInfo()
      isEditing.value = false
      showMessage('success', '个人资料更新成功')
    }
  } catch (error: any) {
    showMessage('error', error.response?.data?.message || '个人资料更新失败')
  }
}

// 取消编辑
const handleCancelEdit = () => {
  isEditing.value = false
  initFormData()
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    showMessage('error', '请填写完整')
    return
  }

  if (passwordForm.newPassword.length < 6) {
    showMessage('error', '新密码至少6位')
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showMessage('error', '两次输入的密码不一致')
    return
  }

  try {
    const result = await changePassword(passwordForm.oldPassword, passwordForm.newPassword)
    if (result.success) {
      showMessage('success', '密码修改成功')
      closePasswordDialog()
    }
  } catch (error: any) {
    showMessage('error', error.response?.data?.message || '密码修改失败')
  }
}

// 关闭密码对话框
const closePasswordDialog = () => {
  showPasswordDialog.value = false
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

// 获取奖学金申请列表
const fetchApplications = async () => {
  loadingApplications.value = true
  try {
    const result = await getMyApplications()
    if (result.success) {
      // 过滤掉无效的申请记录（奖学金已被删除）
      const validApplications = (result.data || []).filter(
        (app: any) => app.scholarship && app.scholarship.title
      )
      applications.value = validApplications
    }
  } catch (error: any) {
    console.error('获取申请列表失败:', error)
    // 即使出错也设置为空数组，显示空状态而不是一直加载
    applications.value = []
  } finally {
    loadingApplications.value = false
  }
}

// 获取申请状态文本
const getApplicationStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '待审核'
    case 'approved':
      return '已通过'
    case 'rejected':
      return '已拒绝'
    default:
      return '未知'
  }
}

// 格式化日期
const formatDate = (date: any) => {
  if (!date) return '未知'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 取消申请
const handleCancelApplication = async (applicationId: string) => {
  if (!confirm('确定要取消此申请吗？')) return

  try {
    const result = await cancelApplication(applicationId)
    if (result.success) {
      showMessage('success', '申请已取消')
      fetchApplications()
    }
  } catch (error: any) {
    showMessage('error', error.response?.data?.message || '取消申请失败')
  }
}

onMounted(() => {
  initFormData()
  fetchApplications()
})
</script>

<style scoped>
.profile-page {
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

.profile-content {
  max-width: 900px;
  margin: 0 auto;
}

.profile-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  display: flex;
  align-items: center;
  gap: 30px;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.avatar:hover {
  transform: scale(1.05);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  font-size: 48px;
  font-weight: 700;
  color: white;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  font-size: 14px;
  color: white;
}

.avatar:hover .avatar-overlay {
  opacity: 1;
}

.avatar-actions {
  display: flex;
  gap: 10px;
}

.avatar-btn,
.avatar-btn-delete {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.avatar-btn-delete {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

.avatar-btn-delete:hover {
  background: rgba(239, 68, 68, 0.3);
}

.user-basic-info h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.user-role {
  font-size: 16px;
  opacity: 0.9;
  margin: 0 0 4px 0;
}

.user-account {
  font-size: 14px;
  opacity: 0.8;
  margin: 0;
}

.profile-form {
  padding: 30px;
}

.form-section {
  margin-bottom: 30px;
}

.form-section h4 {
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #edf2f7;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #2d3748;
  transition: all 0.3s ease;
}

.form-group input:read-only,
.form-group select:disabled {
  background: #f7fafc;
}

.form-group input:not(:read-only),
.form-group select:not(:disabled) {
  background: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 2px solid #edf2f7;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-primary:hover {
  background: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
  border: 1px solid #cbd5e0;
}

.btn-secondary:hover {
  background: #cbd5e0;
  transform: translateY(-1px);
}

/* 对话框样式 */
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
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.dialog-content h3 {
  margin: 0 0 20px 0;
  color: #2d3748;
  font-size: 20px;
}

.dialog-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.dialog-actions .btn {
  flex: 1;
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

/* 奖学金申请部分样式 */
.profile-section-header {
  padding: 20px 30px;
  border-bottom: 2px solid #edf2f7;
}

.profile-section-header h3 {
  color: #2d3748;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.profile-section-header p {
  color: #718096;
  font-size: 14px;
  margin: 0;
}

.applications-list {
  padding: 20px;
}

.application-card {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
}

.application-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e2e8f0;
}

.application-title {
  flex: 1;
}

.application-title h4 {
  color: #2d3748;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 5px 0;
}

.application-amount {
  color: #38a169;
  font-size: 18px;
  font-weight: 700;
}

.status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.status-pending {
  background: #feebc8;
  color: #c05621;
}

.status-badge.status-approved {
  background: #c6f6d5;
  color: #2f855a;
}

.status-badge.status-rejected {
  background: #fed7d7;
  color: #c53030;
}

.application-info {
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  gap: 5px;
  font-size: 14px;
}

.info-label {
  color: #718096;
  font-weight: 500;
}

.info-value {
  color: #2d3748;
}

.review-info {
  margin-top: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.review-comment {
  margin-top: 10px;
  display: flex;
  gap: 5px;
}

.application-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 15px;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel {
  padding: 8px 16px;
  background: #fc8181;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #f56565;
  transform: translateY(-1px);
}

.loading-state,
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #4299e1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 15px auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p,
.empty-state p {
  color: #718096;
  font-size: 14px;
  margin: 0;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 30px 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .dialog-content {
    width: 95%;
  }

  .application-header {
    flex-direction: column;
    gap: 10px;
  }

  .info-row {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
