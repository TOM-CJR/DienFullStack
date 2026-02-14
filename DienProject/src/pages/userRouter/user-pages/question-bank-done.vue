<template>
  <div class="question-bank-done-page">
    <div class="page-header">
      <h2>已做题目</h2>
      <p>查看和管理您已经完成的题目</p>
    </div>

    <!-- 筛选部分 -->
    <div class="question-filter-section">
      <div class="filter-card">
        <h3 class="filter-title">题目筛选</h3>
        <div class="filter-content">
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">搜索关键词</label>
              <input 
                type="text" 
                v-model="searchKeyword" 
                placeholder="输入题目名称或关键词"
                class="filter-input"
              >
            </div>
            <div class="filter-item">
              <label class="filter-label">题目类型</label>
              <select v-model="selectedType" class="filter-select">
                <option value="">全部类型</option>
                <option value="single">单选题</option>
                <option value="multiple">多选题</option>
                <option value="judgment">判断题</option>
                <option value="fill">填空题</option>
                <option value="programming">编程题</option>
              </select>
            </div>
          </div>
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">答题结果</label>
              <select v-model="selectedResult" class="filter-select">
                <option value="">全部结果</option>
                <option value="correct">正确</option>
                <option value="incorrect">错误</option>
              </select>
            </div>
            <div class="filter-item">
              <label class="filter-label">答题时间</label>
              <select v-model="selectedTimeRange" class="filter-select">
                <option value="">全部时间</option>
                <option value="today">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="year">本年</option>
              </select>
            </div>
          </div>
          <div class="filter-actions">
            <button class="filter-btn" @click="handleFilter">筛选题目</button>
            <button class="reset-btn" @click="handleReset">重置筛选</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 题目列表部分 -->
    <div class="question-list-section">
      <div class="list-header">
        <h3 class="list-title">已做题目列表</h3>
        <div class="sort-controls">
          <span class="sort-label">排序方式：</span>
          <select v-model="sortBy" class="sort-select">
            <option value="latest">最近答题</option>
            <option value="result">结果排序</option>
            <option value="name">名称排序</option>
          </select>
        </div>
      </div>
      
      <!-- 统计信息 -->
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-value">{{ totalQuestions }}</div>
          <div class="stat-label">总答题数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value correct-stat">{{ correctQuestions }}</div>
          <div class="stat-label">正确数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value incorrect-stat">{{ incorrectQuestions }}</div>
          <div class="stat-label">错误数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value rate-stat">{{ correctRate }}%</div>
          <div class="stat-label">正确率</div>
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
        <button class="retry-btn-full" @click="fetchDoneQuestions">重试</button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredQuestions.length === 0 && doneQuestionsData.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h4 class="empty-title">暂无已做题目</h4>
        <p class="empty-description">您还没有完成任何题目，去题库开始练习吧！</p>
        <router-link to="/users/question-bank/questions" class="practice-btn">开始练习</router-link>
      </div>

      <!-- 筛选后的空状态 -->
      <div v-else-if="filteredQuestions.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h4 class="empty-title">没有找到符合条件的题目</h4>
        <p class="empty-description">请尝试调整筛选条件</p>
        <button class="practice-btn" @click="handleReset">重置筛选</button>
      </div>

      <!-- 题目列表 - 横条式 -->
      <div v-else class="question-list">
        <div v-for="question in filteredQuestions" :key="question._id" class="question-row">
          <div class="question-left">
            <div class="question-badges">
              <span class="question-type" :class="`type-${question.type}`">
                {{ getTypeText(question.type) }}
              </span>
              <span class="question-difficulty" :class="`difficulty-${question.difficulty}`">
                {{ getDifficultyText(question.difficulty) }}
              </span>
              <span class="question-result" :class="`result-${question.result}`">
                {{ getResultText(question.result) }}
              </span>
            </div>
            <h4 class="question-name">{{ question.name }}</h4>
            <div class="question-stats">
              <div class="stat-item">
                <span class="stat-icon">📅</span>
                <span class="stat-text">{{ question.answerDate }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">⏱️</span>
                <span class="stat-text">用时 {{ question.timeSpent }}秒</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">💯</span>
                <span class="stat-text">得分 {{ question.score }}分</span>
              </div>
            </div>
          </div>
          <div class="question-actions">
            <button class="action-btn review-btn" @click="handleReviewQuestion(question.questionId)">查看详情</button>
            <button class="action-btn retry-btn" @click="handleRetryQuestion(question.questionId)">重新答题</button>
          </div>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="filteredQuestions.length > 0" class="pagination">
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
        <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as questionApi from '@/api/questionApi'
import * as userActivityApi from '@/api/userActivityApi'

const router = useRouter()

// 已做题目类型
interface DoneQuestion {
  _id: string
  questionId: string
  name: string
  description: string
  type: 'single' | 'multiple' | 'judgment' | 'fill' | 'programming'
  difficulty: 'easy' | 'medium' | 'hard'
  result: 'correct' | 'incorrect'
  answerDate: string
  timeSpent: number
  score: number
}

// 搜索和筛选状态
const searchKeyword = ref('')
const selectedType = ref<string>('')
const selectedResult = ref<string>('')
const selectedTimeRange = ref<string>('')
const sortBy = ref<string>('latest')
const currentPage = ref<number>(1)
const pageSize = 12

// 状态
const loading = ref(false)
const error = ref('')
const doneQuestionsData = ref<DoneQuestion[]>([])

// 获取已做题目列表
const fetchDoneQuestions = async () => {
  loading.value = true
  error.value = ''

  try {
    // 1. 获取用户的答题记录
    const activitiesResponse = await userActivityApi.getMyActivities({
      activityType: 'question_submit',
      resourceType: 'question'
    })

    if (!activitiesResponse.success || !activitiesResponse.data) {
      doneQuestionsData.value = []
      return
    }

    const activities = activitiesResponse.data

    // 2. 获取每个题目的详细信息
    const questionPromises = activities.map(async (activity: any) => {
      try {
        const questionResponse = await questionApi.getQuestionDetail(activity.resourceId)
        if (questionResponse.success && questionResponse.data) {
          const question = questionResponse.data
          const activityData = activity.data || {}

          return {
            _id: activity._id,
            questionId: activity.resourceId,
            name: question.name,
            description: question.description,
            type: question.type,
            difficulty: question.difficulty,
            result: activityData.isCorrect ? 'correct' : 'incorrect',
            answerDate: new Date(activity.createdAt).toLocaleString('zh-CN'),
            timeSpent: activityData.timeSpent || 0,
            score: activityData.score || 0
          }
        }
        return null
      } catch (err) {
        console.error(`获取题目 ${activity.resourceId} 详情失败:`, err)
        return null
      }
    })

    const questionResults = await Promise.all(questionPromises)

    // 过滤掉null值（被删除的题目）
    doneQuestionsData.value = questionResults.filter(q => q !== null) as DoneQuestion[]
  } catch (err: any) {
    console.error('获取已做题目列表失败:', err)
    error.value = err.message || '获取已做题目列表失败'
  } finally {
    loading.value = false
  }
}

// 计算过滤后的题目
const filteredQuestions = computed<DoneQuestion[]>(() => {
  let result = doneQuestionsData.value.filter(question => {
    const matchesKeyword = !searchKeyword.value ||
      question.name.includes(searchKeyword.value) ||
      question.description.includes(searchKeyword.value)
    const matchesType = !selectedType.value || question.type === selectedType.value
    const matchesResult = !selectedResult.value || question.result === selectedResult.value
    // 这里可以添加时间范围过滤逻辑
    return matchesKeyword && matchesType && matchesResult
  })

  // 排序处理
  switch (sortBy.value) {
    case 'latest':
      result.sort((a, b) => new Date(b.answerDate).getTime() - new Date(a.answerDate).getTime())
      break
    case 'result':
      result.sort((a, b) => {
        if (a.result === 'correct' && b.result === 'incorrect') return -1
        if (a.result === 'incorrect' && b.result === 'correct') return 1
        return 0
      })
      break
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name))
      break
  }

  // 分页处理
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return result.slice(start, end)
})

// 计算总页数
const totalPages = computed<number>(() => {
  const filteredCount = doneQuestionsData.value.filter(question => {
    const matchesKeyword = !searchKeyword.value || 
      question.name.includes(searchKeyword.value) || 
      question.description.includes(searchKeyword.value)
    const matchesType = !selectedType.value || question.type === selectedType.value
    const matchesResult = !selectedResult.value || question.result === selectedResult.value
    return matchesKeyword && matchesType && matchesResult
  }).length
  return Math.ceil(filteredCount / pageSize)
})

// 统计信息
const totalQuestions = computed<number>(() => doneQuestionsData.value.length)
const correctQuestions = computed<number>(() => doneQuestionsData.value.filter(q => q.result === 'correct').length)
const incorrectQuestions = computed<number>(() => doneQuestionsData.value.filter(q => q.result === 'incorrect').length)
const correctRate = computed<number>(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((correctQuestions.value / totalQuestions.value) * 100)
})

// 处理筛选
const handleFilter = (): void => {
  currentPage.value = 1
}

// 处理重置
const handleReset = (): void => {
  searchKeyword.value = ''
  selectedType.value = ''
  selectedResult.value = ''
  selectedTimeRange.value = ''
  sortBy.value = 'latest'
  currentPage.value = 1
}

// 处理查看详情
const handleReviewQuestion = (questionId: string): void => {
  router.push(`/users/question-solve/${questionId}`)
}

// 处理重新答题
const handleRetryQuestion = (questionId: string): void => {
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

const getResultText = (result: string) => {
  const map: Record<string, string> = {
    correct: '正确',
    incorrect: '错误'
  }
  return map[result] || result
}

// 组件挂载时获取已做题目列表
onMounted(() => {
  fetchDoneQuestions()
})
</script>

<style scoped>
.question-bank-done-page {
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
.question-list-section {
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

/* 统计信息卡片 */
.stats-card {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
}

.stat-item {
  flex: 1;
  min-width: 120px;
  text-align: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 5px;
}

.correct-stat {
  color: #38a169;
}

.incorrect-stat {
  color: #e53e3e;
}

.rate-stat {
  color: #4299e1;
}

.stat-label {
  font-size: 14px;
  color: #718096;
  font-weight: 600;
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

.retry-btn-full {
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

.retry-btn-full:hover {
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

.practice-btn {
  display: inline-block;
  padding: 10px 24px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.practice-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 题目列表 - 横条式 */
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
.question-difficulty {
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

.question-result {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.result-correct {
  background: #f0fff4;
  color: #276749;
}

.result-incorrect {
  background: #fff5f5;
  color: #c53030;
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
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  font-size: 14px;
}

.stat-text {
  color: #4a5568;
}

.question-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.action-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  white-space: nowrap;
}

.review-btn {
  background: #4299e1;
  color: white;
}

.review-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.retry-btn {
  background: #ed8936;
  color: white;
}

.retry-btn:hover {
  background: #dd6b20;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

  .stats-card {
    flex-direction: column;
    gap: 10px;
  }

  .stat-item {
    width: 100%;
  }

  .question-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .question-actions {
    width: 100%;
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }

  .question-stats {
    flex-direction: column;
    gap: 8px;
  }
}
</style>