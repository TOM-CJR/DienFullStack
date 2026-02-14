<template>
  <div class="exam-gesp-python-page">
    <div class="page-header">
      <h2>GESP Python</h2>
      <p>计算机等级考试 Python 科目测评</p>
    </div>

    <!-- 考试信息卡片 -->
    <div class="exam-info-card">
      <div class="info-header">
        <h3>考试概况</h3>
        <span class="exam-status status-upcoming">即将开始</span>
      </div>
      <div class="info-content">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">考试时间：</span>
            <span class="info-value">2024年7月20日 10:00-12:00</span>
          </div>
          <div class="info-item">
            <span class="info-label">考试地点：</span>
            <span class="info-value">线上考试</span>
          </div>
          <div class="info-item">
            <span class="info-label">考试时长：</span>
            <span class="info-value">120分钟</span>
          </div>
          <div class="info-item">
            <span class="info-label">考试形式：</span>
            <span class="info-value">闭卷考试</span>
          </div>
          <div class="info-item">
            <span class="info-label">考试费用：</span>
            <span class="info-value">¥150</span>
          </div>
          <div class="info-item">
            <span class="info-label">报名截止：</span>
            <span class="info-value">2024年7月10日</span>
          </div>
        </div>
        <div class="exam-description">
          <h4>考试简介</h4>
          <p>GESP (General Software Engineering Proficiency) 是面向青少年的计算机软件能力等级认证考试，Python 科目主要测试考生的 Python 编程基础、算法思维和问题解决能力。考试内容包括语法基础、数据结构、算法设计等方面。</p>
        </div>
      </div>
      <div class="info-footer">
        <button class="register-btn" @click="handleRegister">立即报名</button>
        <button class="detail-btn" @click="handleViewDetails">查看详情</button>
      </div>
    </div>

    <!-- 考试大纲 -->
    <div class="exam-syllabus-card">
      <h3 class="card-title">考试大纲</h3>
      <div class="syllabus-content">
        <div class="syllabus-section">
          <h4>一级大纲</h4>
          <ul class="syllabus-list">
            <li>计算机基础知识</li>
            <li>Python 语言基础语法</li>
            <li>基本数据类型和运算符</li>
            <li>简单程序结构（顺序、分支、循环）</li>
            <li>简单输入输出</li>
          </ul>
        </div>
        <div class="syllabus-section">
          <h4>二级大纲</h4>
          <ul class="syllabus-list">
            <li>函数与递归</li>
            <li>列表、元组、字典</li>
            <li>字符串操作</li>
            <li>文件操作基础</li>
            <li>模块与包</li>
          </ul>
        </div>
        <div class="syllabus-section">
          <h4>三级及以上</h4>
          <ul class="syllabus-list">
            <li>面向对象编程</li>
            <li>高级数据结构</li>
            <li>算法设计与分析</li>
            <li>网络编程基础</li>
            <li>复杂问题解决</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 历年真题 -->
    <div class="past-exams-card">
      <h3 class="card-title">历年真题</h3>
      <div class="past-exams-list">
        <div v-for="exam in pastExams" :key="exam.id" class="past-exam-item">
          <div class="exam-header">
            <h4 class="exam-name">{{ exam.name }}</h4>
            <span class="exam-date">{{ exam.date }}</span>
          </div>
          <p class="exam-description">{{ exam.description }}</p>
          <div class="exam-actions">
            <button class="download-btn" @click="handleDownloadExam(exam.id)">下载真题</button>
            <button class="answer-btn" @click="handleViewAnswers(exam.id)">查看答案</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 备考资源 -->
    <div class="study-resources-card">
      <h3 class="card-title">备考资源</h3>
      <div class="resources-grid">
        <div v-for="resource in studyResources" :key="resource.id" class="resource-item">
          <div class="resource-icon">{{ resource.icon }}</div>
          <h4 class="resource-name">{{ resource.name }}</h4>
          <p class="resource-description">{{ resource.description }}</p>
          <button class="access-btn" @click="handleAccessResource(resource.id)">访问资源</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 历年真题类型
interface PastExam {
  id: number
  name: string
  date: string
  description: string
}

// 备考资源类型
interface StudyResource {
  id: number
  name: string
  description: string
  icon: string
}

// 模拟历年真题数据
const pastExams = ref<PastExam[]>([
  {
    id: 1,
    name: '2024年春季 GESP Python 一级真题',
    date: '2024-04-15',
    description: '包含 20 道选择题和 5 道编程题，覆盖一级考试全部知识点。'
  },
  {
    id: 2,
    name: '2024年春季 GESP Python 二级真题',
    date: '2024-04-15',
    description: '包含 20 道选择题和 4 道编程题，覆盖二级考试全部知识点。'
  },
  {
    id: 3,
    name: '2023年秋季 GESP Python 一级真题',
    date: '2023-11-18',
    description: '包含 20 道选择题和 5 道编程题，覆盖一级考试全部知识点。'
  },
  {
    id: 4,
    name: '2023年秋季 GESP Python 二级真题',
    date: '2023-11-18',
    description: '包含 20 道选择题和 4 道编程题，覆盖二级考试全部知识点。'
  }
])

// 模拟备考资源数据
const studyResources = ref<StudyResource[]>([
  {
    id: 1,
    name: 'Python 基础教程',
    description: '适合初学者的 Python 编程语言基础教程，包含详细的语法讲解和示例代码。',
    icon: '📚'
  },
  {
    id: 2,
    name: 'Python 算法入门',
    description: '介绍常见算法的 Python 实现方法，帮助考生掌握算法思维。',
    icon: '🧠'
  },
  {
    id: 3,
    name: 'Python 模拟考试系统',
    description: '在线模拟考试系统，提供真实的考试环境和评分机制。',
    icon: '💻'
  },
  {
    id: 4,
    name: 'Python 知识点思维导图',
    description: 'Python 考试知识点思维导图，帮助考生系统梳理知识点。',
    icon: '🔍'
  }
])

// 处理报名
const handleRegister = (): void => {
  // 这里可以添加报名逻辑
  console.log('报名 GESP Python 考试')
}

// 处理查看详情
const handleViewDetails = (): void => {
  // 这里可以添加查看详情逻辑
  console.log('查看 GESP Python 考试详情')
}

// 处理下载真题
const handleDownloadExam = (examId: number): void => {
  // 这里可以添加下载真题逻辑
  console.log('下载真题:', examId)
}

// 处理查看答案
const handleViewAnswers = (examId: number): void => {
  // 这里可以添加查看答案逻辑
  console.log('查看答案:', examId)
}

// 处理访问资源
const handleAccessResource = (resourceId: number): void => {
  // 这里可以添加访问资源逻辑
  console.log('访问资源:', resourceId)
}
</script>

<style scoped>
.exam-gesp-python-page {
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

/* 考试信息卡片 */
.exam-info-card {
  background: #f7fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e2e8f0;
}

.info-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.exam-status {
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 14px;
  font-weight: 600;
}

.status-upcoming {
  background: #ebf8ff;
  color: #2b6cb0;
}

.info-content {
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 14px;
  font-weight: 600;
  color: #718096;
}

.info-value {
  font-size: 14px;
  color: #4a5568;
}

.exam-description {
  background: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.exam-description h4 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 10px 0;
}

.exam-description p {
  font-size: 14px;
  line-height: 1.6;
  color: #4a5568;
  margin: 0;
}

.info-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.register-btn,
.detail-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.register-btn {
  background: #38a169;
  color: white;
}

.register-btn:hover {
  background: #2f855a;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.detail-btn {
  background: #4299e1;
  color: white;
}

.detail-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 考试大纲卡片 */
.exam-syllabus-card {
  background: #f7fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
}

.syllabus-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.syllabus-section {
  background: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.syllabus-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 10px 0;
}

.syllabus-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.syllabus-list li {
  font-size: 14px;
  line-height: 1.6;
  color: #4a5568;
  margin-bottom: 8px;
  position: relative;
  padding-left: 18px;
}

.syllabus-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #4299e1;
  font-weight: bold;
}

/* 历年真题卡片 */
.past-exams-card {
  background: #f7fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.past-exams-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.past-exam-item {
  background: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.past-exam-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.exam-name {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.exam-date {
  font-size: 12px;
  color: #718096;
  background: #f7fafc;
  padding: 4px 10px;
  border-radius: 12px;
}

.past-exam-item .exam-description {
  font-size: 14px;
  line-height: 1.5;
  color: #4a5568;
  margin: 0 0 15px 0;
}

.exam-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.download-btn,
.answer-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.download-btn {
  background: #4299e1;
  color: white;
}

.download-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
}

.answer-btn {
  background: #a0aec0;
  color: white;
}

.answer-btn:hover {
  background: #718096;
  transform: translateY(-1px);
}

/* 备考资源卡片 */
.study-resources-card {
  background: #f7fafc;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.resource-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: all 0.3s ease;
}

.resource-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
}

.resource-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.resource-name {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 10px 0;
}

.resource-description {
  font-size: 14px;
  line-height: 1.5;
  color: #4a5568;
  margin: 0 0 15px 0;
}

.access-btn {
  padding: 8px 16px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.access-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .info-footer {
    flex-direction: column;
  }
  
  .register-btn,
  .detail-btn {
    width: 100%;
  }
  
  .syllabus-content {
    grid-template-columns: 1fr;
  }
  
  .resources-grid {
    grid-template-columns: 1fr;
  }
}
</style>