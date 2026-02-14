<template>
  <div class="scholarship-manage">
    <div class="page-header">
      <h1 class="page-title">奖学金管理</h1>
      <button class="btn-primary" @click="openCreateDialog">
        <span class="icon">+</span>
        创建奖学金
      </button>
    </div>

    <div class="filter-toolbar">
      <div class="filter-group">
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="搜索奖学金标题..."
          class="search-input"
          @keyup.enter="handleSearch"
        />

        <select v-model="filters.type" class="filter-select">
          <option value="">全部类型</option>
          <option value="merit">学业优秀奖学金</option>
          <option value="need">助学金</option>
          <option value="special">专项奖学金</option>
          <option value="research">科研奖学金</option>
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
        <button class="btn-retry" @click="fetchScholarshipList">重试</button>
      </div>

      <div v-else>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>类型</th>
              <th>金额</th>
              <th>发布日期</th>
              <th>申请截止日期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in scholarshipList" :key="item._id">
              <td>{{ item._id }}</td>
              <td class="title-cell">{{ item.title }}</td>
              <td>
                <span :class="['type-tag', `type-${item.type}`]">
                  {{ getTypeText(item.type) }}
                </span>
              </td>
              <td class="amount-cell">¥{{ formatAmount(item.amount) }}</td>
              <td>{{ formatDate(item.publishDate) }}</td>
              <td>{{ formatDate(item.applicationDeadline) }}</td>
              <td>
                <span :class="['status-tag', `status-${item.status}`]">
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td class="action-cell">
                <button class="btn-edit" @click="openEditDialog(item)">编辑</button>
                <button class="btn-delete" @click="handleDelete(item._id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="scholarshipList.length === 0" class="empty-state">
          <p>暂无数据</p>
        </div>
      </div>
    </div>

    <div v-if="!loading && scholarshipList.length > 0" class="pagination">
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
          <h2>{{ isEditing ? '编辑奖学金' : '创建奖学金' }}</h2>
          <button class="btn-close" @click="closeDialog">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>标题 <span class="required">*</span></label>
            <input
              v-model="formData.title"
              type="text"
              placeholder="请输入奖学金标题"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>类型 <span class="required">*</span></label>
            <select v-model="formData.type" class="form-select">
              <option value="">请选择类型</option>
              <option value="merit">学业优秀奖学金</option>
              <option value="need">助学金</option>
              <option value="special">专项奖学金</option>
              <option value="research">科研奖学金</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>奖学金金额 (元) <span class="required">*</span></label>
              <input
                v-model.number="formData.amount"
                type="number"
                min="0"
                step="100"
                placeholder="请输入金额"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>名额限制</label>
              <input
                v-model.number="formData.quota"
                type="number"
                min="1"
                placeholder="不填表示不限"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>描述 <span class="required">*</span></label>
            <textarea
              v-model="formData.description"
              placeholder="请输入奖学金描述"
              class="form-textarea"
              rows="5"
            ></textarea>
          </div>

          <div class="form-group">
            <label>申请要求</label>
            <textarea
              v-model="formData.requirements"
              placeholder="请输入申请要求"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>

          <div class="form-group">
            <label>发布日期 <span class="required">*</span></label>
            <input
              v-model="formData.publishDate"
              type="date"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>申请截止日期 <span class="required">*</span></label>
            <input
              v-model="formData.applicationDeadline"
              type="date"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>公布日期 <span class="required">*</span></label>
            <input
              v-model="formData.announcementDate"
              type="date"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>文档附件</label>
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
import * as scholarshipApi from '@/api/scholarshipApi';

interface ScholarshipItem {
  _id: string;
  id?: string;
  title: string;
  type: string;
  amount: number;
  quota?: number;
  status: string;
  applicationDeadline: string;
  publishDate: string;
  announcementDate: string;
  description: string;
  requirements?: string;
  createdBy?: string;
  author?: any;
  createdAt?: string;
  documentFile?: string;
  documentFileName?: string;
  documentFileType?: string;
  [key: string]: any;
}

const loading = ref(false);
const error = ref('');
const scholarshipList = ref<ScholarshipItem[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const pageSize = 10;

const filters = reactive({
  keyword: '',
  type: '',
  status: ''
});

const showDialog = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const editingId = ref<string | null>(null);

const formData = reactive({
  title: '',
  type: '',
  amount: 0,
  quota: null as number | null,
  description: '',
  requirements: '',
  publishDate: '',
  applicationDeadline: '',
  announcementDate: '',
  status: 'draft',
  documentFile: null as File | null,
  existingDocumentFile: '',
  removeDocument: false  // 标记是否要删除文档
});

const documentFileName = ref('');
const documentInput = ref<HTMLInputElement | null>(null);

// 获取奖学金列表
const fetchScholarshipList = async () => {
  loading.value = true;
  error.value = '';
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize,
      keyword: filters.keyword || undefined,
      type: filters.type || undefined,
      status: filters.status || undefined,
      isPublic: 'false'as any,  // 管理后台参数
    };
    const response = await scholarshipApi.getScholarshipList(params);
    scholarshipList.value = response.data || [];
    totalPages.value = Math.ceil((response.pagination?.totalItems || 0) / pageSize);
  } catch (err: any) {
    error.value = err.message || '获取奖学金列表失败';
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchScholarshipList();
};

// 重置
const handleReset = () => {
  filters.keyword = '';
  filters.type = '';
  filters.status = '';
  currentPage.value = 1;
  fetchScholarshipList();
};

// 切换页码
const changePage = (page: number) => {
  currentPage.value = page;
  fetchScholarshipList();
};

// 打开创建对话框
const openCreateDialog = () => {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  showDialog.value = true;
};

// 打开编辑对话框
const openEditDialog = (item: ScholarshipItem) => {
  isEditing.value = true;
  editingId.value = item._id;
  formData.title = item.title;
  formData.type = item.type;
  formData.amount = item.amount;
  formData.quota = item.quota || null;
  formData.description = item.description || '';
  formData.requirements = item.requirements || '';
  formData.publishDate = item.publishDate ? new Date(item.publishDate).toISOString().slice(0, 10) : '';
  formData.applicationDeadline = item.applicationDeadline ? new Date(item.applicationDeadline).toISOString().slice(0, 10) : '';
  formData.announcementDate = item.announcementDate ? new Date(item.announcementDate).toISOString().slice(0, 10) : '';
  formData.status = item.status;
  formData.existingDocumentFile = item.documentFile || '';
  formData.removeDocument = false;  // 重置删除标记
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
  formData.type = '';
  formData.amount = 0;
  formData.quota = null;
  formData.description = '';
  formData.requirements = '';
  formData.publishDate = '';
  formData.applicationDeadline = '';
  formData.announcementDate = '';
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

  if (!formData.title || !formData.type || !formData.amount || !formData.description ||
      !formData.publishDate || !formData.applicationDeadline || !formData.announcementDate) {
    alert('请填写必填项');
    return;
  }

  submitting.value = true;

  try {
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('type', formData.type);
    formDataToSend.append('amount', formData.amount.toString());
    if (formData.quota) {
      formDataToSend.append('quota', formData.quota.toString());
    }
    formDataToSend.append('description', formData.description);
    formDataToSend.append('requirements', formData.requirements);
    formDataToSend.append('publishDate', formData.publishDate);
    formDataToSend.append('applicationDeadline', formData.applicationDeadline);
    formDataToSend.append('announcementDate', formData.announcementDate);
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
      await scholarshipApi.updateScholarship(editingId.value, formDataToSend);
    } else {
      await scholarshipApi.createScholarship(formDataToSend);
    }

    alert('操作成功！');
    closeDialog();
    await fetchScholarshipList();
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || err.message || '操作失败';
    alert(errorMsg);
  } finally {
    submitting.value = false;
  }
};

// 删除
const handleDelete = async (id: string) => {
  if (!confirm('确定要删除这个奖学金吗?')) {
    return;
  }

  try {
    await scholarshipApi.deleteScholarship(id);
    alert('删除成功！');
    await fetchScholarshipList();
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || err.message || '删除失败';
    alert(errorMsg);
  }
};

// 工具函数
const getTypeText = (type: string) => {
  const map: Record<string, string> = {
    merit: '学业优秀',
    need: '助学金',
    special: '专项奖学金',
    research: '科研奖学金'
  };
  return map[type] || type;
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    published: '已发布',
    draft: '草稿',
    archived: '已归档'
  };
  return map[status] || status;
};

const formatAmount = (amount: number) => {
  return amount.toLocaleString('zh-CN');
};

const formatDate = (date: string) => {
  if (!date) return '';
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

onMounted(() => {
  fetchScholarshipList();
});
</script>

<style scoped>
.scholarship-manage {
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

.amount-cell {
  font-weight: 600;
  color: #f59e0b;
}

.type-tag,
.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-merit { background: #dbeafe; color: #1e40af; }
.type-need { background: #d1fae5; color: #065f46; }
.type-special { background: #fce7f3; color: #9f1239; }
.type-research { background: #e0e7ff; color: #4338ca; }

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
