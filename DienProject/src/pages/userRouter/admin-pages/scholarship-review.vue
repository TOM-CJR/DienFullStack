<template>
  <div class="scholarship-review-page">
    <div class="page-header">
      <h2>奖学金申请审核</h2>
      <p>审核用户提交的奖学金申请</p>
    </div>

    <div class="tabs-card">
      <div class="filters">
        <select v-model="statusFilter" class="status-filter" @change="() => fetchApplications()">
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
        </select>

        <select v-model="selectedScholarshipId" class="scholarship-filter" @change="() => fetchApplications()">
          <option value="">全部奖学金</option>
          <option v-for="scholarship in scholarshipList" :key="scholarship._id" :value="scholarship._id">
            {{ scholarship.title }}
          </option>
        </select>

        <input
          v-model="userSearch"
          type="text"
          class="search-input"
          placeholder="搜索用户（账号/邮箱/姓名/手机号）"
          @input="handleSearch"
        />
      </div>

      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">待审核</span>
          <span class="stat-value pending">{{ pendingCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已通过</span>
          <span class="stat-value approved">{{ approvedCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已拒绝</span>
          <span class="stat-value rejected">{{ rejectedCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总计</span>
          <span class="stat-value">{{ totalCount }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else class="review-list">
      <div v-if="applicationList.length > 0">
        <div v-for="application in applicationList" :key="application._id" class="review-card">
          <div class="review-header">
            <div class="review-title">
              <div class="user-avatar">
                {{ getUserInitial(application.user) }}
              </div>
              <div>
                <h3>{{ application.user.name || application.user.account }}</h3>
                <p class="user-account">账号：{{ application.user.account }}</p>
              </div>
            </div>
            <span :class="['status-badge', `status-${application.status}`]">
              {{ getStatusText(application.status) }}
            </span>
          </div>

          <div class="review-content">
            <div class="info-section">
              <h4>申请的奖学金</h4>
              <div class="scholarship-info-box">
                <div class="scholarship-header-inline">
                  <h5>{{ application.scholarship?.title || '奖学金已删除' }}</h5>
                  <span v-if="application.scholarship?.amount" class="scholarship-amount">
                    ¥{{ application.scholarship.amount.toLocaleString('zh-CN') }}
                  </span>
                </div>
                <div v-if="application.scholarship" class="scholarship-details">
                  <span class="scholarship-type">{{ getScholarshipTypeText(application.scholarship.type) }}</span>
                  <span v-if="application.scholarship.quota" class="scholarship-quota">
                    名额：{{ application.scholarship.currentApplications || 0 }} / {{ application.scholarship.quota }}
                  </span>
                </div>
                <div v-else class="scholarship-deleted-notice">
                  该奖学金已被删除
                </div>
              </div>
            </div>

            <div class="info-section">
              <h4>用户信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>姓名：</label>
                  <span>{{ application.user.name || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <label>账号：</label>
                  <span>{{ application.user.account }}</span>
                </div>
                <div class="info-item">
                  <label>邮箱：</label>
                  <span>{{ application.user.email || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <label>手机号：</label>
                  <span>{{ application.user.phone || '未设置' }}</span>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h4>申请信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>申请时间：</label>
                  <span>{{ formatDate(application.appliedAt) }}</span>
                </div>
                <div class="info-item">
                  <label>申请截止：</label>
                  <span>{{ formatDate(application.scholarship?.applicationDeadline) }}</span>
                </div>
                <div class="info-item">
                  <label>公布日期：</label>
                  <span>{{ formatDate(application.scholarship?.announcementDate) }}</span>
                </div>
              </div>
            </div>

            <div v-if="application.status !== 'pending'" class="info-section">
              <h4>审核信息</h4>
              <div class="review-info">
                <p><strong>审核人：</strong>{{ application.reviewedBy?.name || '未知' }}</p>
                <p><strong>审核时间：</strong>{{ formatDate(application.reviewedAt) }}</p>
                <p v-if="application.reviewComment">
                  <strong>审核意见：</strong>{{ application.reviewComment }}
                </p>
              </div>
            </div>
          </div>

          <div class="review-actions">
            <template v-if="application.status === 'pending'">
              <button class="btn btn-approve" @click="handleApprove(application._id)">
                ✓ 通过
              </button>
              <button class="btn btn-reject" @click="openRejectDialog(application)">
                ✗ 拒绝
              </button>
            </template>
            <template v-else>
              <button class="btn btn-secondary" @click="openRejectDialog(application)">
                修改状态
              </button>
            </template>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <p>暂无{{ statusFilter ? getStatusText(statusFilter) : '' }}申请记录</p>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="pagination.totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="pagination.currentPage === 1" @click="changePage(pagination.currentPage - 1)">
        上一页
      </button>
      <span class="page-info">第 {{ pagination.currentPage }} 页，共 {{ pagination.totalPages }} 页（共 {{ pagination.totalItems }} 条记录）</span>
      <button class="page-btn" :disabled="pagination.currentPage === pagination.totalPages" @click="changePage(pagination.currentPage + 1)">
        下一页
      </button>
    </div>

    <!-- 审核对话框 -->
    <div v-if="showReviewDialog" class="dialog-overlay" @click="closeReviewDialog">
      <div class="dialog-content" @click.stop>
        <h3>审核申请</h3>
        <p class="dialog-subtitle">
          用户：{{ reviewTarget.userName }} | 奖学金：{{ reviewTarget.scholarshipTitle }}
        </p>

        <div class="form-group">
          <label>审核状态</label>
          <select v-model="reviewStatus" class="status-select">
            <option value="pending">待审核</option>
            <option value="approved">通过</option>
            <option value="rejected">拒绝</option>
          </select>
        </div>

        <div class="form-group">
          <label>审核意见</label>
          <textarea
            v-model="reviewComment"
            rows="4"
            placeholder="请输入审核意见..."
            maxlength="500"
          ></textarea>
        </div>

        <div class="dialog-actions">
          <button class="btn btn-primary" @click="confirmReview">确认</button>
          <button class="btn btn-secondary" @click="closeReviewDialog">取消</button>
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
import { getAllApplications, reviewApplication } from '@/api/scholarshipApplicationApi'
import type { ScholarshipApplication } from '@/api/scholarshipApplicationApi'
import { getScholarshipList } from '@/api/scholarshipApi'
import type { ScholarshipItem } from '@/api/scholarshipApi'

const statusFilter = ref('')
const selectedScholarshipId = ref('')
const userSearch = ref('')
const applicationList = ref<ScholarshipApplication[]>([])
const scholarshipList = ref<ScholarshipItem[]>([])
const loading = ref(false)
const showReviewDialog = ref(false)
const reviewComment = ref('')
const reviewStatus = ref<'pending' | 'approved' | 'rejected'>('approved')
const reviewTarget = reactive({
  id: '',
  userName: '',
  scholarshipTitle: ''
})

// 统计数据
const pendingCount = ref(0)
const approvedCount = ref(0)
const rejectedCount = ref(0)
const totalCount = ref(0)

// 分页信息
const pagination = reactive({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10
})

// 搜索防抖定时器
let searchTimer: ReturnType<typeof setTimeout> | null = null

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

// 获取申请列表
const fetchApplications = async (page: number = 1) => {
  loading.value = true
  try {
    const result = await getAllApplications({
      status: statusFilter.value as any,
      scholarshipId: selectedScholarshipId.value,
      userSearch: userSearch.value,
      page,
      limit: pagination.itemsPerPage
    })

    if (result.success) {
      // 过滤掉无效的申请记录（奖学金已被删除）
      const validApplications = (result.data || []).filter(
        (app: any) => app.scholarship && app.scholarship.title
      )
      applicationList.value = validApplications

      if (result.pagination) {
        pagination.currentPage = result.pagination.currentPage
        pagination.totalPages = result.pagination.totalPages
        pagination.totalItems = result.pagination.totalItems
        pagination.itemsPerPage = result.pagination.itemsPerPage
      }

      // 更新统计数据
      updateStats()
    }
  } catch (error: any) {
    console.error('获取申请列表失败:', error)
    showMessage('error', '获取申请列表失败')
    // 即使出错也设置为空数组，显示空状态
    applicationList.value = []
  } finally {
    loading.value = false
  }
}

// 获取奖学金列表
const fetchScholarships = async () => {
  try {
    const result = await getScholarshipList({
      page: 1,
      limit: 100,
      isPublic: 'false'
    })

    if (result.success) {
      scholarshipList.value = result.data || []
    }
  } catch (error: any) {
    console.error('获取奖学金列表失败:', error)
  }
}

// 更新统计数据
const updateStats = () => {
  // 重新获取全部数据以计算统计
  getAllApplications({ page: 1, limit: 1000 }).then(result => {
    if (result.success) {
      const allApps = result.data || []
      pendingCount.value = allApps.filter((app: ScholarshipApplication) => app.status === 'pending').length
      approvedCount.value = allApps.filter((app: ScholarshipApplication) => app.status === 'approved').length
      rejectedCount.value = allApps.filter((app: ScholarshipApplication) => app.status === 'rejected').length
      totalCount.value = allApps.length
    }
  })
}

// 处理搜索（防抖）
const handleSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    fetchApplications(1)
  }, 500)
}

// 获取用户名首字母
const getUserInitial = (user: any) => {
  const displayName = user.name || user.account
  if (!displayName) return 'U'
  return displayName.charAt(0).toUpperCase()
}

// 获取状态文本
const getStatusText = (status: string) => {
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

// 获取奖学金类型文本
const getScholarshipTypeText = (type: string) => {
  const map: Record<string, string> = {
    merit: '学业优秀奖学金',
    need: '助学金',
    special: '专项奖学金',
    research: '科研奖学金'
  }
  return map[type] || type
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

// 批准申请
const handleApprove = async (applicationId: string) => {
  if (!confirm('确认通过此申请吗？')) return

  try {
    const result = await reviewApplication(applicationId, 'approved', '')
    if (result.success) {
      showMessage('success', '申请已通过')
      fetchApplications(pagination.currentPage)
    }
  } catch (error: any) {
    showMessage('error', error.response?.data?.message || '审核失败')
  }
}

// 打开审核对话框
const openRejectDialog = (application: ScholarshipApplication) => {
  reviewTarget.id = application._id
  reviewTarget.userName = application.user.name || application.user.account
  reviewTarget.scholarshipTitle = application.scholarship?.title || '奖学金已删除'
  reviewStatus.value = application.status
  reviewComment.value = application.reviewComment || ''
  showReviewDialog.value = true
}

// 关闭审核对话框
const closeReviewDialog = () => {
  showReviewDialog.value = false
  reviewComment.value = ''
  reviewStatus.value = 'approved'
  reviewTarget.id = ''
  reviewTarget.userName = ''
  reviewTarget.scholarshipTitle = ''
}

// 确认审核
const confirmReview = async () => {
  try {
    const result = await reviewApplication(reviewTarget.id, reviewStatus.value, reviewComment.value)
    if (result.success) {
      showMessage('success', '审核成功')
      closeReviewDialog()
      fetchApplications(pagination.currentPage)
    }
  } catch (error: any) {
    showMessage('error', error.response?.data?.message || '审核失败')
  }
}

// 切换页码
const changePage = (page: number) => {
  if (page >= 1 && page <= pagination.totalPages) {
    fetchApplications(page)
  }
}

onMounted(() => {
  fetchScholarships()
  fetchApplications()
})
</script>

<style scoped>
.scholarship-review-page {
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

/* 选项卡和筛选 */
.tabs-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.filters {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
}

.status-filter,
.scholarship-filter {
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 150px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.status-filter:focus,
.scholarship-filter:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

/* 统计行 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
}

.stat-item {
  background: #f7fafc;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  display: block;
  color: #718096;
  font-size: 12px;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  display: block;
  color: #2d3748;
  font-size: 24px;
  font-weight: 700;
}

.stat-value.pending {
  color: #ed8936;
}

.stat-value.approved {
  color: #48bb78;
}

.stat-value.rejected {
  color: #f56565;
}

/* 审核列表 */
.review-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.review-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.review-title h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
}

.user-account {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
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

.review-content {
  padding: 30px;
}

.info-section {
  margin-bottom: 25px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h4 {
  color: #2d3748;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #edf2f7;
}

.scholarship-info-box {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px;
}

.scholarship-header-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.scholarship-header-inline h5 {
  color: #2d3748;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.scholarship-amount {
  color: #38a169;
  font-size: 18px;
  font-weight: 700;
}

.scholarship-details {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #718096;
}

.scholarship-type,
.scholarship-quota {
  padding: 4px 10px;
  background: white;
  border-radius: 6px;
}

.scholarship-deleted-notice {
  color: #e53e3e;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 12px;
  background: #fff5f5;
  border-radius: 6px;
  border: 1px solid #feb2b2;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.info-item label {
  color: #4a5568;
  font-weight: 500;
  min-width: 80px;
}

.info-item span {
  color: #2d3748;
}

.review-info {
  background: #f7fafc;
  padding: 15px;
  border-radius: 8px;
}

.review-info p {
  margin: 8px 0;
  color: #2d3748;
  font-size: 14px;
}

.review-actions {
  display: flex;
  gap: 15px;
  padding: 20px;
  border-top: 1px solid #edf2f7;
  justify-content: flex-end;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-approve {
  background: #48bb78;
  color: white;
}

.btn-approve:hover {
  background: #38a169;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-reject {
  background: #fc8181;
  color: white;
}

.btn-reject:hover {
  background: #f56565;
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

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.page-btn:hover:not(:disabled) {
  background: #4299e1;
  color: white;
  border-color: #4299e1;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #718096;
}

/* 空状态 */
.empty-state {
  background: white;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state p {
  color: #a0aec0;
  font-size: 16px;
  margin: 0;
}

/* 加载状态 */
.loading-state {
  background: white;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
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

.loading-state p {
  color: #718096;
  font-size: 14px;
  margin: 0;
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
  margin: 0 0 10px 0;
  color: #2d3748;
  font-size: 20px;
}

.dialog-subtitle {
  color: #718096;
  margin: 0 0 20px 0;
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

.form-group textarea,
.form-group .status-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.form-group textarea:focus,
.form-group .status-select:focus {
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

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-primary:hover {
  background: #3182ce;
  transform: translateY(-1px);
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
    align-items: stretch;
  }

  .status-filter,
  .scholarship-filter,
  .search-input {
    width: 100%;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .review-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .review-actions {
    flex-direction: column;
  }

  .scholarship-header-inline {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
