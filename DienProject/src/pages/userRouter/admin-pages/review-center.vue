<template>
  <div class="review-center-page">
    <div class="page-header">
      <h2>审核中心</h2>
      <p>审核机构和学校的认证申请</p>
    </div>

    <!-- 选项卡 -->
    <div class="tabs-card">
      <div class="tabs">
        <button
          :class="{ active: activeTab === 'organization' }"
          @click="activeTab = 'organization'"
        >
          机构认证 ({{ orgPendingCount }})
        </button>
        <button :class="{ active: activeTab === 'school' }" @click="activeTab = 'school'">
          学校认证 ({{ schoolPendingCount }})
        </button>
      </div>
      <div class="filters">
        <select v-model="statusFilter" class="status-filter" @change="() => fetchData()">
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已批准</option>
          <option value="rejected">已拒绝</option>
        </select>
        <input
          v-model="userSearch"
          type="text"
          class="search-input"
          placeholder="搜索用户（账号/邮箱/手机号）"
          @input="handleSearch"
        />
      </div>
    </div>

    <!-- 机构审核列表 -->
    <div v-if="activeTab === 'organization'" class="review-list">
      <div v-if="organizationList.length > 0">
        <div v-for="org in organizationList" :key="org._id" class="review-card">
          <div class="review-header">
            <div class="review-title">
              <div class="logo-preview">
                <img v-if="getLogoUrl(org.logo || '')" :src="getLogoUrl(org.logo || '') || ''" alt="LOGO" />
                <span v-else>🏢</span>
              </div>
              <div>
                <h3>{{ org.name }}</h3>
                <p class="review-code">机构代码：{{ org.code || '无' }}</p>
              </div>
            </div>
            <span :class="['status-badge', `status-${org.status}`]">
              {{ getStatusText(org.status) }}
            </span>
          </div>

          <div class="review-content">
            <div class="info-section">
              <h4>基本信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>机构类型：</label>
                  <span>{{ org.type || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <label>联系人：</label>
                  <span>{{ org.contactPerson }}</span>
                </div>
                <div class="info-item">
                  <label>联系电话：</label>
                  <span>{{ org.contactPhone }}</span>
                </div>
                <div class="info-item">
                  <label>电子邮箱：</label>
                  <span>{{ org.email || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <label>省份城市：</label>
                  <span>{{ org.province }} {{ org.city }}</span>
                </div>
                <div class="info-item">
                  <label>详细地址：</label>
                  <span>{{ org.address || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <label>提交用户：</label>
                  <span>{{ getUserName(org.user) }}</span>
                </div>
                <div class="info-item">
                  <label>用户账号：</label>
                  <span>{{ getUserAccount(org.user) }}</span>
                </div>
                <div class="info-item">
                  <label>联系方式：</label>
                  <span>{{ getUserContact(org.user) }}</span>
                </div>
                <div class="info-item">
                  <label>提交时间：</label>
                  <span>{{ formatDate(org.createdAt) }}</span>
                </div>
              </div>
            </div>

            <div v-if="org.description" class="info-section">
              <h4>机构简介</h4>
              <p class="description-text">{{ org.description }}</p>
            </div>

            <div v-if="org.certificates && org.certificates.length > 0" class="info-section">
              <h4>资质证书</h4>
              <div class="certificates-list">
                <div v-for="(cert, index) in org.certificates" :key="index" class="cert-item">
                  <span class="cert-icon">📄</span>
                  <div class="cert-info">
                    <div class="cert-name">{{ cert.name }}</div>
                    <div v-if="cert.number" class="cert-number">编号：{{ cert.number }}</div>
                  </div>
                  <a
                    :href="getFileUrl(cert.fileId)"
                    target="_blank"
                    class="btn-view"
                  >
                    查看
                  </a>
                </div>
              </div>
            </div>

            <div v-if="org.status !== 'pending'" class="info-section">
              <h4>审核信息</h4>
              <div class="review-info">
                <p><strong>审核人：</strong>{{ getReviewerName(org.reviewedBy) }}</p>
                <p><strong>审核时间：</strong>{{ formatDate(org.reviewedAt) }}</p>
                <p v-if="org.reviewComment">
                  <strong>审核意见：</strong>{{ org.reviewComment }}
                </p>
              </div>
            </div>
          </div>

          <div class="review-actions">
            <template v-if="org.status === 'pending'">
              <button class="btn btn-approve" @click="handleApprove('organization', org._id)">
                ✓ 批准
              </button>
              <button class="btn btn-reject" @click="openRejectDialog('organization', org)">
                ✗ 拒绝
              </button>
            </template>
            <template v-else-if="org.status === 'approved'">
              <button class="btn btn-reject" @click="openRejectDialog('organization', org)">
                撤销批准
              </button>
            </template>
            <template v-else-if="org.status === 'rejected'">
              <button class="btn btn-approve" @click="handleApprove('organization', org._id)">
                重新批准
              </button>
            </template>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <p>暂无{{ statusFilter ? getStatusText(statusFilter) : '' }}机构认证申请</p>
      </div>
    </div>

    <!-- 学校审核列表 -->
    <div v-if="activeTab === 'school'" class="review-list">
      <div v-if="schoolList.length > 0">
        <div v-for="school in schoolList" :key="school._id" class="review-card">
          <div class="review-header">
            <div class="review-title">
              <div class="logo-preview">
                <img v-if="getLogoUrl(school.logo || '')" :src="getLogoUrl(school.logo || '') || ''" alt="LOGO" />
                <span v-else>🏫</span>
              </div>
              <div>
                <h3>{{ school.name }}</h3>
                <p class="review-code">学校代码：{{ school.code || '无' }}</p>
              </div>
            </div>
            <span :class="['status-badge', `status-${school.status}`]">
              {{ getStatusText(school.status) }}
            </span>
          </div>

          <div class="review-content">
            <div class="info-section">
              <h4>基本信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>学校类型：</label>
                  <span>{{ getSchoolTypeText(school.type || '') }}</span>
                </div>
                <div class="info-item">
                  <label>联系人：</label>
                  <span>{{ school.contactPerson }}</span>
                </div>
                <div class="info-item">
                  <label>联系电话：</label>
                  <span>{{ school.contactPhone }}</span>
                </div>
                <div class="info-item">
                  <label>电子邮箱：</label>
                  <span>{{ school.email || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <label>省份城市：</label>
                  <span>{{ school.province }} {{ school.city }}</span>
                </div>
                <div class="info-item">
                  <label>详细地址：</label>
                  <span>{{ school.address || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <label>提交用户：</label>
                  <span>{{ getUserName(school.user) }}</span>
                </div>
                <div class="info-item">
                  <label>用户账号：</label>
                  <span>{{ getUserAccount(school.user) }}</span>
                </div>
                <div class="info-item">
                  <label>联系方式：</label>
                  <span>{{ getUserContact(school.user) }}</span>
                </div>
                <div class="info-item">
                  <label>提交时间：</label>
                  <span>{{ formatDate(school.createdAt) }}</span>
                </div>
              </div>
            </div>

            <div v-if="school.description" class="info-section">
              <h4>学校简介</h4>
              <p class="description-text">{{ school.description }}</p>
            </div>

            <div v-if="school.certificates && school.certificates.length > 0" class="info-section">
              <h4>资质证书</h4>
              <div class="certificates-list">
                <div v-for="(cert, index) in school.certificates" :key="index" class="cert-item">
                  <span class="cert-icon">📄</span>
                  <div class="cert-info">
                    <div class="cert-name">{{ cert.name }}</div>
                    <div v-if="cert.number" class="cert-number">编号：{{ cert.number }}</div>
                  </div>
                  <a
                    :href="getFileUrl(cert.fileId)"
                    target="_blank"
                    class="btn-view"
                  >
                    查看
                  </a>
                </div>
              </div>
            </div>

            <div v-if="school.status !== 'pending'" class="info-section">
              <h4>审核信息</h4>
              <div class="review-info">
                <p><strong>审核人：</strong>{{ getReviewerName(school.reviewedBy) }}</p>
                <p><strong>审核时间：</strong>{{ formatDate(school.reviewedAt) }}</p>
                <p v-if="school.reviewComment">
                  <strong>审核意见：</strong>{{ school.reviewComment }}
                </p>
              </div>
            </div>
          </div>

          <div class="review-actions">
            <template v-if="school.status === 'pending'">
              <button class="btn btn-approve" @click="handleApprove('school', school._id)">
                ✓ 批准
              </button>
              <button class="btn btn-reject" @click="openRejectDialog('school', school)">
                ✗ 拒绝
              </button>
            </template>
            <template v-else-if="school.status === 'approved'">
              <button class="btn btn-reject" @click="openRejectDialog('school', school)">
                撤销批准
              </button>
            </template>
            <template v-else-if="school.status === 'rejected'">
              <button class="btn btn-approve" @click="handleApprove('school', school._id)">
                重新批准
              </button>
            </template>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <p>暂无{{ statusFilter ? getStatusText(statusFilter) : '' }}学校认证申请</p>
      </div>
    </div>

    <!-- 拒绝原因对话框 -->
    <div v-if="showRejectDialog" class="dialog-overlay" @click="closeRejectDialog">
      <div class="dialog-content" @click.stop>
        <h3>拒绝审核</h3>
        <p class="dialog-subtitle">
          {{ rejectTarget.type === 'organization' ? '机构' : '学校' }}：{{ rejectTarget.name }}
        </p>
        <div class="form-group">
          <label>拒绝原因</label>
          <textarea
            v-model="rejectComment"
            rows="4"
            placeholder="请输入拒绝原因..."
            maxlength="500"
          ></textarea>
        </div>
        <div class="dialog-actions">
          <button class="btn btn-primary" @click="confirmReject">确认拒绝</button>
          <button class="btn btn-secondary" @click="closeRejectDialog">取消</button>
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
import { ref, reactive, onMounted, watch } from 'vue'
import { getAllOrganizations, reviewOrganization } from '@/api/organizationApi'
import { getAllSchools, reviewSchool } from '@/api/schoolApi'
import type { Organization } from '@/api/organizationApi'
import type { School } from '@/api/schoolApi'
import { getFileUrl, isValidObjectId } from '@/utils/apiConfig'

const activeTab = ref<'organization' | 'school'>('organization')
const statusFilter = ref('')
const userSearch = ref('')
const organizationList = ref<Organization[]>([])
const schoolList = ref<School[]>([])
const orgPendingCount = ref(0)
const schoolPendingCount = ref(0)
const showRejectDialog = ref(false)
const rejectComment = ref('')
const rejectTarget = reactive({
  type: '',
  id: '',
  name: ''
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

// 获取机构列表
const fetchOrganizations = async () => {
  try {
    const result = await getAllOrganizations({
      status: statusFilter.value,
      userSearch: userSearch.value
    })
    if (result.success) {
      organizationList.value = result.data
      orgPendingCount.value = result.data.filter((org: Organization) => org.status === 'pending')
        .length
    }
  } catch (error: any) {
    console.error('获取机构列表失败:', error)
  }
}

// 获取学校列表
const fetchSchools = async () => {
  try {
    const result = await getAllSchools({
      status: statusFilter.value,
      userSearch: userSearch.value
    })
    if (result.success) {
      schoolList.value = result.data
      schoolPendingCount.value = result.data.filter((school: School) => school.status === 'pending')
        .length
    }
  } catch (error: any) {
    console.error('获取学校列表失败:', error)
  }
}

// 获取数据
const fetchData = () => {
  if (activeTab.value === 'organization') {
    fetchOrganizations()
  } else {
    fetchSchools()
  }
}

// 获取LOGO URL
const getLogoUrl = (logo: string) => {
  if (!logo) return null
  if (isValidObjectId(logo)) {
    return getFileUrl(logo)
  }
  return logo
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '待审核'
    case 'approved':
      return '已批准'
    case 'rejected':
      return '已拒绝'
    default:
      return '未知'
  }
}

// 获取学校类型文本
const getSchoolTypeText = (type: string) => {
  switch (type) {
    case 'primary':
      return '小学'
    case 'middle':
      return '中学'
    case 'high':
      return '高中'
    case 'university':
      return '大学'
    default:
      return '未设置'
  }
}

// 获取用户名
const getUserName = (user: any) => {
  if (!user) return '未知用户'
  return user.name || user.account || '未知用户'
}

// 获取用户账号
const getUserAccount = (user: any) => {
  if (!user) return '未知'
  return user.account || '未设置'
}

// 获取用户联系方式
const getUserContact = (user: any) => {
  if (!user) return '未知'
  if (user.email) return user.email
  if (user.phone) return user.phone
  return '未设置'
}

// 处理搜索（防抖）
const handleSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    fetchData()
  }, 500)
}

// 获取审核人名称
const getReviewerName = (reviewer: any) => {
  if (!reviewer) return '未知'
  return reviewer.name || '未知'
}

// 格式化日期
const formatDate = (date: any) => {
  if (!date) return '未知'
  return new Date(date).toLocaleString('zh-CN')
}

// 批准
const handleApprove = async (type: 'organization' | 'school', id: string) => {
  if (!confirm('确认批准此申请吗？')) return

  try {
    let result
    if (type === 'organization') {
      result = await reviewOrganization(id, 'approved', '')
    } else {
      result = await reviewSchool(id, 'approved', '')
    }

    if (result.success) {
      showMessage('success', '审核已批准')
      fetchData()
    }
  } catch (error: any) {
    showMessage('error', error.response?.data?.message || '审核失败')
  }
}

// 打开拒绝对话框
const openRejectDialog = (type: 'organization' | 'school', item: Organization | School) => {
  rejectTarget.type = type
  rejectTarget.id = item._id
  rejectTarget.name = item.name
  rejectComment.value = ''
  showRejectDialog.value = true
}

// 关闭拒绝对话框
const closeRejectDialog = () => {
  showRejectDialog.value = false
  rejectComment.value = ''
  rejectTarget.type = ''
  rejectTarget.id = ''
  rejectTarget.name = ''
}

// 确认拒绝
const confirmReject = async () => {
  if (!rejectComment.value.trim()) {
    showMessage('error', '请输入拒绝原因')
    return
  }

  try {
    let result
    if (rejectTarget.type === 'organization') {
      result = await reviewOrganization(rejectTarget.id, 'rejected', rejectComment.value)
    } else {
      result = await reviewSchool(rejectTarget.id, 'rejected', rejectComment.value)
    }

    if (result.success) {
      showMessage('success', '审核已拒绝')
      closeRejectDialog()
      fetchData()
    }
  } catch (error: any) {
    showMessage('error', error.response?.data?.message || '审核失败')
  }
}

// 监听选项卡切换
watch(activeTab, () => {
  fetchData()
})

onMounted(() => {
  fetchOrganizations()
  fetchSchools()
})
</script>

<style scoped>
.review-center-page {
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

/* 选项卡 */
.tabs-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.tabs button {
  padding: 10px 20px;
  border: none;
  background: #f7fafc;
  color: #4a5568;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tabs button.active {
  background: #4299e1;
  color: white;
}

.tabs button:hover {
  transform: translateY(-1px);
}

.filters {
  display: flex;
  gap: 15px;
  align-items: center;
}

.status-filter {
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 150px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.status-filter:focus {
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

.search-input::placeholder {
  color: #a0aec0;
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

.logo-preview {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  overflow: hidden;
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-title h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
}

.review-code {
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

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

.description-text {
  color: #2d3748;
  line-height: 1.6;
  margin: 0;
  font-size: 14px;
}

.certificates-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.cert-icon {
  font-size: 24px;
}

.cert-info {
  flex: 1;
}

.cert-name {
  color: #2d3748;
  font-weight: 500;
  font-size: 14px;
}

.cert-number {
  color: #718096;
  font-size: 12px;
  margin-top: 2px;
}

.btn-view {
  padding: 6px 12px;
  background: #4299e1;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.3s ease;
}

.btn-view:hover {
  background: #3182ce;
  transform: translateY(-1px);
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

.btn-approve,
.btn-reject {
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

.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}

.form-group textarea:focus {
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
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
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
  .tabs-card {
    flex-direction: column;
    align-items: stretch;
  }

  .tabs {
    width: 100%;
  }

  .tabs button {
    flex: 1;
  }

  .status-filter {
    width: 100%;
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
}
</style>
