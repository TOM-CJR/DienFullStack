<template>
  <div class="courseware-my-page">
    <div class="page-header">
      <h2>我的课件</h2>
      <p>查看和管理您收藏的课件资源</p>
    </div>

    <!-- 筛选部分 -->
    <div class="courseware-filter-section">
      <div class="filter-card">
        <h3 class="filter-title">课件筛选</h3>
        <div class="filter-content">
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">搜索关键词</label>
              <input 
                type="text" 
                v-model="searchKeyword" 
                placeholder="输入课件名称或关键词"
                class="filter-input"
              >
            </div>
            <div class="filter-item">
              <label class="filter-label">课件类型</label>
              <select v-model="selectedType" class="filter-select">
                <option value="">全部类型</option>
                <option value="video">视频课件</option>
                <option value="document">文档课件</option>
                <option value="ppt">PPT课件</option>
                <option value="code">代码示例</option>
                <option value="other">其他类型</option>
              </select>
            </div>
          </div>
          <div class="filter-actions">
            <button class="filter-btn" @click="handleFilter">筛选课件</button>
            <button class="reset-btn" @click="handleReset">重置筛选</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 课件列表部分 -->
    <div class="courseware-list-section">
      <div class="list-header">
        <h3 class="list-title">收藏的课件</h3>
        <div class="sort-controls">
          <span class="sort-label">排序方式：</span>
          <select v-model="sortBy" class="sort-select">
            <option value="latest">最近收藏</option>
            <option value="name">名称排序</option>
            <option value="type">类型排序</option>
          </select>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button class="retry-btn" @click="fetchFavoritedCoursewares">重试</button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredCoursewares.length === 0 && coursewaresData.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <h4 class="empty-title">暂无收藏的课件</h4>
        <p class="empty-description">您还没有收藏任何课件，去浏览并收藏感兴趣的课件吧！</p>
        <router-link to="/users/courseware/all" class="browse-btn">浏览课件</router-link>
      </div>

      <!-- 筛选后的空状态 -->
      <div v-else-if="filteredCoursewares.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h4 class="empty-title">没有找到符合条件的课件</h4>
        <p class="empty-description">请尝试调整筛选条件</p>
        <button class="browse-btn" @click="handleReset">重置筛选</button>
      </div>
      
      <!-- 课件列表 -->
      <div v-else class="courseware-grid">
        <div v-for="courseware in filteredCoursewares" :key="courseware._id" class="courseware-card">
          <div class="courseware-card-header">
            <div class="courseware-type" :class="`type-${courseware.type}`">
              {{ getTypeText(courseware.type) }}
            </div>
            <button
              class="favorite-btn favorited"
              @click="handleRemoveFavorite(courseware._id)"
              title="取消收藏"
            >
              ❤️
            </button>
          </div>
          <div class="courseware-card-body">
            <h4 class="courseware-name">{{ courseware.name }}</h4>
            <p class="courseware-description">{{ courseware.description }}</p>
            <div class="courseware-meta">
              <div class="meta-item">
                <span class="meta-label">学科：</span>
                <span class="meta-value">{{ getSubjectText(courseware.subject) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">难度：</span>
                <span class="meta-value">{{ getLevelText(courseware.level) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">收藏时间：</span>
                <span class="meta-value">{{ courseware.favoriteDate }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">📊</span>
                <span class="meta-value">{{ courseware.viewCount || 0 }}次浏览</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">❤️</span>
                <span class="meta-value">{{ courseware.favoriteCount || 0 }}次收藏</span>
              </div>
            </div>
          </div>
          <div class="courseware-card-footer">
            <button class="preview-btn preview-btn-full" @click="handlePreview(courseware)">预览课件</button>
          </div>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="filteredCoursewares.length > 0" class="pagination">
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
        <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
      </div>
    </div>

    <!-- 文档预览弹窗 -->
    <DocumentViewer
      v-if="showDocumentViewer"
      :documentUrl="selectedDocumentUrl"
      :fileName="selectedDocumentName"
      :fileType="selectedDocumentType"
      @close="closeDocumentViewer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as coursewareApi from '@/api/coursewareApi'
import * as userActivityApi from '@/api/userActivityApi'
import DocumentViewer from '@/components/DocumentViewer.vue'
import { API_BASE_URL, isValidObjectId } from '@/utils/apiConfig'

const router = useRouter()

// 课件数据接口
interface CoursewareItem {
  _id: string
  name: string
  description: string
  type: string
  subject: string
  level: string
  documentFile?: string
  documentFileName?: string
  documentFileType?: string
  views?: number
  downloads?: number
  rating?: number
  createdAt: string
  favoriteDate?: string
  [key: string]: any
}

// 搜索和筛选状态
const searchKeyword = ref('')
const selectedType = ref<string>('')
const sortBy = ref<string>('latest')
const currentPage = ref<number>(1)
const pageSize = 12

// 状态
const loading = ref(false)
const error = ref('')
const coursewaresData = ref<CoursewareItem[]>([])

// 文档预览
const showDocumentViewer = ref(false)
const selectedDocumentUrl = ref('')
const selectedDocumentName = ref('')
const selectedDocumentType = ref('')

// 获取收藏的课件列表
const fetchFavoritedCoursewares = async () => {
  loading.value = true
  error.value = ''

  try {
    // 1. 获取用户的课件收藏记录
    const activitiesResponse = await userActivityApi.getMyActivities({
      activityType: 'courseware_favorite',
      resourceType: 'courseware'
    })

    if (!activitiesResponse.success || !activitiesResponse.data) {
      coursewaresData.value = []
      return
    }

    const activities = activitiesResponse.data

    // 2. 获取每个收藏课件的详细信息
    const coursewarePromises = activities.map(async (activity: any) => {
      try {
        const coursewareResponse = await coursewareApi.getCoursewareDetail(activity.resourceId)
        if (coursewareResponse.success && coursewareResponse.data) {
          return {
            ...coursewareResponse.data,
            favoriteDate: new Date(activity.createdAt).toLocaleDateString('zh-CN')
          }
        }
        return null
      } catch (err) {
        console.error(`获取课件 ${activity.resourceId} 详情失败:`, err)
        return null
      }
    })

    const coursewareResults = await Promise.all(coursewarePromises)

    // 过滤掉null值（被删除的课件）
    coursewaresData.value = coursewareResults.filter(c => c !== null) as CoursewareItem[]
  } catch (err: any) {
    console.error('获取收藏课件列表失败:', err)
    error.value = err.message || '获取收藏课件列表失败'
  } finally {
    loading.value = false
  }
}

// 计算过滤后的课件
const filteredCoursewares = computed<CoursewareItem[]>(() => {
  let result = coursewaresData.value.filter(courseware => {
    const matchesKeyword = !searchKeyword.value ||
      courseware.name.includes(searchKeyword.value) ||
      courseware.description.includes(searchKeyword.value)
    const matchesType = !selectedType.value || courseware.type === selectedType.value
    return matchesKeyword && matchesType
  })

  // 排序处理
  switch (sortBy.value) {
    case 'latest':
      result.sort((a, b) => {
        const dateA = a.favoriteDate || a.createdAt
        const dateB = b.favoriteDate || b.createdAt
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })
      break
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'type':
      result.sort((a, b) => getTypeText(a.type).localeCompare(getTypeText(b.type)))
      break
  }

  // 分页处理
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return result.slice(start, end)
})

// 计算总页数
const totalPages = computed<number>(() => {
  const filteredCount = coursewaresData.value.filter(courseware => {
    const matchesKeyword = !searchKeyword.value || 
      courseware.name.includes(searchKeyword.value) || 
      courseware.description.includes(searchKeyword.value)
    const matchesType = !selectedType.value || courseware.type === selectedType.value
    return matchesKeyword && matchesType
  }).length
  return Math.ceil(filteredCount / pageSize)
})

// 处理筛选
const handleFilter = (): void => {
  currentPage.value = 1
}

// 处理重置
const handleReset = (): void => {
  searchKeyword.value = ''
  selectedType.value = ''
  sortBy.value = 'latest'
  currentPage.value = 1
}

// 处理取消收藏
const handleRemoveFavorite = async (coursewareId: string): Promise<void> => {
  try {
    // 调用取消收藏API（isFavorited = true 表示当前是收藏状态，需要取消）
    await userActivityApi.toggleCoursewareFavorite(coursewareId, true)

    // 从列表中移除
    const index = coursewaresData.value.findIndex(c => c._id === coursewareId)
    if (index > -1) {
      coursewaresData.value.splice(index, 1)
    }

    showMessage('已取消收藏', 'info')
  } catch (err: any) {
    console.error('取消收藏失败:', err)
    showMessage('操作失败：' + (err.message || '未知错误'), 'error')
  }
}

// 处理预览
const handlePreview = (courseware: CoursewareItem): void => {
  if (courseware.documentFile) {
    selectedDocumentUrl.value = getDocumentUrl(courseware.documentFile)
    selectedDocumentName.value = courseware.documentFileName || courseware.name
    selectedDocumentType.value = courseware.documentFileType || ''
    showDocumentViewer.value = true
  } else {
    showMessage('该课件暂无文档', 'info')
  }
}

// 关闭文档预览
const closeDocumentViewer = () => {
  showDocumentViewer.value = false
}

// 获取文档URL
const getDocumentUrl = (documentFile: string): string => {
  if (!documentFile) return ''

  // GridFS 文件ID
  if (isValidObjectId(documentFile)) {
    return `${API_BASE_URL}/api/files/${documentFile}`
  }

  // 完整URL
  if (documentFile.startsWith('http://') || documentFile.startsWith('https://')) {
    return documentFile
  }

  // 相对路径
  return `${API_BASE_URL}${documentFile}`
}

// 显示消息提示
const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  const bgColors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  }

  const div = document.createElement('div')
  div.textContent = message
  div.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${bgColors[type]};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-size: 14px;
    font-weight: 600;
    animation: slideDown 0.3s ease;
  `

  document.body.appendChild(div)

  setTimeout(() => {
    div.style.animation = 'slideUp 0.3s ease'
    setTimeout(() => div.remove(), 300)
  }, 2000)
}

// 工具函数
const getTypeText = (type: string) => {
  const map: Record<string, string> = {
    video: '视频',
    document: '文档',
    ppt: '演示文稿',
    code: '代码',
    other: '其他'
  }
  return map[type] || type
}

const getSubjectText = (subject: string) => {
  const map: Record<string, string> = {
    computer: '计算机',
    math: '数学',
    physics: '物理',
    chemistry: '化学',
    biology: '生物',
    other: '其他'
  }
  return map[subject] || subject
}

const getLevelText = (level: string) => {
  const map: Record<string, string> = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级'
  }
  return map[level] || level
}

// 组件挂载时获取收藏列表
onMounted(() => {
  fetchFavoritedCoursewares()
})
</script>

<style scoped>
.courseware-my-page {
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

/* 筛选部分样式 */
.courseware-filter-section {
  margin-bottom: 30px;
}

.filter-card {
  background: #f7fafc;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.filter-title {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 15px 0;
}

.filter-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.filter-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 200px;
}

.filter-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 6px;
}

.filter-input,
.filter-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.filter-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.filter-btn,
.reset-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.filter-btn {
  background: #4299e1;
  color: white;
}

.filter-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.reset-btn {
  background: #a0aec0;
  color: white;
}

.reset-btn:hover {
  background: #718096;
  transform: translateY(-1px);
}

/* 列表部分样式 */
.courseware-list-section {
  margin-top: 30px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-label {
  font-size: 14px;
  color: #4a5568;
  font-weight: 600;
}

.sort-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

/* 加载和错误状态 */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #f7fafc;
  border-radius: 8px;
  margin-bottom: 30px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f4f6;
  border-top-color: #4299e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p,
.error-state p {
  margin: 20px 0;
  font-size: 16px;
  color: #718096;
}

.error-message {
  color: #ef4444;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 10px 24px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 600;
}

.retry-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #f7fafc;
  border-radius: 8px;
  margin-bottom: 30px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 10px 0;
}

.empty-description {
  font-size: 14px;
  color: #718096;
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.browse-btn {
  display: inline-block;
  padding: 10px 24px;
  background: #4299e1;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.browse-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 课件网格 */
.courseware-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.courseware-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.courseware-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: #4299e1;
}

.courseware-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
}

.courseware-type {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.type-video {
  background: #ebf8ff;
  color: #2b6cb0;
}

.type-document {
  background: #f0fff4;
  color: #276749;
}

.type-ppt {
  background: #fffaf0;
  color: #c05621;
}

.type-code {
  background: #f7fafc;
  color: #4a5568;
}

.type-other {
  background: #faf5ff;
  color: #553c9a;
}

.favorite-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 4px;
  border-radius: 50%;
}

.favorite-btn:hover {
  background: rgba(229, 62, 62, 0.1);
  transform: scale(1.1);
}

.courseware-card-body {
  padding: 16px;
}

.courseware-name {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 10px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.courseware-description {
  font-size: 14px;
  line-height: 1.5;
  color: #4a5568;
  margin: 0 0 15px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.courseware-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-item {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-label {
  font-weight: 600;
  color: #718096;
}

.meta-value {
  color: #4a5568;
}

.courseware-card-footer {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
}

.preview-btn,
.download-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.preview-btn {
  background: #4299e1;
  color: white;
}

.preview-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
}

.download-btn {
  background: #38a169;
  color: white;
}

.download-btn:hover {
  background: #2f855a;
  transform: translateY(-1px);
}

/* 分页样式 */
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

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
  }

  .filter-item {
    width: 100%;
  }

  .filter-actions {
    flex-direction: column;
  }

  .filter-btn,
  .reset-btn {
    width: 100%;
  }

  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .courseware-grid {
    grid-template-columns: 1fr;
  }
}

/* 消息提示动画 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes slideUp {
  from {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
}
</style>