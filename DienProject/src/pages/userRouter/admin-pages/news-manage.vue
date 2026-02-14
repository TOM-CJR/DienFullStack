<template>
  <div class="news-manage">
    <div class="page-header">
      <h1 class="page-title">新闻管理</h1>
      <button class="btn-primary" @click="openCreateDialog">
        <span class="icon">+</span>
        创建新闻
      </button>
    </div>

    <div class="filter-toolbar">
      <div class="filter-group">
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="搜索新闻标题或内容..."
          class="search-input"
          @keyup.enter="handleSearch"
        />

        <select v-model="filters.category" class="filter-select">
          <option value="">全部分类</option>
          <option value="industry">行业动态</option>
          <option value="notice">公告通知</option>
          <option value="activity">活动资讯</option>
          <option value="achievement">成果展示</option>
        </select>

        <select v-model="filters.status" class="filter-select">
          <option value="">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="archived">已归档</option>
        </select>

        <button class="btn-search" @click="handleSearch">筛选</button>
        <button class="btn-reset" @click="handleReset">重置</button>
      </div>
    </div>

    <div class="content-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button class="btn-retry" @click="fetchNewsList">重试</button>
      </div>

      <div v-else>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>分类</th>
              <th>状态</th>
              <th>创建者</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in newsList" :key="item._id">
              <td>{{ item._id }}</td>
              <td class="title-cell">{{ item.title }}</td>
              <td>
                <span :class="['category-tag', `category-${item.category}`]">
                  {{ getCategoryText(item.category) }}
                </span>
              </td>
              <td>
                <span :class="['status-tag', `status-${item.status}`]">
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td>{{ item.author?.name || item.creator || '未知' }}</td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td class="action-cell">
                <button class="btn-edit" @click="openEditDialog(item)">编辑</button>
                <button class="btn-delete" @click="handleDelete(item._id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="newsList.length === 0" class="empty-state">
          <p>暂无数据</p>
        </div>
      </div>
    </div>

    <div v-if="!loading && newsList.length > 0" class="pagination">
      <button
        class="btn-page"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        上一页
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button
        class="btn-page"
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        下一页
      </button>
    </div>

    <!-- 创建/编辑弹窗 -->
    <div v-if="showDialog" class="modal-overlay" @click.self="closeDialog">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? '编辑新闻' : '创建新闻' }}</h2>
          <button class="btn-close" @click="closeDialog">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>标题 <span class="required">*</span></label>
            <input
              v-model="formData.title"
              type="text"
              placeholder="请输入新闻标题"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>分类 <span class="required">*</span></label>
            <select v-model="formData.category" class="form-select">
              <option value="">请选择分类</option>
              <option value="industry">行业动态</option>
              <option value="notice">公告通知</option>
              <option value="activity">活动资讯</option>
              <option value="achievement">成果展示</option>
            </select>
          </div>

          <div class="form-group">
            <label>封面图片 <span class="required">*</span></label>
            <div class="upload-area">
              <input
                ref="coverImageInput"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                @change="handleCoverImageUpload"
                style="display: none"
              />
              <div v-if="coverImagePreview" class="image-preview-container">
                <img :src="coverImagePreview" alt="封面预览" class="cover-image-preview" />
                <button class="btn-remove-image" @click="removeCoverImage">删除</button>
              </div>
              <button v-else class="btn-upload" @click="coverImageInput?.click()">
                <span class="icon">🖼️</span>
                上传封面图片 (JPG, PNG, GIF, WebP)
              </button>
            </div>
            <p class="hint-text">建议上传正方形图片，展示时将自动裁剪为正方形</p>
          </div>

          <div class="form-group">
            <label>新闻文档</label>
            <div class="upload-area">
              <input
                ref="documentInput"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                @change="handleDocumentUpload"
                style="display: none"
              />
              <div v-if="documentFileName" class="file-preview">
                <div class="file-info">
                  <span class="file-icon">📄</span>
                  <span class="file-name">{{ documentFileName }}</span>
                </div>
                <button class="btn-remove" @click="removeDocument">删除</button>
              </div>
              <button v-else class="btn-upload" @click="documentInput?.click()">
                <span class="icon">+</span>
                上传文档 (PDF, Word, Excel, PPT)
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>摘要</label>
            <textarea
              v-model="formData.summary"
              placeholder="请输入新闻摘要"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>内容 <span class="required">*</span></label>
            <textarea
              v-model="formData.content"
              placeholder="请输入新闻内容"
              class="form-textarea"
              rows="10"
            ></textarea>
          </div>

          <div class="form-group">
            <label>状态</label>
            <select v-model="formData.status" class="form-select">
              <option value="draft">草稿</option>
              <option value="published">发布</option>
              <option value="archived">归档</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeDialog">取消</button>
          <button
            class="btn-submit"
            @click="handleSubmit"
            :disabled="submitting"
          >
            {{ submitting ? '提交中...' : '提交' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import * as newsApi from '@/api/newsApi';
import { API_BASE_URL, isValidObjectId } from '@/utils/apiConfig';

interface NewsItem {
  _id: string;
  id?: string;
  title: string;
  category: string;
  status: string;
  creator?: string;
  author?: any;
  createdAt: string;
  summary?: string;
  content: string;
  coverImage?: string;
  documentFile?: string;
  documentFileName?: string;
  documentFileType?: string;
  [key: string]: any;
}

const loading = ref(false);
const error = ref('');
const newsList = ref<NewsItem[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const pageSize = 10;

const filters = reactive({
  keyword: '',
  category: '',
  status: ''
});

const showDialog = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const editingId = ref<string | null>(null);

const formData = reactive({
  title: '',
  category: '',
  summary: '',
  content: '',
  status: 'draft',
  coverImage: null as File | null,
  existingCoverImage: '',
  documentFile: null as File | null,
  existingDocumentFile: '',
  removeDocument: false  // 标记是否要删除文档
});

const documentFileName = ref('');
const documentInput = ref<HTMLInputElement | null>(null);
const coverImageInput = ref<HTMLInputElement | null>(null);
const coverImagePreview = ref('');

// 获取新闻列表
const fetchNewsList = async () => {
  loading.value = true;
  error.value = '';
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize,
      keyword: filters.keyword || undefined,
      category: filters.category || undefined,
      status: filters.status || undefined
    };
    const response = await newsApi.getNewsList(params);
    newsList.value = response.data || [];
    totalPages.value = Math.ceil((response.pagination?.totalItems || 0) / pageSize);
  } catch (err: any) {
    error.value = err.message || '获取新闻列表失败';
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchNewsList();
};

// 重置
const handleReset = () => {
  filters.keyword = '';
  filters.category = '';
  filters.status = '';
  currentPage.value = 1;
  fetchNewsList();
};

// 切换页码
const changePage = (page: number) => {
  currentPage.value = page;
  fetchNewsList();
};

// 打开创建对话框
const openCreateDialog = () => {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  showDialog.value = true;
};

// 打开编辑对话框
const openEditDialog = (item: NewsItem) => {
  isEditing.value = true;
  editingId.value = item._id;
  formData.title = item.title;
  formData.category = item.category;
  formData.summary = item.summary || '';
  formData.content = item.content;
  formData.status = item.status;
  formData.existingCoverImage = item.coverImage || '';
  formData.existingDocumentFile = item.documentFile || '';
  formData.removeDocument = false;  // 重置删除标记

  // 设置封面图片预览
  if (item.coverImage) {
    coverImagePreview.value = getImageUrl(item.coverImage);
  }

  // 设置文档文件名
  if (item.documentFileName) {
    documentFileName.value = item.documentFileName;
  }
  showDialog.value = true;
};

// 关闭对话框
const closeDialog = () => {
  showDialog.value = false;
  resetForm();
};

// 重置表单
const resetForm = () => {
  formData.title = '';
  formData.category = '';
  formData.summary = '';
  formData.content = '';
  formData.status = 'draft';
  formData.coverImage = null;
  formData.existingCoverImage = '';
  formData.documentFile = null;
  formData.existingDocumentFile = '';
  formData.removeDocument = false;
  documentFileName.value = '';
  coverImagePreview.value = '';
};

// 处理封面图片上传
const handleCoverImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('请上传有效的图片格式（JPG, PNG, GIF, WebP）');
      return;
    }

    // 验证文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('图片大小不能超过10MB');
      return;
    }

    formData.coverImage = file;

    // 生成预览
    const reader = new FileReader();
    reader.onload = (e) => {
      coverImagePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

// 删除封面图片
const removeCoverImage = () => {
  formData.coverImage = null;
  formData.existingCoverImage = '';
  coverImagePreview.value = '';
  if (coverImageInput.value) {
    coverImageInput.value.value = '';
  }
};

// 处理文档上传
const handleDocumentUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    formData.documentFile = file;
    formData.removeDocument = false;  // 上传新文档时取消删除标记
    documentFileName.value = file.name;
  }
};

// 删除文档
const removeDocument = () => {
  formData.documentFile = null;
  formData.existingDocumentFile = '';
  formData.removeDocument = true;  // 标记要删除文档
  documentFileName.value = '';
  if (documentInput.value) {
    documentInput.value.value = '';
  }
};

// 提交表单
const handleSubmit = async () => {
  // 防止重复提交
  if (submitting.value) {
    return;
  }

  // 验证必填项
  if (!formData.title || !formData.category || !formData.content) {
    alert('请填写必填项（标题、分类、内容）');
    return;
  }

  // 验证封面图片（创建时必须上传，编辑时可以保留原有图片）
  if (!isEditing.value && !formData.coverImage) {
    alert('请上传封面图片');
    return;
  }

  if (isEditing.value && !formData.coverImage && !formData.existingCoverImage) {
    alert('请上传封面图片');
    return;
  }

  submitting.value = true;

  try {
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('summary', formData.summary);
    formDataToSend.append('content', formData.content);
    formDataToSend.append('status', formData.status);

    // 处理封面图片
    if (formData.coverImage) {
      // 上传了新封面图片
      formDataToSend.append('coverImage', formData.coverImage);
    }

    // 处理文档文件
    if (formData.documentFile) {
      // 上传了新文档
      formDataToSend.append('documentFile', formData.documentFile);
    } else if (formData.removeDocument) {
      // 标记删除文档
      formDataToSend.append('removeDocument', 'true');
    } else if (isEditing.value && formData.existingDocumentFile) {
      // 保留现有文档
      formDataToSend.append('existingDocumentFile', formData.existingDocumentFile);
    }

    if (isEditing.value && editingId.value) {
      await newsApi.updateNews(editingId.value, formDataToSend);
    } else {
      await newsApi.createNews(formDataToSend);
    }

    alert('操作成功！');
    closeDialog();
    await fetchNewsList();
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || err.message || '操作失败';
    alert(errorMsg);
  } finally {
    submitting.value = false;
  }
};

// 删除
const handleDelete = async (id: string) => {
  if (!confirm('确定要删除这条新闻吗?')) {
    return;
  }

  try {
    await newsApi.deleteNews(id);
    alert('删除成功！');
    await fetchNewsList();
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || err.message || '删除失败';
    alert(errorMsg);
  }
};

// 工具函数
const getCategoryText = (category: string) => {
  const map: Record<string, string> = {
    industry: '行业动态',
    notice: '公告通知',
    activity: '活动资讯',
    achievement: '成果展示'
  };
  return map[category] || category;
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    published: '已发布',
    draft: '草稿',
    archived: '已归档'
  };
  return map[status] || status;
};

const formatDate = (date: string) => {
  if (!date) return '';
  return new Date(date).toLocaleString('zh-CN');
};

// 获取图片URL，处理GridFS文件ID和传统文件路径
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
};

onMounted(() => {
  fetchNewsList();
});
</script>

<style scoped>
.news-manage {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.btn-primary .icon {
  font-size: 20px;
  font-weight: bold;
}

.filter-toolbar {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.btn-search,
.btn-reset {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-search {
  background: #667eea;
  color: white;
}

.btn-search:hover {
  background: #5568d3;
}

.btn-reset {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-reset:hover {
  background: #e5e7eb;
}

.content-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  min-height: 400px;
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
  border-top-color: #667eea;
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

.btn-retry {
  padding: 10px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #f9fafb;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  border-bottom: 2px solid #e5e7eb;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
  color: #4b5563;
}

.data-table tr:hover {
  background: #f9fafb;
}

.title-cell {
  font-weight: 500;
  color: #1f2937;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-tag,
.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.category-industry { background: #dbeafe; color: #1e40af; }
.category-notice { background: #fef3c7; color: #92400e; }
.category-activity { background: #d1fae5; color: #065f46; }
.category-achievement { background: #fce7f3; color: #9f1239; }

.status-published { background: #d1fae5; color: #065f46; }
.status-draft { background: #f3f4f6; color: #4b5563; }
.status-archived { background: #fee2e2; color: #991b1b; }

.action-cell {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit {
  background: #dbeafe;
  color: #1e40af;
}

.btn-edit:hover {
  background: #bfdbfe;
}

.btn-delete {
  background: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover {
  background: #fecaca;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.btn-page {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-page:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #667eea;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #6b7280;
}

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
  max-width: 700px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #1f2937;
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
}

.btn-close:hover {
  background: #e5e7eb;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.required {
  color: #ef4444;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.upload-area {
  margin-top: 8px;
}

.btn-upload {
  width: 100%;
  padding: 40px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #6b7280;
}

.btn-upload:hover {
  border-color: #667eea;
  background: #f3f4f6;
}

.btn-upload .icon {
  font-size: 32px;
  color: #9ca3af;
}

.file-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 32px;
}

.file-name {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.btn-remove {
  padding: 6px 12px;
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.btn-remove:hover {
  background: #fecaca;
}

.image-preview-container {
  position: relative;
  display: inline-block;
  width: 100%;
}

.cover-image-preview {
  width: 100%;
  max-width: 300px;
  height: 300px;
  object-fit: cover;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  display: block;
  margin: 0 auto;
}

.btn-remove-image {
  position: absolute;
  top: 8px;
  right: calc(50% - 150px + 8px);
  padding: 6px 12px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.btn-remove-image:hover {
  background: rgba(220, 38, 38, 0.95);
  transform: scale(1.05);
}

.hint-text {
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
  margin-bottom: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-submit {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-submit {
  background: #667eea;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #5568d3;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
