<template>
  <div class="questions-manage">
    <div class="page-header">
      <h1 class="page-title">题库管理</h1>
      <button class="btn-primary" @click="openCreateDialog">
        <span class="icon">+</span>
        创建题目
      </button>
    </div>

    <div class="filter-toolbar">
      <div class="filter-group">
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="搜索题目内容..."
          class="search-input"
          @keyup.enter="handleSearch"
        />

        <select v-model="filters.type" class="filter-select">
          <option value="">全部类型</option>
          <option value="single">单选题</option>
          <option value="multiple">多选题</option>
          <option value="judge">判断题</option>
          <option value="fill">填空题</option>
          <option value="essay">问答题</option>
        </select>

        <select v-model="filters.difficulty" class="filter-select">
          <option value="">全部难度</option>
          <option value="easy">简单</option>
          <option value="medium">中等</option>
          <option value="hard">困难</option>
        </select>

        <select v-model="filters.category" class="filter-select">
          <option value="">全部分类</option>
          <option value="block">积木语言</option>
          <option value="cpp">C++</option>
          <option value="python">Python</option>
          <option value="scratch">Scratch</option>
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="csharp">C#</option>
          <option value="other">其他</option>
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
        <button class="btn-retry" @click="fetchQuestionList">重试</button>
      </div>

      <div v-else>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>题目内容</th>
              <th>类型</th>
              <th>难度</th>
              <th>分类</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in questionList" :key="item.id">
              <td>{{ item.id }}</td>
              <td class="content-cell">{{ item.content || item.title }}</td>
              <td>
                <span :class="['type-tag', `type-${item.type}`]">
                  {{ getTypeText(item.type) }}
                </span>
              </td>
              <td>
                <span :class="['difficulty-tag', `difficulty-${item.difficulty}`]">
                  {{ getDifficultyText(item.difficulty) }}
                </span>
              </td>
              <td>
                <span :class="['category-tag', `category-${item.category}`]">
                  {{ getCategoryText(item.category) }}
                </span>
              </td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td class="action-cell">
                <button class="btn-edit" @click="openEditDialog(item)">编辑</button>
                <button class="btn-delete" @click="handleDelete(item.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="questionList.length === 0" class="empty-state">
          <p>暂无数据</p>
        </div>
      </div>
    </div>

    <div v-if="!loading && questionList.length > 0" class="pagination">
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
          <h2>{{ isEditing ? '编辑题目' : '创建题目' }}</h2>
          <button class="btn-close" @click="closeDialog">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>题目标题 <span class="required">*</span></label>
            <input
              v-model="formData.title"
              type="text"
              placeholder="请输入题目标题"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>题目类型 <span class="required">*</span></label>
              <select v-model="formData.type" class="form-select" @change="handleTypeChange">
                <option value="">请选择类型</option>
                <option value="single">单选题</option>
                <option value="multiple">多选题</option>
                <option value="judge">判断题</option>
                <option value="fill">填空题</option>
                <option value="essay">问答题</option>
              </select>
            </div>

            <div class="form-group">
              <label>难度等级 <span class="required">*</span></label>
              <select v-model="formData.difficulty" class="form-select">
                <option value="">请选择难度</option>
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>题目分类 <span class="required">*</span></label>
            <select v-model="formData.category" class="form-select">
              <option value="">请选择分类</option>
              <option value="block">积木语言</option>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="scratch">Scratch</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="csharp">C#</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div class="form-group">
            <label>题目内容 <span class="required">*</span></label>
            <textarea
              v-model="formData.content"
              placeholder="请输入题目内容（支持Markdown格式）"
              class="form-textarea"
              rows="4"
            ></textarea>
            <p class="hint-text">支持Markdown格式，如：**粗体**、*斜体*、`代码`、```代码块```等</p>
          </div>

          <!-- 选择题/判断题选项 -->
          <div v-if="['single', 'multiple', 'judge'].includes(formData.type)" class="form-group">
            <label>选项设置 <span class="required">*</span></label>
            <div v-if="formData.type === 'judge'" class="judge-options">
              <label class="option-item">
                <input
                  type="radio"
                  v-model="formData.answer"
                  value="true"
                  name="judge-answer"
                />
                <span>正确</span>
              </label>
              <label class="option-item">
                <input
                  type="radio"
                  v-model="formData.answer"
                  value="false"
                  name="judge-answer"
                />
                <span>错误</span>
              </label>
            </div>
            <div v-else class="options-list">
              <div
                v-for="(option, index) in formData.options"
                :key="index"
                class="option-row"
              >
                <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
                <input
                  v-model="option.text"
                  type="text"
                  placeholder="请输入选项内容（支持Markdown格式）"
                  class="option-input"
                />
                <label class="option-checkbox">
                  <input
                    v-if="formData.type === 'single'"
                    type="radio"
                    :value="index"
                    v-model="formData.answer"
                    name="correct-answer"
                  />
                  <input
                    v-else
                    type="checkbox"
                    :value="index"
                    v-model="formData.answerArray"
                  />
                  <span>正确答案</span>
                </label>
                <button
                  v-if="formData.options.length > 2"
                  class="btn-remove-option"
                  @click="removeOption(index)"
                >
                  删除
                </button>
              </div>
              <button class="btn-add-option" @click="addOption">+ 添加选项</button>
              <p class="hint-text">选项内容支持Markdown格式，如：**粗体**、*斜体*、`代码`等</p>
            </div>
          </div>

          <!-- 填空题答案 -->
          <div v-if="formData.type === 'fill'" class="form-group">
            <label>参考答案 <span class="required">*</span></label>
            <input
              v-model="formData.answer"
              type="text"
              placeholder="请输入参考答案，多个答案用分号分隔"
              class="form-input"
            />
          </div>

          <!-- 问答题答案 -->
          <div v-if="formData.type === 'essay'" class="form-group">
            <label>参考答案</label>
            <textarea
              v-model="formData.answer"
              placeholder="请输入参考答案（选填）"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>

          <div class="form-group">
            <label>答案解析</label>
            <textarea
              v-model="formData.explanation"
              placeholder="请输入答案解析（支持Markdown格式）"
              class="form-textarea"
              rows="3"
            ></textarea>
            <p class="hint-text">支持Markdown格式，如：**粗体**、*斜体*、`代码`等</p>
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
import * as questionApi from '@/api/questionApi';

interface QuestionItem {
  id: number;
  title: string;
  content: string;
  type: string;
  difficulty: string;
  category: string;
  createdAt: string;
  options?: any[];
  answer?: any;
  explanation?: string;
  [key: string]: any;
}

const loading = ref(false);
const error = ref('');
const questionList = ref<QuestionItem[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const pageSize = 10;

const filters = reactive({
  keyword: '',
  type: '',
  difficulty: '',
  category: ''
});

const showDialog = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const editingId = ref<number | null>(null);

const formData = reactive({
  title: '',
  content: '',
  type: '',
  difficulty: '',
  category: '',
  options: [
    { text: '' },
    { text: '' },
    { text: '' },
    { text: '' }
  ] as Array<{ text: string }>,
  answer: '' as any,
  answerArray: [] as number[],
  explanation: ''
});

// 获取题目列表
const fetchQuestionList = async () => {
  loading.value = true;
  error.value = '';
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize,
      keyword: filters.keyword || undefined,
      type: filters.type || undefined,
      difficulty: filters.difficulty || undefined,
      category: filters.category || undefined
    };
    const response = await questionApi.getQuestionList(params);
    questionList.value = response.data || [];
    totalPages.value = Math.ceil((response.total || 0) / pageSize);
  } catch (err: any) {
    error.value = err.message || '获取题目列表失败';
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchQuestionList();
};

// 重置
const handleReset = () => {
  filters.keyword = '';
  filters.type = '';
  filters.difficulty = '';
  filters.category = '';
  currentPage.value = 1;
  fetchQuestionList();
};

// 切换页码
const changePage = (page: number) => {
  currentPage.value = page;
  fetchQuestionList();
};

// 打开创建对话框
const openCreateDialog = () => {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  showDialog.value = true;
};

// 打开编辑对话框
const openEditDialog = (item: QuestionItem) => {
  isEditing.value = true;
  editingId.value = item.id;
  formData.title = item.name || item.title || '';
  formData.content = item.description || item.content || '';
  formData.type = item.type;
  formData.difficulty = item.difficulty;
  formData.category = item.category;
  formData.explanation = item.explanation || '';

  if (['single', 'multiple'].includes(item.type) && item.options) {
    // 转换后端格式 { key: 'A', value: '...' } -> 前端格式 { text: '...' }
    formData.options = item.options.map((opt: any) => ({
      text: opt.value || opt.text || opt
    }));

    if (item.type === 'single') {
      formData.answer = item.answer;
    } else {
      formData.answerArray = Array.isArray(item.answer) ? item.answer : [];
    }
  } else {
    formData.answer = item.answer || '';
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
  formData.content = '';
  formData.type = '';
  formData.difficulty = '';
  formData.category = '';
  formData.options = [
    { text: '' },
    { text: '' },
    { text: '' },
    { text: '' }
  ];
  formData.answer = '';
  formData.answerArray = [];
  formData.explanation = '';
};

// 题目类型改变
const handleTypeChange = () => {
  formData.answer = '';
  formData.answerArray = [];
};

// 添加选项
const addOption = () => {
  formData.options.push({ text: '' });
};

// 删除选项
const removeOption = (index: number) => {
  formData.options.splice(index, 1);
  // 更新答案
  if (formData.type === 'single' && formData.answer === index) {
    formData.answer = '';
  } else if (formData.type === 'multiple') {
    formData.answerArray = formData.answerArray.filter((i: number) => i !== index);
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formData.title || !formData.content || !formData.type || !formData.difficulty || !formData.category) {
    alert('请填写必填项');
    return;
  }

  // 验证答案
  if (['single', 'multiple', 'judge'].includes(formData.type)) {
    if (formData.type === 'single' && formData.answer === '') {
      alert('请选择正确答案');
      return;
    }
    if (formData.type === 'multiple' && formData.answerArray.length === 0) {
      alert('请选择正确答案');
      return;
    }
    if (formData.type === 'judge' && !formData.answer) {
      alert('请选择正确答案');
      return;
    }
  }

  if (formData.type === 'fill' && !formData.answer) {
    alert('请填写参考答案');
    return;
  }

  submitting.value = true;
  try {
    const dataToSubmit: any = {
      name: formData.title,
      description: formData.content,
      type: formData.type,
      difficulty: formData.difficulty,
      category: formData.category,
      explanation: formData.explanation
    };

    if (['single', 'multiple'].includes(formData.type)) {
      // 转换选项格式：{ text: '...' } -> { key: 'A', value: '...' }
      dataToSubmit.options = formData.options.map((option, index) => ({
        key: String.fromCharCode(65 + index), // A, B, C, D...
        value: option.text
      }));
      dataToSubmit.answer = formData.type === 'single' ? formData.answer : formData.answerArray;
    } else if (formData.type === 'judge') {
      // 判断题：生成固定的两个选项
      dataToSubmit.options = [
        { key: 'true', value: '正确' },
        { key: 'false', value: '错误' }
      ];
      dataToSubmit.answer = formData.answer;
    } else {
      dataToSubmit.answer = formData.answer;
    }

    if (isEditing.value && editingId.value) {
      await questionApi.updateQuestion(editingId.value, dataToSubmit);
    } else {
      await questionApi.createQuestion(dataToSubmit);
    }

    alert('操作成功！');
    closeDialog();
    fetchQuestionList();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

// 删除
const handleDelete = async (id: number) => {
  if (!confirm('确定要删除这道题目吗?')) {
    return;
  }

  try {
    await questionApi.deleteQuestion(id);
    fetchQuestionList();
  } catch (err: any) {
    alert(err.message || '删除失败');
  }
};

// 工具函数
const getTypeText = (type: string) => {
  const map: Record<string, string> = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
    fill: '填空题',
    essay: '问答题'
  };
  return map[type] || type;
};

const getDifficultyText = (difficulty: string) => {
  const map: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  };
  return map[difficulty] || difficulty;
};

const getCategoryText = (category: string) => {
  const map: Record<string, string> = {
    block: '积木语言',
    cpp: 'C++',
    python: 'Python',
    scratch: 'Scratch',
    javascript: 'JavaScript',
    java: 'Java',
    csharp: 'C#',
    other: '其他'
  };
  return map[category] || category;
};

const formatDate = (date: string) => {
  if (!date) return '';
  return new Date(date).toLocaleString('zh-CN');
};

onMounted(() => {
  fetchQuestionList();
});
</script>

<style scoped>
.questions-manage {
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
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
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
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
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
  border-color: #8b5cf6;
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
  background: #8b5cf6;
  color: white;
}

.btn-search:hover {
  background: #7c3aed;
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
  border-top-color: #8b5cf6;
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
  background: #8b5cf6;
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

.content-cell {
  font-weight: 500;
  color: #1f2937;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-tag,
.difficulty-tag,
.category-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-single { background: #dbeafe; color: #1e40af; }
.type-multiple { background: #e0e7ff; color: #4338ca; }
.type-judge { background: #d1fae5; color: #065f46; }
.type-fill { background: #fef3c7; color: #92400e; }
.type-essay { background: #fce7f3; color: #9f1239; }

.difficulty-easy { background: #d1fae5; color: #065f46; }
.difficulty-medium { background: #fef3c7; color: #92400e; }
.difficulty-hard { background: #fee2e2; color: #991b1b; }

.category-block { background: #fef3c7; color: #92400e; }
.category-cpp { background: #dbeafe; color: #1e40af; }
.category-python { background: #d1fae5; color: #065f46; }
.category-scratch { background: #fce7f3; color: #9f1239; }
.category-javascript { background: #fef3c7; color: #78350f; }
.category-java { background: #e0e7ff; color: #4338ca; }
.category-csharp { background: #ede9fe; color: #6b21a8; }
.category-other { background: #f3f4f6; color: #4b5563; }

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
  border-color: #8b5cf6;
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
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.judge-options {
  display: flex;
  gap: 24px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-label {
  font-weight: 600;
  color: #6b7280;
  min-width: 24px;
}

.option-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
}

.option-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  cursor: pointer;
}

.btn-remove-option {
  padding: 6px 12px;
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.btn-add-option {
  padding: 10px 16px;
  background: #f3f4f6;
  color: #6b7280;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add-option:hover {
  background: #e5e7eb;
  border-color: #8b5cf6;
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
  background: #8b5cf6;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
