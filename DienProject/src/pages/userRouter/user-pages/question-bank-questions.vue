<template>
  <div class="question-bank-questions-page">
    <div class="page-header">
      <h2>题库资源</h2>
      <p>浏览和练习题库中的题目</p>
    </div>

    <!-- 筛选部分 -->
    <div class="question-filter-section">
      <div class="filter-card">
        <div class="filter-content">
          <div class="filter-row">
            <input
              type="text"
              v-model="searchKeyword"
              placeholder="搜索题目名称或关键词"
              class="filter-input"
              @keyup.enter="handleFilter"
            >
            <select v-model="selectedType" class="filter-select">
              <option value="">全部类型</option>
              <option value="single">单选题</option>
              <option value="multiple">多选题</option>
              <option value="judgment">判断题</option>
              <option value="fill">填空题</option>
              <option value="programming">编程题</option>
            </select>
            <select v-model="selectedDifficulty" class="filter-select">
              <option value="">全部难度</option>
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
            <select v-model="selectedCategory" class="filter-select">
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
            <button class="filter-btn" @click="handleFilter">筛选</button>
            <button class="reset-btn" @click="handleReset">重置</button>
          </div>
        </div>
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
      <button class="retry-btn" @click="fetchQuestions">重试</button>
    </div>

    <!-- 题目列表部分 -->
    <div v-else class="question-list-section">
      <!-- 空状态 -->
      <div v-if="questionsList.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h4 class="empty-title">暂无题目</h4>
        <p class="empty-description">当前筛选条件下没有找到题目，请尝试调整筛选条件。</p>
      </div>

      <!-- 题目列表 - 横条式 -->
      <div v-else class="question-list">
        <div v-for="question in questionsList" :key="question._id" class="question-row">
          <div class="question-left">
            <div class="question-badges">
              <span class="question-type" :class="`type-${question.type}`">
                {{ getTypeText(question.type) }}
              </span>
              <span class="question-difficulty" :class="`difficulty-${question.difficulty}`">
                {{ getDifficultyText(question.difficulty) }}
              </span>
              <span class="question-category" :class="`category-${question.category}`">
                {{ getCategoryText(question.category) }}
              </span>
              <span v-if="isQuestionAnswered(question._id)" class="question-status answered">
                ✓ 已作答
              </span>
              <span v-else class="question-status unanswered">
                未作答
              </span>
            </div>
            <h4 class="question-name">{{ question.name }}</h4>
            <div class="question-stats">
              <span class="stat-item">
                <span class="stat-icon">📊</span>
                <span>{{ question.attemptCount || 0 }}次作答</span>
              </span>
              <span class="stat-item">
                <span class="stat-icon">✓</span>
                <span>{{ question.correctCount || 0 }}次正确</span>
              </span>
              <span class="stat-item">
                <span class="stat-icon">📈</span>
                <span>{{ calculateCorrectRate(question) }}%正确率</span>
              </span>
            </div>
          </div>
          <div class="question-right">
            <button
              class="start-btn"
              :class="{ 'answered-btn': isQuestionAnswered(question._id) }"
              @click="handleStartQuestion(question._id)"
            >
              {{ isQuestionAnswered(question._id) ? '重新作答' : '开始做题' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="questionsList.length > 0" class="pagination">
        <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
        <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getQuestionList } from '@/api/questionApi'
import * as userActivityApi from '@/api/userActivityApi'

const router = useRouter()

// 搜索和筛选状态
const searchKeyword = ref('')
const selectedType = ref<string>('')
const selectedDifficulty = ref<string>('')
const selectedCategory = ref<string>('')
const currentPage = ref<number>(1)
const pageSize = 10

// 数据和加载状态
const questionsList = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const totalPages = ref(1)
const answeredQuestions = ref<Set<string>>(new Set())

// 获取题目列表
const fetchQuestions = async () => {
  loading.value = true
  error.value = ''

  try {
    const params = {
      page: currentPage.value,
      limit: pageSize,
      keyword: searchKeyword.value || undefined,
      type: selectedType.value || undefined,
      difficulty: selectedDifficulty.value || undefined,
      category: selectedCategory.value || undefined
    }

    const response = await getQuestionList(params)

    if (response.success) {
      questionsList.value = response.data || []

      // 更新总页数
      if (response.pagination) {
        totalPages.value = response.pagination.totalPages
      }

      // 获取答题状态
      await fetchAnsweredStatus()
    }
  } catch (err: any) {
    error.value = err.message || '获取题目列表失败'
    console.error('获取题目失败:', err)
  } finally {
    loading.value = false
  }
}

// 获取已答题目状态
const fetchAnsweredStatus = async () => {
  try {
    const response = await userActivityApi.getMyActivities({
      activityType: 'question_submit',
      resourceType: 'question',
      limit: 1000 // 获取所有答题记录
    })

    if (response.success && response.data) {
      // 将已答题目ID存入Set
      answeredQuestions.value = new Set(
        response.data.map((activity: any) => activity.resourceId)
      )
    }
  } catch (err) {
    console.error('获取答题状态失败:', err)
  }
}

// 检查题目是否已作答
const isQuestionAnswered = (questionId: string): boolean => {
  return answeredQuestions.value.has(questionId)
}

// 处理筛选
const handleFilter = (): void => {
  currentPage.value = 1
  fetchQuestions()
}

// 处理重置
const handleReset = (): void => {
  searchKeyword.value = ''
  selectedType.value = ''
  selectedDifficulty.value = ''
  selectedCategory.value = ''
  currentPage.value = 1
  fetchQuestions()
}

// 切换页码
const changePage = (page: number) => {
  currentPage.value = page
  fetchQuestions()
}

// 处理开始做题
const handleStartQuestion = (questionId: string): void => {
  router.push(`/users/question-solve/${questionId}`)
}

// 工具函数
const getTypeText = (type: string) => {
  const map: Record<string, string> = {
    single: '单选题',
    multiple: '多选题',
    judgment: '判断题',
    fill: '填空题',
    programming: '编程题'
  }
  return map[type] || type
}

const getDifficultyText = (difficulty: string) => {
  const map: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return map[difficulty] || difficulty
}

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
  }
  return map[category] || category
}

// 计算正确率
const calculateCorrectRate = (question: any): number => {
  const attemptCount = question.attemptCount || 0
  const correctCount = question.correctCount || 0

  if (attemptCount === 0) return 0

  return Math.round((correctCount / attemptCount) * 100)
}

onMounted(() => {
  fetchQuestions()
})
</script>

<style scoped>
.question-bank-questions-page {
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
.question-filter-section {
  margin-bottom: 30px;
}

.filter-card {
  background: #f7fafc;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.filter-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.filter-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
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
  background: #e2e8f0;
  color: #4a5568;
}

.reset-btn:hover {
  background: #cbd5e0;
}

/* 加载和错误状态 */
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

.empty-state {
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
  margin: 0;
  line-height: 1.6;
}

/* 题目列表 - 横条式 */
.question-list-section {
  margin-top: 30px;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 30px;
}

.question-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
  gap: 20px;
}

.question-row:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: #4299e1;
}

.question-left {
  flex: 1;
  min-width: 0;
}

.question-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.question-type,
.question-difficulty,
.question-category {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.type-single {
  background: #ebf8ff;
  color: #2b6cb0;
}

.type-multiple {
  background: #f0fff4;
  color: #276749;
}

.type-judgment {
  background: #fffaf0;
  color: #c05621;
}

.type-fill {
  background: #f7fafc;
  color: #4a5568;
}

.type-programming {
  background: #faf5ff;
  color: #553c9a;
}

.difficulty-easy {
  background: #f0fff4;
  color: #276749;
}

.difficulty-medium {
  background: #fffaf0;
  color: #c05621;
}

.difficulty-hard {
  background: #fff5f5;
  color: #c53030;
}

.category-block {
  background: #fef3c7;
  color: #92400e;
}

.category-cpp {
  background: #dbeafe;
  color: #1e40af;
}

.category-python {
  background: #d1fae5;
  color: #065f46;
}
.category-scratch {
  background: #fce7f3;
  color: #9f1239;
}

.category-javascript {
  background: #fef3c7;
  color: #78350f;
}

.category-java {
  background: #e0e7ff;
  color: #4338ca;
}

.category-csharp {
  background: #ede9fe;
  color: #6b21a8;
}

.category-other {
  background: #f3f4f6;
  color: #4b5563;
}

.question-status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.question-status.answered {
  background: #d1fae5;
  color: #065f46;
}

.question-status.unanswered {
  background: #fee2e2;
  color: #991b1b;
}

.question-name {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 12px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.question-stats {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #718096;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 14px;
}

.question-right {
  flex-shrink: 0;
}

.start-btn {
  padding: 12px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  white-space: nowrap;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.start-btn.answered-btn {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.start-btn.answered-btn:hover {
  box-shadow: 0 6px 16px rgba(72, 187, 120, 0.4);
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

  .filter-input,
  .filter-select {
    width: 100%;
  }

  .filter-btn,
  .reset-btn {
    width: 100%;
  }

  .question-row {
    flex-direction: column;
    align-items: stretch;
  }

  .question-right {
    width: 100%;
  }

  .start-btn {
    width: 100%;
  }
}
</style>
