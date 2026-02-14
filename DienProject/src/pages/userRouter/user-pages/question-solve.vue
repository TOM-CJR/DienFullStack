<template>
  <div class="question-solve-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载题目中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button class="action-btn secondary-btn" @click="fetchQuestionDetail">重试</button>
      <button class="action-btn" @click="goBack">返回题库</button>
    </div>

    <!-- 题目内容 -->
    <div v-else-if="question" class="question-container">
      <!-- 顶部工具栏 -->
      <div class="top-toolbar">
        <button class="back-btn" @click="goBack">
          <span class="icon">←</span>
          <span>返回题库</span>
        </button>
        <div class="question-info">
          <span class="info-item">
            <span class="label">类型：</span>
            <span class="badge type-badge" :class="`type-${question.type}`">
              {{ getTypeText(question.type) }}
            </span>
          </span>
          <span class="info-item">
            <span class="label">难度：</span>
            <span class="badge difficulty-badge" :class="`difficulty-${question.difficulty}`">
              {{ getDifficultyText(question.difficulty) }}
            </span>
          </span>
          <span class="info-item">
            <span class="label">分类：</span>
            <span class="badge category-badge" :class="`category-${question.category}`">
              {{ getCategoryText(question.category) }}
            </span>
          </span>
        </div>
      </div>

      <!-- 主体内容区 -->
      <div class="main-content">
        <!-- 题目标题 -->
        <div class="question-header">
          <h1 class="question-title">{{ question.name }}</h1>
        </div>

        <!-- 题目描述 -->
        <div class="question-description">
          <div class="description-label">题目描述</div>
          <div class="description-content" v-html="renderMarkdown(question.description)"></div>
        </div>

        <!-- 单选题 -->
        <div v-if="question.type === 'single'" class="answer-area">
          <div class="answer-label">请选择一个答案</div>
          <div class="options-container">
            <label
              v-for="(option, index) in question.options"
              :key="index"
              class="option-item"
              :class="[
                { 'option-selected': userAnswer === index },
                getOptionClass(index as number),
                { 'option-disabled': submitted }
              ]"
            >
              <div class="option-radio">
                <input
                  type="radio"
                  :name="'answer'"
                  :value="index"
                  v-model="userAnswer"
                  :disabled="submitted"
                />
                <span class="radio-custom"></span>
              </div>
              <div class="option-content">
                <span class="option-label">{{ option.key }}.</span>
                <div class="option-text" v-html="renderMarkdown(option.value)" style="font-size: 18px !important; line-height: 1.5 !important;"></div>
              </div>
            </label>
          </div>
        </div>

        <!-- 多选题 -->
        <div v-if="question.type === 'multiple'" class="answer-area">
          <div class="answer-label">请选择一个或多个答案</div>
          <div class="options-container">
            <label
              v-for="(option, index) in question.options"
              :key="index"
              class="option-item"
              :class="[
                { 'option-selected': userAnswerArray.includes(index as number) },
                getOptionClass(index as number),
                { 'option-disabled': submitted }
              ]"
            >
              <div class="option-checkbox">
                <input
                  type="checkbox"
                  :value="index"
                  v-model="userAnswerArray"
                  :disabled="submitted"
                />
                <span class="checkbox-custom"></span>
              </div>
              <div class="option-content">
                <span class="option-label">{{ option.key }}.</span>
                <div class="option-text" v-html="renderMarkdown(option.value)" style="font-size: 18px !important; line-height: 1.5 !important;"></div>
              </div>
            </label>
          </div>
        </div>

        <!-- 判断题 -->
        <div v-if="question.type === 'judgment'" class="answer-area">
          <div class="answer-label">请判断正误</div>
          <div class="judgment-options">
            <label
              v-for="(option, index) in question.options"
              :key="index"
              class="judgment-item"
              :class="[
                { 'judgment-selected': userAnswer === option.key },
                getOptionClass(index as number),
                { 'option-disabled': submitted }
              ]"
            >
              <input
                type="radio"
                :name="'judgment'"
                :value="option.key"
                v-model="userAnswer"
                :disabled="submitted"
              />
              <div class="judgment-button">
                <span class="judgment-icon" v-if="option.key === 'true'">✓</span>
                <span class="judgment-icon" v-else>✗</span>
                <div class="judgment-text" v-html="renderMarkdown(option.value)" style="font-size: 18px !important; line-height: 1.5 !important;"></div>
              </div>
            </label>
          </div>
        </div>

        <!-- 填空题 -->
        <div v-if="question.type === 'fill'" class="answer-area">
          <div class="answer-label">请填写答案</div>
          <div class="fill-container">
            <input
              type="text"
              v-model="userAnswer"
              placeholder="请输入你的答案..."
              class="fill-input"
            />
          </div>
        </div>

        <!-- 编程题提示 -->
        <div v-if="question.type === 'programming'" class="answer-area">
          <div class="programming-notice">
            <div class="notice-icon">💻</div>
            <div class="notice-content">
              <h3>编程题暂未开放</h3>
              <p>编程题的在线编辑和判题功能正在开发中，敬请期待！</p>
            </div>
          </div>
        </div>

        <!-- 答题结果区 -->
        <div v-if="submitted && answerResult" class="result-area">
          <div class="result-header" :class="answerResult.isCorrect ? 'result-correct' : 'result-wrong'">
            <div class="result-icon">
              {{ answerResult.isCorrect ? '✓' : '✗' }}
            </div>
            <div class="result-info">
              <div class="result-title">
                {{ answerResult.isCorrect ? '回答正确！' : '回答错误' }}
              </div>
              <div class="result-meta">
                <span>用时: {{ answerResult.timeSpent }}秒</span>
                <span class="divider">|</span>
                <span>得分: {{ answerResult.score }}分</span>
              </div>
            </div>
          </div>

          <!-- 题目解析 -->
          <div v-if="answerResult.explanation" class="explanation-section">
            <div class="explanation-title">题目解析</div>
            <div class="explanation-content" v-html="renderMarkdown(answerResult.explanation)"></div>
          </div>
          <div v-else class="explanation-section">
            <div class="explanation-title">题目解析</div>
            <div class="explanation-content no-explanation">暂无解析</div>
          </div>
        </div>

        <!-- 底部操作区 -->
        <div class="action-footer" v-if="question.type !== 'programming'">
          <div class="footer-left">
            <button v-if="!submitted" class="action-btn secondary-btn" @click="clearAnswer">
              清空答案
            </button>
            <button v-if="submitted" class="action-btn secondary-btn" @click="goBack">
              返回题库
            </button>
          </div>
          <div class="footer-right">
            <button
              v-if="!submitted"
              class="action-btn primary-btn"
              @click="handleSubmitAnswer"
              :disabled="submitting"
            >
              {{ submitting ? '提交中...' : '提交答案' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getQuestionDetail, submitAnswer } from '@/api/questionApi'
import * as userActivityApi from '@/api/userActivityApi'
import { marked } from 'marked'

const route = useRoute()
const router = useRouter()

// 题目数据
const question = ref<any>(null)
const loading = ref(true) // 初始设置为true，确保显示加载状态
const error = ref('')

// 用户答案
const userAnswer = ref<any>('')
const userAnswerArray = ref<number[]>([])

// 答题状态
const submitting = ref(false)
const submitted = ref(false)
const answerResult = ref<any>(null)
const startTime = ref<number>(0)

// 获取题目详情
const fetchQuestionDetail = async () => {
  loading.value = true
  error.value = ''

  try {
    const questionId = route.params.id as string

    // 验证题目ID是否有效
    if (!questionId) {
      error.value = '题目ID无效'
      return
    }

    const response = await getQuestionDetail(questionId)

    if (response.success && response.data) {
      question.value = response.data
      // 开始计时
      startTime.value = Date.now()
    } else {
      error.value = response.message || '获取题目详情失败'
    }
  } catch (err: any) {
    console.error('获取题目详情失败:', err)
    error.value = err.response?.data?.message || err.message || '获取题目详情失败'
  } finally {
    loading.value = false
  }
}

// 清空答案
const clearAnswer = () => {
  userAnswer.value = ''
  userAnswerArray.value = []
}

// 提交答案
const handleSubmitAnswer = async () => {
  if (!question.value) return

  // 检查是否有答案
  let finalAnswer: any
  if (question.value.type === 'multiple') {
    if (userAnswerArray.value.length === 0) {
      showMessage('请选择答案', 'error')
      return
    }
    finalAnswer = userAnswerArray.value
  } else {
    if (!userAnswer.value && userAnswer.value !== 0 && userAnswer.value !== 'false') {
      showMessage('请填写答案', 'error')
      return
    }
    finalAnswer = userAnswer.value
  }

  submitting.value = true

  try {
    const questionId = route.params.id as string

    // 调用后端判题API
    const response = await submitAnswer(questionId, finalAnswer)

    if (response.success) {
      // 计算用时（秒）
      const timeSpent = Math.floor((Date.now() - startTime.value) / 1000)

      // 保存答题结果
      answerResult.value = {
        isCorrect: response.data.isCorrect,
        correctAnswer: response.data.correctAnswer,
        explanation: response.data.explanation || question.value.explanation,
        score: response.data.isCorrect ? 100 : 0,
        timeSpent
      }

      submitted.value = true

      // 保存答题记录到用户活动（仅保存单选、多选、判断题）
      if (['single', 'multiple', 'judgment'].includes(question.value.type)) {
        await saveQuestionActivity(questionId, timeSpent, response.data.isCorrect)
      }

      // 显示结果提示
      if (response.data.isCorrect) {
        showMessage('回答正确！', 'success')
      } else {
        showMessage('回答错误', 'error')
      }
    } else {
      showMessage(response.message || '提交失败', 'error')
    }
  } catch (err: any) {
    console.error('提交答案失败:', err)
    showMessage('提交失败：' + (err.message || '未知错误'), 'error')
  } finally {
    submitting.value = false
  }
}

// 保存答题记录
const saveQuestionActivity = async (questionId: string, timeSpent: number, isCorrect: boolean) => {
  try {
    await userActivityApi.createActivity({
      activityType: 'question_submit',
      resourceType: 'question',
      resourceId: questionId,
      data: {
        timeSpent,
        isCorrect,
        score: isCorrect ? 100 : 0,
        submittedAt: new Date().toISOString()
      }
    })
  } catch (err) {
    console.error('保存答题记录失败:', err)
  }
}

// 返回题库
const goBack = () => {
  router.push('/users/question-bank/questions')
}

// 显示消息提示
const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  const bgColors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  }

  const div = document.createElement('div')
  div.textContent = message
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
  `

  document.body.appendChild(div)

  setTimeout(() => {
    div.style.animation = 'slideUp 0.3s ease'
    setTimeout(() => div.remove(), 300)
  }, 2000)
}

// 渲染Markdown
const renderMarkdown = (text: string) => {
  if (!text) return ''
  return marked.parse(text)
}

// 检查选项状态（用于高亮显示）
const getOptionClass = (index: number) => {
  if (!submitted.value || !answerResult.value) return ''

  const correctAnswer = answerResult.value.correctAnswer

  // 对于多选题
  if (question.value.type === 'multiple') {
    const correctIndexes = Array.isArray(correctAnswer) ? correctAnswer : []
    if (correctIndexes.includes(index)) {
      return 'option-correct' // 正确选项显示绿色
    }
    if (userAnswerArray.value.includes(index) && !correctIndexes.includes(index)) {
      return 'option-wrong' // 用户选错的选项显示红色
    }
  } else {
    // 对于单选题和判断题
    if (index === correctAnswer || getOptionKey(index) === correctAnswer) {
      return 'option-correct'
    }
    if ((userAnswer.value === index || userAnswer.value === getOptionKey(index)) &&
        (index !== correctAnswer && getOptionKey(index) !== correctAnswer)) {
      return 'option-wrong'
    }
  }

  return ''
}

// 获取选项的key值（用于判断题）
const getOptionKey = (index: number) => {
  if (!question.value || !question.value.options || !question.value.options[index]) {
    return null
  }
  return question.value.options[index].key
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

onMounted(() => {
  fetchQuestionDetail()
})
</script>

<style scoped>
.question-solve-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 加载和错误状态 */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 40px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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
  color: #e53e3e;
  font-size: 16px;
  margin-bottom: 20px;
}

/* 题目容器 */
.question-container {
  max-width: 1000px;
  margin: 0 auto;
}

/* 顶部工具栏 */
.top-toolbar {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #4a5568;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.back-btn .icon {
  font-size: 16px;
}

.question-info {
  display: flex;
  gap: 20px;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.info-item .label {
  color: #718096;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.type-badge.type-single { background: #ebf8ff; color: #2b6cb0; }
.type-badge.type-multiple { background: #f0fff4; color: #276749; }
.type-badge.type-judgment { background: #fffaf0; color: #c05621; }
.type-badge.type-fill { background: #faf5ff; color: #6b21a8; }
.type-badge.type-programming { background: #f3f4f6; color: #4a5568; }

.difficulty-badge.difficulty-easy { background: #d1fae5; color: #065f46; }
.difficulty-badge.difficulty-medium { background: #fed7aa; color: #c05621; }
.difficulty-badge.difficulty-hard { background: #fecaca; color: #991b1b; }

.category-badge.category-block { background: #fef3c7; color: #92400e; }
.category-badge.category-cpp { background: #dbeafe; color: #1e40af; }
.category-badge.category-python { background: #d1fae5; color: #065f46; }
.category-badge.category-scratch { background: #fce7f3; color: #9f1239; }
.category-badge.category-javascript { background: #fef3c7; color: #78350f; }
.category-badge.category-java { background: #e0e7ff; color: #4338ca; }
.category-badge.category-csharp { background: #ede9fe; color: #6b21a8; }
.category-badge.category-other { background: #f3f4f6; color: #4b5563; }

/* 主体内容 */
.main-content {
  background: white;
  margin: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* 题目标题 */
.question-header {
  padding: 32px 32px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.question-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  line-height: 1.4;
  margin: 0;
}

/* 题目描述 */
.question-description {
  padding: 24px 32px;
  border-bottom: 1px solid #e2e8f0;
}

.description-label {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.description-content {
  font-size: 20px;
  line-height: 1.6;
  color: #2d3748;
}

.description-content :deep(p) {
  margin: 0 0 12px 0;
}

.description-content :deep(pre) {
  background: #2d3748;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.description-content :deep(code) {
  background: #edf2f7;
  color: #e53e3e;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 16px;
}

.description-content :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}

/* 答题区域 */
.answer-area {
  padding: 24px 32px;
}

.answer-label {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 16px;
}

/* 选项容器 */
.options-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 18px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.option-item.option-selected {
  background: #ebf8ff;
  border-color: #4299e1;
}

.option-radio,
.option-checkbox {
  position: relative;
  flex-shrink: 0;
  margin-top: 2px;
}

.option-radio input,
.option-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.radio-custom,
.checkbox-custom {
  display: block;
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e0;
  background: white;
  transition: all 0.2s;
}

.radio-custom {
  border-radius: 50%;
}

.checkbox-custom {
  border-radius: 4px;
}

.option-item.option-selected .radio-custom {
  border-color: #4299e1;
  background: #4299e1;
  box-shadow: inset 0 0 0 4px white;
}

.option-item.option-selected .checkbox-custom {
  border-color: #4299e1;
  background: #4299e1;
  position: relative;
}

.option-item.option-selected .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.option-content {
  display: flex;
  gap: 14px;
  flex: 1;
  align-items: flex-start;
}

.option-label {
  font-weight: 700;
  color: #4a5568;
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.option-text {
  font-size: 18px !important;
  color: #2d3748 !important;
  line-height: 1.5 !important;
  flex: 1;
}

.option-text :deep(*) {
  font-size: 18px !important;
  line-height: 1.5 !important;
}

.option-text :deep(p) {
  margin: 0 !important;
  font-size: 18px !important;
}

.option-text :deep(pre) {
  background: #2d3748 !important;
  color: #e2e8f0 !important;
  padding: 10px 14px !important;
  border-radius: 6px !important;
  overflow-x: auto !important;
  margin: 4px 0 !important;
  font-size: 16px !important;
}

.option-text :deep(code) {
  background: #edf2f7 !important;
  color: #e53e3e !important;
  padding: 2px 6px !important;
  border-radius: 3px !important;
  font-family: 'Consolas', 'Monaco', monospace !important;
  font-size: 15px !important;
}

.option-text :deep(pre code) {
  background: transparent !important;
  color: inherit !important;
  padding: 0 !important;
}

/* 判断题 */
.judgment-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 500px;
}

.judgment-item {
  cursor: pointer;
}

.judgment-item input {
  display: none;
}

.judgment-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;
}

.judgment-item:hover .judgment-button {
  background: #edf2f7;
  border-color: #cbd5e0;
  transform: translateY(-1px);
}

.judgment-item.judgment-selected .judgment-button {
  background: #ebf8ff;
  border-color: #4299e1;
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.2);
}

.judgment-icon {
  font-size: 36px;
  font-weight: bold;
}

.judgment-selected .judgment-icon {
  color: #4299e1;
}

.judgment-text {
  font-size: 18px !important;
  font-weight: 600 !important;
  color: #2d3748 !important;
}

.judgment-text :deep(*) {
  font-size: 18px !important;
  line-height: 1.5 !important;
}

/* 填空题 */
.fill-container {
  max-width: 600px;
}

.fill-input {
  width: 100%;
  padding: 14px 18px;
  font-size: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;
  background: #f7fafc;
}

.fill-input:focus {
  outline: none;
  border-color: #4299e1;
  background: white;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

/* 选项高亮状态 */
.option-item.option-correct {
  background: #d1fae5 !important;
  border-color: #10b981 !important;
}

.option-item.option-wrong {
  background: #fee2e2 !important;
  border-color: #ef4444 !important;
}

.judgment-item.option-correct .judgment-button {
  background: #d1fae5 !important;
  border-color: #10b981 !important;
}

.judgment-item.option-wrong .judgment-button {
  background: #fee2e2 !important;
  border-color: #ef4444 !important;
}

.option-item.option-disabled {
  cursor: not-allowed;
  opacity: 0.9;
}

.option-item.option-disabled input {
  cursor: not-allowed;
}

/* 答题结果区 */
.result-area {
  padding: 24px 32px;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.result-header.result-correct {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.result-header.result-wrong {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.result-icon {
  font-size: 48px;
  font-weight: bold;
}

.result-header.result-correct .result-icon {
  color: #10b981;
}

.result-header.result-wrong .result-icon {
  color: #ef4444;
}

.result-info {
  flex: 1;
}

.result-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #1a202c;
}

.result-meta {
  font-size: 14px;
  color: #4a5568;
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-meta .divider {
  color: #cbd5e0;
}

/* 题目解析 */
.explanation-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.explanation-title {
  font-size: 16px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e2e8f0;
}

.explanation-content {
  font-size: 16px;
  line-height: 1.8;
  color: #4a5568;
}

.explanation-content.no-explanation {
  color: #a0aec0;
  font-style: italic;
}

.explanation-content :deep(p) {
  margin: 0 0 12px 0;
}

.explanation-content :deep(pre) {
  background: #2d3748;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.explanation-content :deep(code) {
  background: #edf2f7;
  color: #e53e3e;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
}

.explanation-content :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}

/* 编程题提示 */
.programming-notice {
  display: flex;
  gap: 24px;
  padding: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  align-items: center;
}

.notice-icon {
  font-size: 64px;
  opacity: 0.9;
}

.notice-content h3 {
  font-size: 20px;
  margin: 0 0 8px 0;
  font-weight: 700;
}

.notice-content p {
  font-size: 15px;
  margin: 0;
  opacity: 0.95;
  line-height: 1.6;
}

/* 底部操作区 */
.action-footer {
  padding: 24px 32px;
  background: #f7fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left,
.footer-right {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 12px 32px;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-btn {
  background: white;
  color: #4a5568;
  border: 1px solid #e2e8f0;
  box-shadow: none;
}

.secondary-btn:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* 响应式 */
@media (max-width: 768px) {
  .top-toolbar {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }

  .question-info {
    flex-wrap: wrap;
    gap: 10px;
  }

  .main-content {
    margin: 16px;
  }

  .question-header,
  .question-description,
  .answer-area {
    padding: 20px;
  }

  .question-title {
    font-size: 20px;
  }

  .judgment-options {
    grid-template-columns: 1fr;
  }

  .action-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .action-btn {
    width: 100%;
  }

  .result-header {
    flex-direction: column;
    text-align: center;
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
