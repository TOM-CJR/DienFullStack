<template>
  <div class="exam-robot-car-page">
    <div class="page-header">
      <h2>机器人大车</h2>
      <p>机器人大车竞赛测评</p>
    </div>

    <!-- 考试信息卡片 -->
    <div class="exam-info-card">
      <div class="info-header">
        <h3>竞赛概况</h3>
        <span class="exam-status status-upcoming">即将开始</span>
      </div>
      <div class="info-content">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">竞赛时间：</span>
            <span class="info-value">2024年8月10日 9:00-17:00</span>
          </div>
          <div class="info-item">
            <span class="info-label">竞赛地点：</span>
            <span class="info-value">北京市海淀区科技中心</span>
          </div>
          <div class="info-item">
            <span class="info-label">竞赛时长：</span>
            <span class="info-value">8小时</span>
          </div>
          <div class="info-item">
            <span class="info-label">竞赛形式：</span>
            <span class="info-value">现场竞赛</span>
          </div>
          <div class="info-item">
            <span class="info-label">竞赛费用：</span>
            <span class="info-value">¥300</span>
          </div>
          <div class="info-item">
            <span class="info-label">报名截止：</span>
            <span class="info-value">2024年7月20日</span>
          </div>
        </div>
        <div class="exam-description">
          <h4>竞赛简介</h4>
          <p>机器人大车竞赛是面向青少年的科技创新实践活动，旨在培养学生的动手能力、编程能力和创新思维。竞赛要求参赛选手设计、制作并编程控制机器人完成指定任务，包括循迹、避障、抓取物品等挑战。</p>
        </div>
      </div>
      <div class="info-footer">
        <button class="register-btn" @click="handleRegister">立即报名</button>
        <button class="detail-btn" @click="handleViewDetails">查看详情</button>
      </div>
    </div>

    <!-- 竞赛规则 -->
    <div class="exam-syllabus-card">
      <h3 class="card-title">竞赛规则</h3>
      <div class="syllabus-content">
        <div class="syllabus-section">
          <h4>参赛要求</h4>
          <ul class="syllabus-list">
            <li>参赛对象：中小学生（分为小学组、初中组、高中组）</li>
            <li>参赛形式：个人或团队（最多3人）</li>
            <li>器材要求：使用指定的机器人套件，允许自主设计结构</li>
            <li>编程要求：可使用图形化编程或文本编程</li>
          </ul>
        </div>
        <div class="syllabus-section">
          <h4>竞赛任务</h4>
          <ul class="syllabus-list">
            <li>任务一：循迹行驶（沿指定线路行驶）</li>
            <li>任务二：避障挑战（避开障碍物到达目标点）</li>
            <li>任务三：物品抓取（抓取并放置指定物品）</li>
            <li>任务四：创意挑战（自主设计的创意任务）</li>
          </ul>
        </div>
        <div class="syllabus-section">
          <h4>评分标准</h4>
          <ul class="syllabus-list">
            <li>任务完成度（60%）</li>
            <li>机器人设计（20%）</li>
            <li>编程实现（15%）</li>
            <li>创意创新（5%）</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 历年真题 -->
    <div class="past-exams-card">
      <h3 class="card-title">历年竞赛题目</h3>
      <div class="past-exams-list">
        <div v-for="exam in pastExams" :key="exam.id" class="past-exam-item">
          <div class="exam-header">
            <h4 class="exam-name">{{ exam.name }}</h4>
            <span class="exam-date">{{ exam.date }}</span>
          </div>
          <p class="exam-description">{{ exam.description }}</p>
          <div class="exam-actions">
            <button class="download-btn" @click="handleDownloadExam(exam.id)">下载题目</button>
            <button class="answer-btn" @click="handleViewAnswers(exam.id)">查看优秀方案</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 备考资源 -->
    <div class="study-resources-card">
      <h3 class="card-title">备赛资源</h3>
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

// 历年竞赛题目类型
interface PastExam {
  id: number
  name: string
  date: string
  description: string
}

// 备赛资源类型
interface StudyResource {
  id: number
  name: string
  description: string
  icon: string
}

// 模拟历年竞赛题目数据
const pastExams = ref<PastExam[]>([
  {
    id: 1,
    name: '2023年机器人大车竞赛题目',
    date: '2023-08-12',
    description: '包含循迹、避障、物品抓取三个任务，要求机器人在规定时间内完成所有任务。'
  },
  {
    id: 2,
    name: '2022年机器人大车竞赛题目',
    date: '2022-08-13',
    description: '包含循迹、迷宫导航、物品分类三个任务，增加了任务难度和创意要求。'
  },
  {
    id: 3,
    name: '2021年机器人大车竞赛题目',
    date: '2021-08-14',
    description: '包含基础循迹、避障和简单抓取任务，适合初学者参与。'
  }
])

// 模拟备赛资源数据
const studyResources = ref<StudyResource[]>([
  {
    id: 1,
    name: '机器人基础教程',
    description: '介绍机器人的基本组成和工作原理，包含机械结构设计和电子电路基础知识。',
    icon: '🤖'
  },
  {
    id: 2,
    name: '机器人编程指南',
    description: '详细讲解机器人编程方法，包括图形化编程和文本编程的使用技巧。',
    icon: '💻'
  },
  {
    id: 3,
    name: '竞赛经验分享',
    description: '历届获奖选手的经验分享和技巧总结，帮助新手快速入门。',
    icon: '🎯'
  },
  {
    id: 4,
    name: '机器人模拟器',
    description: '在线机器人模拟器，可在电脑上进行编程和模拟测试。',
    icon: '🔧'
  }
])

// 处理报名
const handleRegister = (): void => {
  // 这里可以添加报名逻辑
  console.log('报名机器人大车竞赛')
}

// 处理查看详情
const handleViewDetails = (): void => {
  // 这里可以添加查看详情逻辑
  console.log('查看机器人大车竞赛详情')
}

// 处理下载题目
const handleDownloadExam = (examId: number): void => {
  // 这里可以添加下载题目逻辑
  console.log('下载题目:', examId)
}

// 处理查看优秀方案
const handleViewAnswers = (examId: number): void => {
  // 这里可以添加查看优秀方案逻辑
  console.log('查看优秀方案:', examId)
}

// 处理访问资源
const handleAccessResource = (resourceId: number): void => {
  // 这里可以添加访问资源逻辑
  console.log('访问资源:', resourceId)
}
</script>

<style scoped>
.exam-robot-car-page {
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