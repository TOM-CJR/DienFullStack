<template>
  <div class="courseware-all-page">
    <div class="page-header">
      <h2>全部课件</h2>
      <p>浏览和搜索所有可用的课件资源</p>
    </div>

    <!-- 课件查询类别部分 -->
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
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">学科分类</label>
              <select v-model="selectedSubject" class="filter-select">
                <option value="">全部学科</option>
                <option value="computer">计算机科学</option>
                <option value="math">数学</option>
                <option value="physics">物理</option>
                <option value="chemistry">化学</option>
                <option value="biology">生物</option>
                <option value="other">其他学科</option>
              </select>
            </div>
            <div class="filter-item">
              <label class="filter-label">难度等级</label>
              <select v-model="selectedLevel" class="filter-select">
                <option value="">全部难度</option>
                <option value="beginner">初级</option>
                <option value="intermediate">中级</option>
                <option value="advanced">高级</option>
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
        <h3 class="list-title">课件列表</h3>
        <div class="sort-controls">
          <span class="sort-label">排序方式：</span>
          <select v-model="sortBy" class="sort-select">
            <option value="latest">最新上传</option>
            <option value="popular">最受欢迎</option>
            <option value="rating">评分最高</option>
            <option value="name">名称排序</option>
          </select>
        </div>
      </div>
      
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button class="retry-btn" @click="fetchCoursewareList">重试</button>
      </div>

      <div v-else class="courseware-grid">
        <div v-for="courseware in coursewareList" :key="courseware._id" class="courseware-card">
          <div class="courseware-card-header">
            <div class="courseware-type" :class="`type-${courseware.type}`">
              {{ getTypeText(courseware.type) }}
            </div>
            <button
              class="favorite-btn"
              :class="{ 'favorited': isFavorited(courseware._id) }"
              @click="handleFavorite(courseware._id)"
              :title="isFavorited(courseware._id) ? '取消收藏' : '收藏课件'"
            >
              {{ isFavorited(courseware._id) ? '❤️' : '🤍' }}
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
                <span class="meta-label">上传时间：</span>
                <span class="meta-value">{{ formatDate(courseware.createdAt) }}</span>
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
            <button
              v-if="courseware.documentFile"
              class="preview-btn preview-btn-full"
              @click="handlePreview(courseware)"
            >
              预览课件
            </button>
            <span v-else class="no-document-hint">暂无课件文档</span>
          </div>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="!loading && coursewareList.length > 0" class="pagination">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          上一页
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          下一页
        </button>
      </div>

      <div v-if="!loading && coursewareList.length === 0" class="empty-state">
        <p>暂无课件数据</p>
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
import { ref, onMounted } from 'vue';
import * as coursewareApi from '@/api/coursewareApi';
import * as userActivityApi from '@/api/userActivityApi';
import DocumentViewer from '@/components/DocumentViewer.vue';
import { API_BASE_URL, isValidObjectId } from '@/utils/apiConfig';

interface CoursewareItem {
  _id: string;
  name: string;
  description: string;
  type: string;
  subject: string;
  level: string;
  documentFile?: string;
  documentFileName?: string;
  documentFileType?: string;
  viewCount?: number;
  favoriteCount?: number;
  createdAt: string;
  [key: string]: any;
}

// 状态
const loading = ref(false);
const error = ref('');
const coursewareList = ref<CoursewareItem[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const pageSize = 12;

// 收藏状态映射：coursewareId => isFavorited
const favoriteStatusMap = ref<Map<string, boolean>>(new Map());

// 搜索和筛选状态
const searchKeyword = ref('');
const selectedType = ref('');
const selectedSubject = ref('');
const selectedLevel = ref('');
const sortBy = ref('createdAt');

// 文档预览
const showDocumentViewer = ref(false);
const selectedDocumentUrl = ref('');
const selectedDocumentName = ref('');
const selectedDocumentType = ref('');

// 获取课件列表
const fetchCoursewareList = async () => {
  loading.value = true;
  error.value = '';
  try {
    // 确定排序方式
    let sortField = 'createdAt';
    let order = 'desc';
    if (sortBy.value === 'popular') {
      sortField = 'views';
    } else if (sortBy.value === 'rating') {
      sortField = 'rating';
    } else if (sortBy.value === 'name') {
      sortField = 'name';
      order = 'asc';
    }

    const params = {
      page: currentPage.value,
      limit: pageSize,
      keyword: searchKeyword.value || undefined,
      type: selectedType.value || undefined,
      subject: selectedSubject.value || undefined,
      level: selectedLevel.value || undefined,
      status: 'published', // 只显示已发布的课件
      sortBy: sortField,
      order
    };
    const response = await coursewareApi.getCoursewareList(params);
    coursewareList.value = response.data || [];
    totalPages.value = Math.ceil((response.pagination?.totalItems || 0) / pageSize);

    // 获取收藏状态
    await fetchFavoriteStatus();
  } catch (err: any) {
    error.value = err.message || '获取课件列表失败';
  } finally {
    loading.value = false;
  }
};

// 获取收藏状态
const fetchFavoriteStatus = async () => {
  try {
    // 获取用户的所有课件收藏记录
    const response = await userActivityApi.getMyActivities({
      activityType: 'courseware_favorite',
      resourceType: 'courseware'
    });

    // 清空之前的状态
    favoriteStatusMap.value.clear();

    // 构建收藏状态映射
    if (response.success && response.data) {
      const activities = response.data;
      activities.forEach((activity: any) => {
        favoriteStatusMap.value.set(activity.resourceId, true);
      });
    }
  } catch (err: any) {
    console.error('获取收藏状态失败:', err);
  }
};

// 检查课件是否已收藏
const isFavorited = (coursewareId: string): boolean => {
  return favoriteStatusMap.value.get(coursewareId) || false;
};

// 处理筛选
const handleFilter = () => {
  currentPage.value = 1;
  fetchCoursewareList();
};

// 处理重置
const handleReset = () => {
  searchKeyword.value = '';
  selectedType.value = '';
  selectedSubject.value = '';
  selectedLevel.value = '';
  sortBy.value = 'createdAt';
  currentPage.value = 1;
  fetchCoursewareList();
};

// 切换页码
const changePage = (page: number) => {
  currentPage.value = page;
  fetchCoursewareList();
};

// 处理收藏
const handleFavorite = async (id: string) => {
  try {
    // 重新获取收藏状态，确保是最新的
    await fetchFavoriteStatus();

    const currentStatus = isFavorited(id);

    // 调用切换收藏API
    await userActivityApi.toggleCoursewareFavorite(id, currentStatus);

    // 更新本地状态
    favoriteStatusMap.value.set(id, !currentStatus);

    // 显示提示
    if (!currentStatus) {
      showMessage('收藏成功！', 'success');
    } else {
      showMessage('已取消收藏', 'info');
    }
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || err.message || '未知错误';

    // 如果是已收藏错误，刷新状态
    if (err.response?.data?.code === 'ALREADY_FAVORITED') {
      await fetchFavoriteStatus();
    }

    showMessage('操作失败：' + errorMsg, 'error');
  }
};

// 显示消息提示
const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  // 简单的消息提示实现
  const bgColors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  };

  const div = document.createElement('div');
  div.textContent = message;
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
  `;

  document.body.appendChild(div);

  setTimeout(() => {
    div.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => div.remove(), 300);
  }, 2000);
};

// 处理预览
const handlePreview = (courseware: CoursewareItem) => {
  if (courseware.documentFile) {
    selectedDocumentUrl.value = getDocumentUrl(courseware.documentFile);
    selectedDocumentName.value = courseware.documentFileName || courseware.name;
    selectedDocumentType.value = courseware.documentFileType || '';
    showDocumentViewer.value = true;
  }
};

// 关闭文档预览
const closeDocumentViewer = () => {
  showDocumentViewer.value = false;
};

// 获取文档URL
const getDocumentUrl = (documentFile: string): string => {
  if (!documentFile) return '';

  // GridFS 文件ID
  if (isValidObjectId(documentFile)) {
    return `${API_BASE_URL}/api/files/${documentFile}`;
  }

  // 完整URL
  if (documentFile.startsWith('http://') || documentFile.startsWith('https://')) {
    return documentFile;
  }

  // 相对路径
  return `${API_BASE_URL}${documentFile}`;
};

// 工具函数
const getTypeText = (type: string) => {
  const map: Record<string, string> = {
    video: '视频',
    document: '文档',
    ppt: '演示文稿',
    code: '代码',
    other: '其他'
  };
  return map[type] || type;
};

const getSubjectText = (subject: string) => {
  const map: Record<string, string> = {
    computer: '计算机',
    math: '数学',
    physics: '物理',
    chemistry: '化学',
    biology: '生物',
    other: '其他'
  };
  return map[subject] || subject;
};

const getLevelText = (level: string) => {
  const map: Record<string, string> = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级'
  };
  return map[level] || level;
};

const formatDate = (date: string) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('zh-CN');
};

onMounted(() => {
  fetchCoursewareList();
});
</script>

<style scoped>
.courseware-all-page {
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

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
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
}

.retry-btn:hover {
  background: #3182ce;
}

.empty-state p {
  color: #718096;
  font-size: 16px;
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

.favorite-btn.favorited {
  animation: favorite-pulse 0.3s ease;
}

@keyframes favorite-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
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

.preview-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  background: #4299e1;
  color: white;
}

.preview-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
}

.preview-btn-full {
  width: 100%;
}

.no-document-hint {
  flex: 1;
  text-align: center;
  font-size: 14px;
  color: #a0aec0;
  font-style: italic;
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