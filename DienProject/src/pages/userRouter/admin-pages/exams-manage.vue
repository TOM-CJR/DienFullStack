<template>
  <div class="exams-manage">
    <div class="page-header">
      <h1 class="page-title">考试管理</h1>
      <button class="btn-primary" @click="openCreateDialog">
        <span class="icon">+</span>
        创建考试
      </button>
    </div>

    <div class="filter-toolbar">
      <div class="filter-group">
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="搜索考试名称..."
          class="search-input"
          @keyup.enter="handleSearch"
        />

        <select v-model="filters.type" class="filter-select">
          <option value="">全部类型</option>
          <option value="quiz">随堂测验</option>
          <option value="midterm">期中考试</option>
          <option value="final">期末考试</option>
          <option value="practice">模拟考试</option>
        </select>

        <select v-model="filters.level" class="filter-select">
          <option value="">全部等级</option>
          <option value="beginner">初级</option>
          <option value="intermediate">中级</option>
          <option value="advanced">高级</option>
        </select>

        <select v-model="filters.status" class="filter-select">
          <option value="">全部状态</option>
          <option value="upcoming">未开始</option>
          <option value="ongoing">进行中</option>
          <option value="finished">已结束</option>
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
        <button class="btn-retry" @click="fetchExamList">重试</button>
      </div>

      <div v-else>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>考试名称</th>
              <th>类型</th>
              <th>等级</th>
              <th>时长</th>
              <th>总分/及格分</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in examList" :key="item.id">
              <td>{{ item.id }}</td>
              <td class="title-cell">{{ item.title }}</td>
              <td>
                <span :class="['type-tag', `type-${item.type}`]">
                  {{ getTypeText(item.type) }}
                </span>
              </td>
              <td>
                <span :class="['level-tag', `level-${item.level}`]">
                  {{ getLevelText(item.level) }}
                </span>
              </td>
              <td>{{ item.duration }} 分钟</td>
              <td class="score-cell">{{ item.totalScore }} / {{ item.passingScore }}</td>
              <td>
                <span :class="['status-tag', `status-${item.status}`]">
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td class="action-cell">
                <button class="btn-edit" @click="openEditDialog(item)">编辑</button>
                <button class="btn-delete" @click="handleDelete(item.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="examList.length === 0" class="empty-state">
          <p>暂无数据</p>
        </div>
      </div>
    </div>

    <div v-if="!loading && examList.length > 0" class="pagination">
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
          <h2>{{ isEditing ? '编辑考试' : '创建考试' }}</h2>
          <button class="btn-close" @click="closeDialog">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>考试名称 <span class="required">*</span></label>
            <input
              v-model="formData.title"
              type="text"
              placeholder="请输入考试名称"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>考试类型 <span class="required">*</span></label>
              <select v-model="formData.type" class="form-select">
                <option value="">请选择类型</option>
                <option value="quiz">随堂测验</option>
                <option value="midterm">期中考试</option>
                <option value="final">期末考试</option>
                <option value="practice">模拟考试</option>
              </select>
            </div>

            <div class="form-group">
              <label>难度等级 <span class="required">*</span></label>
              <select v-model="formData.level" class="form-select">
                <option value="">请选择等级</option>
                <option value="beginner">初级</option>
                <option value="intermediate">中级</option>
                <option value="advanced">高级</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>考试描述</label>
            <textarea
              v-model="formData.description"
              placeholder="请输入考试描述"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>考试时长 (分钟) <span class="required">*</span></label>
              <input
                v-model.number="formData.duration"
                type="number"
                min="1"
                placeholder="请输入时长"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>总分 <span class="required">*</span></label>
              <input
                v-model.number="formData.totalScore"
                type="number"
                min="1"
                placeholder="请输入总分"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>及格分数 <span class="required">*</span></label>
            <input
              v-model.number="formData.passingScore"
              type="number"
              min="0"
              placeholder="请输入及格分数"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>开始时间 <span class="required">*</span></label>
              <input
                v-model="formData.startTime"
                type="datetime-local"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>结束时间 <span class="required">*</span></label>
              <input
                v-model="formData.endTime"
                type="datetime-local"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>题目选择 <span class="required">*</span></label>
            <div class="questions-section">
              <div class="selected-questions">
                <div v-if="selectedQuestions.length === 0" class="no-questions">
                  暂未选择题目
                </div>
                <div
                  v-for="(question, index) in selectedQuestions"
                  :key="index"
                  class="question-item"
                >
                  <span class="question-number">{{ index + 1 }}.</span>
                  <span class="question-text">{{ question.title || question.content }}</span>
                  <span class="question-type">{{ getQuestionTypeText(question.type) }}</span>
                  <button class="btn-remove-question" @click="removeQuestion(index)">
                    删除
                  </button>
                </div>
              </div>
              <button class="btn-add-question" @click="showQuestionSelector = true">
                + 添加题目
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>考试状态</label>
            <select v-model="formData.status" class="form-select">
              <option value="upcoming">未开始</option>
              <option value="ongoing">进行中</option>
              <option value="finished">已结束</option>
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

    <!-- 题目选择器弹窗 -->
    <div v-if="showQuestionSelector" class="modal-overlay" @click.self="showQuestionSelector = false">
      <div class="modal-content modal-selector">
        <div class="modal-header">
          <h2>选择题目</h2>
          <button class="btn-close" @click="showQuestionSelector = false">&times;</button>
        </div>

        <div class="modal-body">
          <div class="selector-search">
            <input
              v-model="questionSearch"
              type="text"
              placeholder="搜索题目..."
              class="form-input"
            />
          </div>

          <div class="question-list">
            <div
              v-for="question in availableQuestions"
              :key="question.id"
              class="question-selector-item"
            >
              <label class="question-checkbox">
                <input
                  type="checkbox"
                  :value="question"
                  v-model="tempSelectedQuestions"
                />
                <div class="question-info">
                  <span class="question-title">{{ question.title || question.content }}</span>
                  <div class="question-meta">
                    <span class="meta-tag">{{ getQuestionTypeText(question.type) }}</span>
                    <span class="meta-tag">{{ question.difficulty }}</span>
                    <span class="meta-tag">{{ question.score }}分</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showQuestionSelector = false">取消</button>
          <button class="btn-submit" @click="confirmQuestionSelection">
            确认选择 ({{ tempSelectedQuestions.length }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import * as examApi from '@/api/examApi';
import * as questionApi from '@/api/questionApi';

interface ExamItem {
  id: number;
  title: string;
  type: string;
  level: string;
  duration: number;
  totalScore: number;
  passingScore: number;
  status: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  questions?: any[];
  [key: string]: any;
}

interface QuestionItem {
  id: number;
  title: string;
  content: string;
  type: string;
  difficulty: string;
  score: number;
  [key: string]: any;
}

const loading = ref(false);
const error = ref('');
const examList = ref<ExamItem[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const pageSize = 10;

const filters = reactive({
  keyword: '',
  type: '',
  level: '',
  status: ''
});

const showDialog = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const editingId = ref<number | null>(null);

const formData = reactive({
  title: '',
  type: '',
  level: '',
  description: '',
  duration: 60,
  totalScore: 100,
  passingScore: 60,
  startTime: '',
  endTime: '',
  status: 'upcoming'
});

const selectedQuestions = ref<QuestionItem[]>([]);
const showQuestionSelector = ref(false);
const questionSearch = ref('');
const availableQuestions = ref<QuestionItem[]>([]);
const tempSelectedQuestions = ref<QuestionItem[]>([]);

// 获取考试列表
const fetchExamList = async () => {
  loading.value = true;
  error.value = '';
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize,
      keyword: filters.keyword || undefined,
      type: filters.type || undefined,
      level: filters.level || undefined,
      status: filters.status || undefined
    };
    const response = await examApi.getExamList(params);
    examList.value = response.data || [];
    totalPages.value = Math.ceil((response.total || 0) / pageSize);
  } catch (err: any) {
    error.value = err.message || '获取考试列表失败';
  } finally {
    loading.value = false;
  }
};

// 获取可用题目列表
const fetchAvailableQuestions = async () => {
  try {
    const response = await questionApi.getQuestionList({ limit: 100 });
    availableQuestions.value = response.data || [];
  } catch (err: any) {
    console.error('获取题目列表失败', err);
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchExamList();
};

// 重置
const handleReset = () => {
  filters.keyword = '';
  filters.type = '';
  filters.level = '';
  filters.status = '';
  currentPage.value = 1;
  fetchExamList();
};

// 切换页码
const changePage = (page: number) => {
  currentPage.value = page;
  fetchExamList();
};

// 打开创建对话框
const openCreateDialog = () => {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  showDialog.value = true;
  fetchAvailableQuestions();
};

// 打开编辑对话框
const openEditDialog = (item: ExamItem) => {
  isEditing.value = true;
  editingId.value = item.id;
  formData.title = item.title;
  formData.type = item.type;
  formData.level = item.level;
  formData.description = item.description || '';
  formData.duration = item.duration;
  formData.totalScore = item.totalScore;
  formData.passingScore = item.passingScore;
  formData.startTime = item.startTime ? new Date(item.startTime).toISOString().slice(0, 16) : '';
  formData.endTime = item.endTime ? new Date(item.endTime).toISOString().slice(0, 16) : '';
  formData.status = item.status;
  selectedQuestions.value = item.questions || [];
  showDialog.value = true;
  fetchAvailableQuestions();
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
  formData.level = '';
  formData.description = '';
  formData.duration = 60;
  formData.totalScore = 100;
  formData.passingScore = 60;
  formData.startTime = '';
  formData.endTime = '';
  formData.status = 'upcoming';
  selectedQuestions.value = [];
};

// 删除题目
const removeQuestion = (index: number) => {
  selectedQuestions.value.splice(index, 1);
};

// 确认题目选择
const confirmQuestionSelection = () => {
  selectedQuestions.value = [...tempSelectedQuestions.value];
  showQuestionSelector.value = false;
  tempSelectedQuestions.value = [];
};

// 提交表单
const handleSubmit = async () => {
  if (!formData.title || !formData.type || !formData.level || !formData.duration ||
      !formData.totalScore || formData.passingScore === undefined ||
      !formData.startTime || !formData.endTime) {
    alert('请填写必填项');
    return;
  }

  if (selectedQuestions.value.length === 0) {
    alert('请至少选择一道题目');
    return;
  }

  submitting.value = true;
  try {
    const dataToSubmit = {
      title: formData.title,
      type: formData.type,
      level: formData.level,
      description: formData.description,
      duration: formData.duration,
      totalScore: formData.totalScore,
      passingScore: formData.passingScore,
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: formData.status,
      questions: selectedQuestions.value.map(q => q.id)
    };

    if (isEditing.value && editingId.value) {
      await examApi.updateExam(editingId.value, dataToSubmit);
    } else {
      await examApi.createExam(dataToSubmit);
    }

    closeDialog();
    fetchExamList();
  } catch (err: any) {
    alert(err.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

// 删除
const handleDelete = async (id: number) => {
  if (!confirm('确定要删除这个考试吗?')) {
    return;
  }

  try {
    await examApi.deleteExam(id);
    fetchExamList();
  } catch (err: any) {
    alert(err.message || '删除失败');
  }
};

// 工具函数
const getTypeText = (type: string) => {
  const map: Record<string, string> = {
    quiz: '随堂测验',
    midterm: '期中考试',
    final: '期末考试',
    practice: '模拟考试'
  };
  return map[type] || type;
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
    upcoming: '未开始',
    ongoing: '进行中',
    finished: '已结束'
  };
  return map[status] || status;
};

const getQuestionTypeText = (type: string) => {
  const map: Record<string, string> = {
    single: '单选',
    multiple: '多选',
    judge: '判断',
    fill: '填空',
    essay: '问答'
  };
  return map[type] || type;
};

onMounted(() => {
  fetchExamList();
});
</script>

<style scoped>
.exams-manage {
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
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
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
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
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
  border-color: #ef4444;
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
  background: #ef4444;
  color: white;
}

.btn-search:hover {
  background: #dc2626;
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
  border-top-color: #ef4444;
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
  background: #ef4444;
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

.score-cell {
  font-weight: 600;
  color: #ef4444;
}

.type-tag,
.level-tag,
.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-quiz { background: #dbeafe; color: #1e40af; }
.type-midterm { background: #fef3c7; color: #92400e; }
.type-final { background: #fee2e2; color: #991b1b; }
.type-practice { background: #d1fae5; color: #065f46; }

.level-beginner { background: #d1fae5; color: #065f46; }
.level-intermediate { background: #fef3c7; color: #92400e; }
.level-advanced { background: #fee2e2; color: #991b1b; }

.status-upcoming { background: #e0e7ff; color: #4338ca; }
.status-ongoing { background: #d1fae5; color: #065f46; }
.status-finished { background: #f3f4f6; color: #4b5563; }

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
  border-color: #ef4444;
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
  max-width: 800px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-selector {
  max-width: 600px;
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
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.questions-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f9fafb;
}

.selected-questions {
  margin-bottom: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.no-questions {
  text-align: center;
  color: #9ca3af;
  padding: 20px;
  font-size: 14px;
}

.question-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 8px;
}

.question-number {
  font-weight: 600;
  color: #6b7280;
  min-width: 28px;
}

.question-text {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.question-type {
  font-size: 12px;
  padding: 2px 8px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 4px;
}

.btn-remove-question {
  padding: 4px 10px;
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-add-question {
  width: 100%;
  padding: 12px;
  background: white;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add-question:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.selector-search {
  margin-bottom: 16px;
}

.question-list {
  max-height: 400px;
  overflow-y: auto;
}

.question-selector-item {
  margin-bottom: 12px;
}

.question-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.question-checkbox:hover {
  background: #f3f4f6;
  border-color: #ef4444;
}

.question-checkbox input[type="checkbox"] {
  margin-top: 4px;
}

.question-info {
  flex: 1;
}

.question-title {
  display: block;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 8px;
}

.question-meta {
  display: flex;
  gap: 8px;
}

.meta-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: #e5e7eb;
  color: #4b5563;
  border-radius: 4px;
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
  background: #ef4444;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #dc2626;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
