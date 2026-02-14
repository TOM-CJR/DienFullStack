<template>
  <div class="latest-news-container">
    <!-- 标题区域 -->
    <div class="news-header">
      <h2 class="main-title">最新资讯</h2>
      <p class="subtitle">为您带来最新的行业动态和技术资讯</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button class="btn-retry" @click="() => fetchLatestNews()">重试</button>
    </div>

    <!-- 新闻网格 -->
    <b-container v-else fluid class="news-grid">
      <b-row g-5>
        <b-col v-for="news in newsItems" :key="news.id" :xs="12" :sm="6" :md="4" class="box-margin">
          <div class="news-card">
            <div class="news-image-container">
              <img
                v-if="news.coverImage"
                :src="getImageUrl(news.coverImage)"
                :alt="news.title"
                class="news-image"
                @error="handleImageError"
              >
              <div v-else class="image-placeholder">
                <span class="placeholder-icon">📰</span>
              </div>
              <div class="image-overlay"></div>
            </div>
            <div class="news-content">
              <h3 class="news-title">{{ news.title }}</h3>
              <p class="news-description">{{ news.content }}</p>
              <b-button variant="primary" class="read-more-btn" @click="handleViewDetail">
                查看详情
                <b-icon icon="chevron-right" class="btn-icon"></b-icon>
              </b-button>
            </div>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script setup lang="ts">
import { BContainer, BRow, BCol, BButton } from 'bootstrap-vue-next'
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getNewsList } from '@/api/newsApi'
import { API_BASE_URL, isValidObjectId } from '@/utils/apiConfig'

interface NewsItemDisplay {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
}

const router = useRouter()
const userStore = useUserStore()

const newsItems = ref<NewsItemDisplay[]>([])
const loading = ref(false)
const error = ref('')

// 定时刷新控制
let refreshInterval: number | null = null
const REFRESH_INTERVAL = 5 * 60 * 1000 // 5分钟自动刷新一次

// 保存的滚动位置
let savedScrollPosition = 0

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
}

// 检查数据是否有变化
const hasDataChanged = (newData: NewsItemDisplay[], oldData: NewsItemDisplay[]): boolean => {
  if (newData.length !== oldData.length) return true

  return newData.some((newItem, index) => {
    const oldItem = oldData[index]
    return !oldItem ||
           newItem.id !== oldItem.id ||
           newItem.title !== oldItem.title ||
           newItem.content !== oldItem.content ||
           newItem.coverImage !== oldItem.coverImage
  })
}

// 获取最新新闻（只获取前6条）
const fetchLatestNews = async (silent: boolean = false) => {
  // silent 模式：后台静默刷新，不显示 loading 状态
  if (!silent) {
    loading.value = true
  } else {
    // 静默刷新时，保存当前滚动位置
    savedScrollPosition = window.scrollY || document.documentElement.scrollTop
  }

  error.value = ''

  try {
    const response = await getNewsList({
      page: 1,
      limit: 6,
      status: 'published',
      sortBy: 'createdAt',
      order: 'desc'
    })

    if (response.success) {
      const newNewsData = response.data.map((item: any) => ({
        id: item._id,
        title: item.title,
        content: item.summary || item.content || '',
        coverImage: item.coverImage
      }))

      // 静默刷新时，只有数据真正变化才更新
      if (silent) {
        if (hasDataChanged(newNewsData, newsItems.value)) {
          newsItems.value = newNewsData

          // 等待 DOM 更新后恢复滚动位置
          await nextTick()
          window.scrollTo({
            top: savedScrollPosition,
            behavior: 'instant' // 瞬间滚动，不使用平滑动画
          })
        }
        // 如果数据没变化，什么都不做，保持原有状态
      } else {
        // 首次加载时直接更新
        newsItems.value = newNewsData
      }
    }
  } catch (err: any) {
    if (!silent) {
      error.value = err.message || '获取新闻列表失败'
    }
    console.error('获取最新新闻失败:', err)
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

// 启动定时刷新
const startAutoRefresh = () => {
  // 清除现有的定时器
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }

  // 设置新的定时器
  refreshInterval = setInterval(() => {
    // 静默刷新，不显示 loading
    fetchLatestNews(true)
  }, REFRESH_INTERVAL)
}

// 停止定时刷新
const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// 监听页面可见性变化
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    // 页面变为可见时，静默刷新数据
    fetchLatestNews(true)
    // 重启定时刷新
    startAutoRefresh()
  } else {
    // 页面不可见时，停止定时刷新以节省资源
    stopAutoRefresh()
  }
}

// 处理查看详情
const handleViewDetail = () => {
  alert('请登录后台查看完整新闻资讯')
}

// 组件挂载时获取数据
onMounted(() => {
  // 初始加载
  fetchLatestNews()

  // 启动定时刷新
  startAutoRefresh()

  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

// 组件卸载时清理
onUnmounted(() => {
  // 停止定时刷新
  stopAutoRefresh()

  // 移除事件监听
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<script lang="ts">
export default {
  name: 'LatestNews'
}
</script>

<style scoped>
.latest-news-container {
  padding: 80px 20px 60px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
}

/* 标题样式 */
.news-header {
  text-align: center;
  margin-bottom: 60px;
}

.main-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 15px;
  position: relative;
  display: inline-block;
}

.main-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #9b59b6);
  border-radius: 2px;
}

.subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  max-width: 600px;
  margin: 0 auto;
}

/* 新闻网格 */
.news-grid {
  padding: 0 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 列间距 */
.box-margin {
  margin-bottom: 40px;
}

/* 新闻卡片 - 重新设计以适配正方形封面 */
.news-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.news-card:hover {
  transform: translateY(-12px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

/* 图片容器 - 正方形设计 */
.news-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #f0f0f0;
}

.news-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.news-card:hover .news-image {
  transform: scale(1.1);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0.3) 100%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
}

.news-card:hover .image-overlay {
  opacity: 1;
}

/* 图片占位符 */
.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.placeholder-icon {
  font-size: 80px;
  opacity: 0.8;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

/* 内容区域 */
.news-content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.news-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 2.4em;
}

.news-description {
  font-size: 0.95rem;
  color: #7f8c8d;
  line-height: 1.7;
  margin-bottom: 20px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 按钮样式 */
.read-more-btn {
  background: linear-gradient(135deg, #3498db 0%, #9b59b6 100%);
  border: none;
  padding: 12px 24px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.9rem;
  color: white;
  transition: all 0.3s ease;
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.read-more-btn:hover {
  background: linear-gradient(135deg, #2980b9 0%, #8e44ad 100%);
  transform: translateX(5px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.btn-icon {
  font-size: 0.9rem;
  transition: transform 0.3s ease;
}

.read-more-btn:hover .btn-icon {
  transform: translateX(4px);
}

/* 加载和错误状态 */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e8ecf1;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p,
.error-state p {
  font-size: 16px;
  color: #7f8c8d;
  margin-top: 16px;
}

.error-message {
  color: #e74c3c;
  margin-bottom: 16px;
  font-weight: 600;
}

.btn-retry {
  padding: 12px 28px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.btn-retry:hover {
  background: linear-gradient(135deg, #2980b9 0%, #1f6fa8 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

/* 响应式设计 */
@media (max-width: 992px) {
  .main-title {
    font-size: 2.2rem;
  }

  .news-title {
    font-size: 1.1rem;
  }

  .news-description {
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .latest-news-container {
    padding: 60px 15px 40px;
  }

  .main-title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .news-header {
    margin-bottom: 40px;
  }

  .box-margin {
    margin-bottom: 30px;
  }

  .news-content {
    padding: 20px;
  }

  .news-title {
    font-size: 1.1rem;
  }

  .news-description {
    -webkit-line-clamp: 2;
  }
}

@media (max-width: 576px) {
  .latest-news-container {
    padding: 40px 15px 30px;
  }

  .main-title {
    font-size: 1.8rem;
  }

  .news-header {
    margin-bottom: 30px;
  }

  .box-margin {
    margin-bottom: 20px;
  }

  .news-content {
    padding: 18px;
  }

  .news-title {
    font-size: 1.05rem;
    -webkit-line-clamp: 2;
  }

  .news-description {
    font-size: 0.85rem;
    -webkit-line-clamp: 2;
    margin-bottom: 16px;
  }

  .read-more-btn {
    padding: 10px 20px;
    font-size: 0.85rem;
  }

  .placeholder-icon {
    font-size: 60px;
  }
}
</style>