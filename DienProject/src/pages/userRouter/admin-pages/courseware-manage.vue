<template>
  <div class="courseware-manage">
    <div class="page-header">
      <h1 class="page-title">课件管理</h1>
      <button class="btn-primary" @click="openCreateDialog">
        <span class="icon">+</span>
        上传课件
      </button>
    </div>

    <div class="filter-toolbar">
      <div class="filter-group">
        <input v-model="filters.keyword" type="text" placeholder="搜索课件名称或描述..." class="search-input"
          @keyup.enter="handleSearch" />

        <select v-model="filters.type" class="filter-select">
          <option value="">全部类型</option>
          <option value="video">视频</option>
          <option value="document">文档</option>
          <option value="ppt">演示文稿</option>
          <option value="code">代码</option>
          <option value="other">其他</option>
        </select>

        <select v-model="filters.subject" class="filter-select">
          <option value="">全部学科</option>
          <option value="computer">计算机</option>
          <option value="math">数学</option>
          <option value="physics">物理</option>
          <option value="chemistry">化学</option>
          <option value="biology">生物</option>
          <option value="other">其他</option>
        </select>

        <select v-model="filters.level" class="filter-select">
          <option value="">全部难度</option>
          <option value="beginner">初级</option>
          <option value="intermediate">中级</option>
          <option value="advanced">高级</option>
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
        <button class="btn-retry" @click="fetchCoursewareList">重试</button>
      </div>

      <div v-else>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>课件名称</th>
              <th>类型</th>
              <th>学科</th>
              <th>难度</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in coursewareList" :key="item._id">
              <td>{{ item._id }}</td>
              <td class="title-cell">{{ item.name }}</td>
              <td>
                <span :class="['type-tag', `type-${item.type}`]">
                  {{ getTypeText(item.type) }}
                </span>
              </td>
              <td>
                <span :class="['subject-tag', `subject-${item.subject}`]">
                  {{ getSubjectText(item.subject) }}
                </span>
              </td>
              <td>
                <span :class="['level-tag', `level-${item.level}`]">
                  {{ getLevelText(item.level) }}
                </span>
              </td>
              <td>
                <span :class="['status-tag', `status-${item.status}`]">
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td class="action-cell">
                <button class="btn-edit" @click="openEditDialog(item)">编辑</button>
                <button class="btn-delete" @click="handleDelete(item._id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="coursewareList.length === 0" class="empty-state">
          <p>暂无数据</p>
        </div>
      </div>
    </div>

    <div v-if="!loading && coursewareList.length > 0" class="pagination">
      <button class="btn-page" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        上一页
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button class="btn-page" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
        下一页
      </button>
    </div>

    <!-- 创建/编辑弹窗 -->
    <div v-if="showDialog" class="modal-overlay" @click.self="closeDialog">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? '编辑课件' : '上传课件' }}</h2>
          <button class="btn-close" @click="closeDialog">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>课件名称 <span class="required">*</span></label>
            <input v-model="formData.name" type="text" placeholder="请输入课件名称" class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>课件类型 <span class="required">*</span></label>
              <select v-model="formData.type" class="form-select">
                <option value="">请选择类型</option>
                <option value="video">视频</option>
                <option value="document">文档</option>
                <option value="ppt">演示文稿</option>
                <option value="code">代码</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div class="form-group">
              <label>学科分类 <span class="required">*</span></label>
              <select v-model="formData.subject" class="form-select">
                <option value="">请选择学科</option>
                <option value="computer">计算机</option>
                <option value="math">数学</option>
                <option value="physics">物理</option>
                <option value="chemistry">化学</option>
                <option value="biology">生物</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>难度等级 <span class="required">*</span></label>
            <select v-model="formData.level" class="form-select">
              <option value="">请选择难度</option>
              <option value="beginner">初级</option>
              <option value="intermediate">中级</option>
              <option value="advanced">高级</option>
            </select>
          </div>

          <div class="form-group">
            <label>课件描述 <span class="required">*</span></label>
            <textarea v-model="formData.description" placeholder="请输入课件描述" class="form-textarea" rows="4"></textarea>
          </div>

          <div class="form-group">
            <label>课件文档</label>
            <div class="upload-area">
              <input ref="documentInput" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.avi,.zip"
                @change="handleDocumentUpload" style="display: none" />
              <div v-if="documentFileName" class="file-preview">
                <div class="file-info">
                  <span class="file-icon">📄</span>
                  <span class="file-name">{{ documentFileName }}</span>
                </div>
                <button class="btn-remove" @click="removeDocument">删除</button>
              </div>
              <button v-else class="btn-upload" @click="documentInput?.click()">
                <span class="icon">+</span>
                上传文档 (PDF, Word, Excel, PPT, 视频等)
              </button>
            </div>
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
          <button class="btn-submit" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import * as coursewareApi from '@/api/coursewareApi';

interface CoursewareItem {
  _id: string;
  name: string;
  type: string;
  subject: string;
  level: string;
  description: string;
  status: string;
  uploader?: any;
  createdAt: string;
  updatedAt: string;
  documentFile?: string;
  documentFileName?: string;
  documentFileType?: string;
  [key: string]: any;
}

const loading = ref(false);
const error = ref('');
const coursewareList = ref<CoursewareItem[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const pageSize = 10;

const filters = reactive({
  keyword: '',
  type: '',
  subject: '',
  level: '',
  status: ''
});

const showDialog = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const editingId = ref<string | null>(null);

const formData = reactive({
  name: '',
  type: '',
  subject: '',
  level: '',
  description: '',
  status: 'draft',
  documentFile: null as File | null,
  existingDocumentFile: '',
  removeDocument: false
});

const documentFileName = ref('');
const documentInput = ref<HTMLInputElement | null>(null);

// 获取课件列表
const fetchCoursewareList = async () => {
  loading.value = true;
  error.value = '';
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize,
      keyword: filters.keyword || undefined,
      type: filters.type || undefined,
      subject: filters.subject || undefined,
      level: filters.level || undefined,
      status: filters.status || undefined
    };
    const response = await coursewareApi.getCoursewareList(params);
    coursewareList.value = response.data || [];
    totalPages.value = Math.ceil((response.pagination?.totalItems || 0) / pageSize);
  } catch (err: any) {
    error.value = err.message || '获取课件列表失败';
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchCoursewareList();
};

// 重置
const handleReset = () => {
  filters.keyword = '';
  filters.type = '';
  filters.subject = '';
  filters.level = '';
  filters.status = '';
  currentPage.value = 1;
  fetchCoursewareList();
};

// 切换页码
const changePage = (page: number) => {
  currentPage.value = page;
  fetchCoursewareList();
};

// 打开创建对话框
const openCreateDialog = () => {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  showDialog.value = true;
};

// 打开编辑对话框
const openEditDialog = (item: CoursewareItem) => {
  isEditing.value = true;
  editingId.value = item._id;
  formData.name = item.name;
  formData.type = item.type;
  formData.subject = item.subject;
  formData.level = item.level;
  formData.description = item.description;
  formData.status = item.status;
  formData.existingDocumentFile = item.documentFile || '';
  formData.removeDocument = false;
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
  formData.name = '';
  formData.type = '';
  formData.subject = '';
  formData.level = '';
  formData.description = '';
  formData.status = 'draft';
  formData.documentFile = null;
  formData.existingDocumentFile = '';
  formData.removeDocument = false;
  documentFileName.value = '';
};

// 处理文档上传
const handleDocumentUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    formData.documentFile = file;
    formData.removeDocument = false;
    documentFileName.value = file.name;
  }
};

// 删除文档
const removeDocument = () => {
  formData.documentFile = null;
  formData.existingDocumentFile = '';
  formData.removeDocument = true;
  documentFileName.value = '';
  if (documentInput.value) {
    documentInput.value.value = '';
  }
};

// 验证文件类型是否匹配课件类型
const validateFileType = (coursewareType: string, file: File): boolean => {
  const fileName = file.name.toLowerCase();

  const typeExtensions: Record<string, string[]> = {
    video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
    document: ['.pdf', '.doc', '.docx'],
    ppt: ['.ppt', '.pptx'],
    code: ['.zip', '.rar', '.7z'],
    other: [] // other类型允许任何文件
  };

  const allowedExtensions = typeExtensions[coursewareType];

  // 如果是 other 类型,允许任何文件
  if (coursewareType === 'other') {
    return true;
  }
  // 确保 allowedExtensions 存在后再使用
  if (!allowedExtensions) {
    return false; // 或者抛出错误，取决于业务需求
  }

  // 检查文件扩展名是否在允许列表中
  return allowedExtensions.some(ext => fileName.endsWith(ext));
};

// 提交表单
const handleSubmit = async () => {
  // 防止重复提交
  if (submitting.value) {
    return;
  }

  if (!formData.name || !formData.type || !formData.subject || !formData.level || !formData.description) {
    alert('请填写必填项');
    return;
  }

  // 如果上传了新文档,验证文件类型是否匹配
  if (formData.documentFile) {
    if (!validateFileType(formData.type, formData.documentFile)) {
      alert('上传的文件类型与选择的课件类型不匹配!\n\n' +
        '请确保:\n' +
        '• 视频课件: 上传 .mp4, .avi, .mov 等视频文件\n' +
        '• 文档课件: 上传 .pdf, .doc, .docx 等文档文件\n' +
        '• 演示文稿课件: 上传 .ppt, .pptx 等演示文稿文件\n' +
        '• 代码课件: 上传 .zip, .rar 等压缩文件');
      return;
    }
  }

  submitting.value = true;

  try {
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('type', formData.type);
    formDataToSend.append('subject', formData.subject);
    formDataToSend.append('level', formData.level);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('status', formData.status);

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
      await coursewareApi.updateCourseware(editingId.value, formDataToSend);
    } else {
      await coursewareApi.createCourseware(formDataToSend);
    }

    alert('操作成功！');
    closeDialog();
    await fetchCoursewareList();
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || err.message || '操作失败';
    alert(errorMsg);
  } finally {
    submitting.value = false;
  }
};

// 删除
const handleDelete = async (id: string) => {
  if (!confirm('确定要删除这个课件吗?')) {
    return;
  }

  try {
    await coursewareApi.deleteCourseware(id);
    alert('删除成功！');
    await fetchCoursewareList();
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || err.message || '删除失败';
    alert(errorMsg);
  }
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

onMounted(() => {
  fetchCoursewareList();
});
</script>

<style scoped>
.courseware-manage {
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
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
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
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
  border-color: #10b981;
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
  background: #10b981;
  color: white;
}

.btn-search:hover {
  background: #059669;
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
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #ef4444;
  margin-bottom: 16px;
}

.btn-retry {
  padding: 10px 24px;
  background: #10b981;
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
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-tag,
.subject-tag,
.level-tag,
.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-video {
  background: #fce7f3;
  color: #9f1239;
}

.type-document {
  background: #d1fae5;
  color: #065f46;
}

.type-ppt {
  background: #dbeafe;
  color: #1e40af;
}

.type-code {
  background: #ede9fe;
  color: #6b21a8;
}

.type-other {
  background: #f3f4f6;
  color: #4b5563;
}

.subject-computer {
  background: #ede9fe;
  color: #6b21a8;
}

.subject-math {
  background: #dbeafe;
  color: #1e40af;
}

.subject-physics {
  background: #e0e7ff;
  color: #4338ca;
}

.subject-chemistry {
  background: #d1fae5;
  color: #065f46;
}

.subject-biology {
  background: #dcfce7;
  color: #166534;
}

.subject-other {
  background: #f3f4f6;
  color: #4b5563;
}

.level-beginner {
  background: #d1fae5;
  color: #065f46;
}

.level-intermediate {
  background: #fef3c7;
  color: #92400e;
}

.level-advanced {
  background: #fee2e2;
  color: #991b1b;
}

.status-published {
  background: #d1fae5;
  color: #065f46;
}

.status-draft {
  background: #f3f4f6;
  color: #4b5563;
}

.status-archived {
  background: #fee2e2;
  color: #991b1b;
}

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
  border-color: #10b981;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
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
  border-color: #10b981;
  background: #f3f4f6;
}

.btn-upload .icon {
  font-size: 32px;
  color: #9ca3af;
}

.upload-hint {
  font-size: 12px;
  color: #9ca3af;
}

.file-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  font-weight: 500;
  color: #374151;
}

.file-size {
  font-size: 12px;
  color: #6b7280;
}

.btn-remove {
  padding: 6px 12px;
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
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
  background: #10b981;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #059669;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
