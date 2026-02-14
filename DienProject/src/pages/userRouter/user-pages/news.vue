<template>
  <div class="news-page">
    <div class="page-header">
      <h2>新闻信息</h2>
      <p>最新行业动态和重要通知</p>
    </div>

    <div class="news-filter">
      <div class="filter-controls">
        <input type="text" v-model="searchKeyword" placeholder="搜索新闻标题或内容" class="search-input">
        <select v-model="selectedCategory" class="category-select">
          <option value="">全部分类</option>
          <option value="industry">行业动态</option>
          <option value="notice">重要通知</option>
          <option value="activity">活动公告</option>
          <option value="achievement">成果展示</option>
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
      <button class="retry-btn" @click="fetchNews">重试</button>
    </div>

    <div v-else class="news-list">
      <div v-if="filteredNews.length === 0" class="empty-state">
        <p>暂无新闻数据</p>
      </div>
      <div
        v-else
        v-for="news in filteredNews"
        :key="news.id"
        :id="`news-${news.id}`"
        class="news-card"
        :class="{ 'highlight-news': highlightNewsId === news.id }"
      >
        <div class="news-cover-image">
          <img
            v-if="news.coverImage"
            :src="getImageUrl(news.coverImage)"
            :alt="news.title"
            @error="handleImageError"
          />
          <div v-else class="cover-placeholder">
            <span class="placeholder-icon">🖼️</span>
          </div>
        </div>
        <div class="news-body">
          <div class="news-header">
            <h3 class="news-title">{{ news.title }}</h3>
            <span class="news-date">{{ news.date }}</span>
          </div>
          <div class="news-content">
            <p>{{ news.content }}</p>
          </div>
          <div class="news-footer">
            <span class="news-category" :class="`category-${news.category}`">{{ news.categoryText }}</span>
            <button class="read-more-btn" @click="handleViewDocument(news)">查看详情</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && filteredNews.length > 0" class="pagination">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
      <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">下一页</button>
    </div>

    <!-- 文档预览弹窗 -->
    <DocumentViewer
      v-if="showDocumentViewer"
      :documentUrl="documentUrl"
      :fileName="selectedNews?.title || selectedNews?.documentFileName"
      :fileType="selectedNews?.documentFileType"
      noDocumentText="该新闻暂未上传相关文档"
      @close="closeDocumentViewer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import type { News } from '@/types'
import { getNewsList } from '@/api/newsApi'
import type { NewsItem } from '@/api/newsApi'
import DocumentViewer from '@/components/DocumentViewer.vue'
import { API_BASE_URL, isValidObjectId } from '@/utils/apiConfig'

const route = useRoute()

// 搜索和筛选状态
const searchKeyword = ref('')
const selectedCategory = ref<string>('')
const currentPage = ref<number>(1)
const pageSize = 10

// 新闻数据和加载状态
const newsData = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const totalPages = ref(1)

// 文档预览相关
const showDocumentViewer = ref(false)
const selectedNews = ref<any>(null)

// 高亮新闻ID
const highlightNewsId = ref<string>('')

// 获取新闻列表
const fetchNews = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await getNewsList({
      page: currentPage.value,
      limit: pageSize,
      category: selectedCategory.value || undefined,
      keyword: searchKeyword.value || undefined,
      status: 'published'
    })

    if (response.success) {
      // 转换数据格式
      newsData.value = response.data.map((item: any) => ({
        id: item._id,
        title: item.title,
        content: item.content || item.summary || '',
        date: new Date(item.publishedAt || item.createdAt).toISOString().split('T')[0],
        category: item.category,
        categoryText: getCategoryText(item.category),
        coverImage: item.coverImage,
        documentFile: item.documentFile,
        documentFileName: item.documentFileName,
        documentFileType: item.documentFileType
      }))

      // 更新总页数
      if (response.pagination) {
        totalPages.value = response.pagination.totalPages
      }
    }
  } catch (err: any) {
    error.value = err.message || '获取新闻列表失败'
    console.error('获取新闻失败:', err)
  } finally {
    loading.value = false
  }
}

// 分类文本映射
const getCategoryText = (category: string) => {
  const map: Record<string, string> = {
    'industry': '行业动态',
    'notice': '重要通知',
    'activity': '活动公告',
    'achievement': '成果展示'
  }
  return map[category] || category
}

// 滚动到指定新闻并高亮
const scrollToNews = async (newsId: string) => {
  // 等待DOM更新
  await nextTick()

  // 找到对应的新闻卡片元素
  const newsCard = document.getElementById(`news-${newsId}`)
  if (newsCard) {
    // 滚动到该元素
    newsCard.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // 添加高亮效果
    highlightNewsId.value = newsId

    // 3秒后移除高亮
    setTimeout(() => {
      highlightNewsId.value = ''
    }, 3000)
  }
}

// 组件挂载时获取数据
onMounted(async () => {
  // 获取路由中的 highlight 参数
  const highlightId = route.query.highlight as string

  await fetchNews()

  // 如果有高亮参数，滚动到对应新闻
  if (highlightId) {
    scrollToNews(highlightId)
  }
})

// 直接显示新闻数据（不再前端过滤，交给后端）
const filteredNews = computed<News[]>(() => {
  return newsData.value
})

// 处理筛选
const handleFilter = (): void => {
  currentPage.value = 1
  fetchNews()
}

// 监听页码变化
const changePage = (newPage: number) => {
  currentPage.value = newPage
  fetchNews()
}

// 处理查看文档
const handleViewDocument = (news: any): void => {
  selectedNews.value = news;
  showDocumentViewer.value = true;
}

// 关闭文档预览
const closeDocumentViewer = (): void => {
  showDocumentViewer.value = false
  selectedNews.value = null
}

// 获取图片URL
const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';

  // 检查是否是GridFS文件ID（24位十六进制字符串）
  if (isValidObjectId(imagePath)) {
    return `${API_BASE_URL}/api/files/${imagePath}`;
  }

  // 检查是否已经是完整URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // 传统文件路径，添加基础URL
  return `${API_BASE_URL}${imagePath}`;
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const placeholder = img.parentElement?.querySelector('.cover-placeholder');
  if (placeholder) {
    (placeholder as HTMLElement).style.display = 'flex';
  }
}

// 获取文档URL
const documentUrl = computed(() => {
  if (!selectedNews.value?.documentFile) return '';

  const documentFile = selectedNews.value.documentFile;

  // 检查是否是GridFS文件ID（24位十六进制字符串）
  if (isValidObjectId(documentFile)) {
    return `${API_BASE_URL}/api/files/${documentFile}`;
  }

  // 检查是否已经是完整URL
  if (documentFile.startsWith('http://') || documentFile.startsWith('https://')) {
    return documentFile;
  }

  // 传统文件路径，添加基础URL
  return `${API_BASE_URL}${documentFile}`;
})
</script>

<style scoped>
.news-page {
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

.news-filter {
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

.category-select {
  padding: 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-select:focus {
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

.news-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.news-card {
  display: flex;
  gap: 20px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s ease;
  background: white;
}

.news-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: #4299e1;
}

/* 高亮新闻卡片 */
.news-card.highlight-news {
  border-color: #4299e1;
  box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08);
  animation: highlight-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(66, 153, 225, 0.3), 0 8px 20px rgba(0, 0, 0, 0.12);
  }
}

.news-cover-image {
  flex-shrink: 0;
  width: 150px;
  height: 150px;
  border-radius: 12px;
  overflow: hidden;
  background: #f7fafc;
  position: relative;
}

.news-cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.placeholder-icon {
  font-size: 48px;
  opacity: 0.6;
}

.news-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.news-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
  flex: 1;
}

.news-date {
  font-size: 12px;
  color: #718096;
  white-space: nowrap;
  margin-left: 15px;
}

.news-content {
  margin-bottom: 15px;
}

.news-content p {
  font-size: 14px;
  line-height: 1.6;
  color: #4a5568;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.news-category {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
}

.category-industry {
  background: #ebf8ff;
  color: #2b6cb0;
}

.category-notice {
  background: #fff5f5;
  color: #c53030;
}

.category-activity {
  background: #f0fff4;
  color: #276749;
}

.category-achievement {
  background: #f7fafc;
  color: #4a5568;
}

.read-more-btn {
  font-size: 14px;
  color: #4299e1;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.read-more-btn:hover {
  color: #3182ce;
  text-decoration: underline;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input,
  .category-select {
    width: 100%;
  }

  .filter-btn {
    width: 100%;
  }

  .news-card {
    flex-direction: column;
    gap: 15px;
  }

  .news-cover-image {
    width: 100%;
    height: 200px;
  }

  .news-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .news-date {
    margin-left: 0;
  }
}
</style>