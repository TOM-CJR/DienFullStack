<template>
  <div class="scholarship-page">
    <div class="page-header">
      <h2>奖学金信息</h2>
      <p>各类奖学金申请信息和详细说明</p>
    </div>

    <div class="scholarship-filter">
      <div class="filter-controls">
        <input type="text" v-model="searchKeyword" placeholder="搜索奖学金标题或描述" class="search-input">
        <select v-model="selectedType" class="type-select">
          <option value="">全部类型</option>
          <option value="academic">学业优秀奖学金</option>
          <option value="need">助学金</option>
          <option value="special">专项奖学金</option>
          <option value="research">科研奖学金</option>
        </select>
        <button class="filter-btn" @click="handleFilter">筛选</button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button class="retry-btn" @click="fetchScholarships">重试</button>
    </div>

    <div v-else class="scholarship-list">
      <div v-if="filteredScholarships.length === 0" class="empty-state">
        <p>暂无奖学金数据</p>
      </div>
      <div v-else v-for="scholarship in filteredScholarships" :key="scholarship._id" class="scholarship-card">
        <div class="scholarship-header">
          <div class="title-section">
            <h3 class="scholarship-title">{{ scholarship.title }}</h3>
            <span class="scholarship-amount">¥{{ scholarship.amount.toLocaleString('zh-CN') }}</span>
          </div>
          <span class="scholarship-type" :class="`type-${scholarship.type}`">{{ getTypeText(scholarship.type) }}</span>
        </div>
        <div class="scholarship-content">
          <div class="scholarship-info">
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">发布日期：</span>
                <span class="info-value">{{ formatDate(scholarship.publishDate) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">申请截止：</span>
                <span class="info-value">{{ formatDate(scholarship.applicationDeadline) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">公布日期：</span>
                <span class="info-value">{{ formatDate(scholarship.announcementDate) }}</span>
              </div>
            </div>
            <div class="info-row" v-if="scholarship.quota">
              <div class="info-item">
                <span class="info-label">名额信息：</span>
                <span class="info-value">已申请 {{ scholarship.currentApplications || 0 }} / 总名额 {{ scholarship.quota }}</span>
              </div>
            </div>
          </div>
          <p class="scholarship-description">{{ getDescriptionSummary(scholarship.description) }}</p>
        </div>
        <div class="scholarship-footer">
          <div class="status-group">
            <span class="scholarship-status" :class="`status-${getScholarshipStatus(scholarship).type}`">
              {{ getScholarshipStatus(scholarship).text }}
            </span>
            <span
              v-if="getApplicationStatusBadge(scholarship._id)"
              class="application-status"
              :class="getApplicationStatusBadge(scholarship._id)?.class"
            >
              {{ getApplicationStatusBadge(scholarship._id)?.text }}
            </span>
          </div>
          <div class="scholarship-actions">
            <button
              v-if="getScholarshipStatus(scholarship).canApply && !getUserApplication(scholarship._id)"
              class="apply-btn"
              @click="handleApply(scholarship._id)"
            >
              立即申请
            </button>
            <span v-else-if="getUserApplication(scholarship._id)" class="applied-hint">
              已申请
            </span>
            <button
              v-if="scholarship.documentFile"
              class="detail-btn"
              @click="handleViewDocument(scholarship)"
            >
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && filteredScholarships.length > 0" class="pagination">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
      <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">下一页</button>
    </div>

    <!-- 文档预览弹窗 -->
    <div v-if="showDocumentViewer" class="modal-overlay" @click.self="closeDocumentViewer">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ selectedScholarship?.title }}</h2>
          <button class="btn-close" @click="closeDocumentViewer">&times;</button>
        </div>
        <div class="modal-body">
          <DocumentViewer
            :documentUrl="documentUrl"
            :fileName="selectedScholarship?.documentFileName"
            :fileType="selectedScholarship?.documentFileType"
            noDocumentText="该奖学金暂未上传相关文档"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getScholarshipList, applyScholarship } from '@/api/scholarshipApi'
import type { ScholarshipItem } from '@/api/scholarshipApi'
import DocumentViewer from '@/components/DocumentViewer.vue'
import { getMyApplications, createScholarshipApplication } from '@/api/scholarshipApplicationApi'
import type { ScholarshipApplication } from '@/api/scholarshipApplicationApi'
import { API_BASE_URL, isValidObjectId } from '@/utils/apiConfig'

// 搜索和筛选状态
const searchKeyword = ref('')
const selectedType = ref<string>('')
const currentPage = ref<number>(1)
const pageSize = 10

// 奖学金数据和加载状态
const scholarshipData = ref<ScholarshipItem[]>([])
const loading = ref(false)
const error = ref('')
const totalPages = ref(1)

// 用户申请记录
const userApplications = ref<ScholarshipApplication[]>([])

// 文档预览相关
const showDocumentViewer = ref(false)
const selectedScholarship = ref<ScholarshipItem | null>(null)

// 获取奖学金状态
const getScholarshipStatus = (scholarship: ScholarshipItem) => {
  const now = new Date()
  const publishDate = new Date(scholarship.publishDate)
  const applicationDeadline = new Date(scholarship.applicationDeadline)
  const announcementDate = new Date(scholarship.announcementDate)

  if (now < publishDate) {
    // 这种情况不应该出现，因为API已经过滤了
    return { text: '未发布', type: 'draft', canApply: false }
  } else if (now >= publishDate && now < applicationDeadline) {
    return { text: '申请中', type: 'applying', canApply: true }
  } else if (now >= applicationDeadline && now < announcementDate) {
    return { text: '待公布', type: 'pending', canApply: false }
  } else {
    // now >= announcementDate
    return { text: '已公布', type: 'announced', canApply: false }
  }
}

// 获取奖学金列表
const fetchScholarships = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await getScholarshipList({
      page: currentPage.value,
      limit: pageSize,
      type: selectedType.value || undefined,
      keyword: searchKeyword.value || undefined,
      status: 'published',
      isPublic: 'true' // 只获取公开的奖学金
    })

    if (response.success) {
      // 过滤掉发布日期晚于当前时间的奖学金
      const now = new Date()
      scholarshipData.value = (response.data || []).filter((item: ScholarshipItem) => {
        const publishDate = new Date(item.publishDate)
        return publishDate <= now && item.status === 'published'
      })

      // 更新总页数
      if (response.pagination) {
        totalPages.value = response.pagination.totalPages
      }
    }
  } catch (err: any) {
    error.value = err.message || '获取奖学金列表失败'
    console.error('获取奖学金失败:', err)
  } finally {
    loading.value = false
  }
}

// 类型文本映射
const getTypeText = (type: string) => {
  const map: Record<string, string> = {
    'academic': '学业优秀奖学金',
    'need': '助学金',
    'special': '专项奖学金',
    'research': '科研奖学金'
  }
  return map[type] || type
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 获取描述摘要（截取前100字）
const getDescriptionSummary = (description: string) => {
  if (!description) return ''
  return description.length > 100 ? description.substring(0, 100) + '...' : description
}

// 获取用户的申请记录
const fetchUserApplications = async () => {
  try {
    const response = await getMyApplications()
    if (response.success) {
      // 过滤掉无效的申请记录（奖学金已被删除）
      const validApplications = (response.data || []).filter(
        (app: any) => app.scholarship && app.scholarship._id
      )
      userApplications.value = validApplications
    }
  } catch (err: any) {
    console.error('获取申请记录失败:', err)
    // 即使获取失败也设置为空数组，不影响页面显示
    userApplications.value = []
  }
}

// 检查用户是否已申请某个奖学金
const getUserApplication = (scholarshipId: string): ScholarshipApplication | undefined => {
  return userApplications.value.find(app => app.scholarship._id === scholarshipId)
}

// 获取申请状态标签
const getApplicationStatusBadge = (scholarshipId: string) => {
  const application = getUserApplication(scholarshipId)
  if (!application) return null

  const statusMap = {
    pending: { text: '待审核', class: 'status-pending' },
    approved: { text: '已通过', class: 'status-approved' },
    rejected: { text: '已拒绝', class: 'status-rejected' }
  }

  return statusMap[application.status] || null
}

// 组件挂载时获取数据
onMounted(() => {
  fetchScholarships()
  fetchUserApplications()
})

// 直接显示奖学金数据（不再前端过滤，交给后端）
const filteredScholarships = computed<ScholarshipItem[]>(() => {
  return scholarshipData.value
})

// 处理筛选
const handleFilter = (): void => {
  currentPage.value = 1
  fetchScholarships()
}

// 监听页码变化
const changePage = (newPage: number) => {
  currentPage.value = newPage
  fetchScholarships()
}

// 处理申请
const handleApply = async (scholarshipId: string): Promise<void> => {
  try {
    // 检查是否已申请
    if (getUserApplication(scholarshipId)) {
      alert('您已经申请过该奖学金')
      return
    }

    const confirmation = confirm('确定要申请此奖学金吗？')
    if (!confirmation) return

    const response = await createScholarshipApplication(scholarshipId)

    if (response.success) {
      alert('申请成功！请在个人中心查看申请状态。')
      // 刷新申请列表和奖学金列表
      await fetchUserApplications()
      await fetchScholarships()
    } else {
      alert(response.message || '申请失败，请稍后重试')
    }
  } catch (err: any) {
    console.error('申请奖学金失败:', err)
    const errorMessage = err.response?.data?.message || err.message || '申请失败，请稍后重试'
    alert(errorMessage)
  }
}

// 处理查看文档
const handleViewDocument = (scholarship: ScholarshipItem): void => {
  selectedScholarship.value = scholarship
  showDocumentViewer.value = true
}

// 关闭文档预览
const closeDocumentViewer = (): void => {
  showDocumentViewer.value = false
  selectedScholarship.value = null
}

// 获取文档URL
const documentUrl = computed(() => {
  if (!selectedScholarship.value?.documentFile) return ''

  const documentFile = selectedScholarship.value.documentFile

  // 检查是否是GridFS文件ID（24位十六进制字符串）
  if (isValidObjectId(documentFile)) {
    return `${API_BASE_URL}/api/files/${documentFile}`
  }

  // 检查是否已经是完整URL
  if (documentFile.startsWith('http://') || documentFile.startsWith('https://')) {
    return documentFile
  }

  // 传统文件路径，添加基础URL
  return `${API_BASE_URL}${documentFile}`
})
</script>

<style scoped>
.scholarship-page {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.page-header {
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e2e8f0;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 5px 0;
}

.page-header p {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.scholarship-filter {
  margin-bottom: 25px;
  padding: 15px;
  background: #f7fafc;
  border-radius: 8px;
}

.filter-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.type-select {
  padding: 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.filter-btn {
  padding: 10px 20px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.scholarship-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.scholarship-card {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: white;
}

.scholarship-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: #4299e1;
}

.scholarship-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f1f5f9;
}

.title-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.scholarship-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.scholarship-amount {
  font-size: 20px;
  font-weight: 700;
  color: #38a169;
}

.scholarship-type {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  white-space: nowrap;
  align-self: flex-start;
}

.type-academic {
  background: #ebf8ff;
  color: #2b6cb0;
}

.type-need {
  background: #fef5e7;
  color: #d68910;
}

.type-special {
  background: #f0fff4;
  color: #276749;
}

.type-research {
  background: #faf5ff;
  color: #6b46c1;
}

.scholarship-content {
  margin-bottom: 15px;
}

.scholarship-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.info-label {
  font-weight: 600;
  color: #718096;
}

.info-value {
  color: #4a5568;
}

.scholarship-description {
  font-size: 14px;
  line-height: 1.6;
  color: #4a5568;
  margin: 0;
}

.scholarship-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #f1f5f9;
}

.status-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.scholarship-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
}

.application-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
}

.status-draft {
  background: #f7fafc;
  color: #4a5568;
}

.status-applying {
  background: #f0fff4;
  color: #276749;
}

.status-pending {
  background: #fef5e7;
  color: #d68910;
}

.status-announced {
  background: #ebf8ff;
  color: #2b6cb0;
}

.status-approved {
  background: #c6f6d5;
  color: #2f855a;
}

.status-rejected {
  background: #fed7d7;
  color: #c53030;
}

.scholarship-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.applied-hint {
  font-size: 14px;
  color: #718096;
  font-weight: 500;
}

.apply-btn,
.detail-btn {
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.apply-btn {
  background: #48bb78;
  color: white;
}

.apply-btn:hover {
  background: #38a169;
  transform: translateY(-1px);
}

.detail-btn {
  background: none;
  color: #4299e1;
  border: 1px solid #4299e1;
}

.detail-btn:hover {
  background: #4299e1;
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 30px;
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

/* 加载状态 */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p,
.error-state p,
.empty-state p {
  margin-top: 20px;
  font-size: 16px;
  color: #718096;
}

.error-message {
  color: #e53e3e;
  margin-bottom: 15px;
}

.retry-btn {
  padding: 10px 24px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.retry-btn:hover {
  background: #3182ce;
}

/* 文档预览弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 1200px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #2d3748;
  font-weight: 600;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: #e5e7eb;
}

.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input,
  .type-select {
    width: 100%;
  }

  .filter-btn {
    width: 100%;
  }

  .scholarship-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .scholarship-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .scholarship-actions {
    width: 100%;
  }

  .modal-content {
    max-width: 100%;
    height: 95vh;
  }
}
</style>
