<template>
  <div class="competition">
    <!-- 自定义粘性导航 -->
    <div class="competition-nav-container">
      <div class="competition-nav-wrapper">
        <nav class="competition-nav">
          <router-link v-for="(item, index) in navItems" :key="index" :to="item.path"
            :class="['nav-item', { active: activeIndex === index }]" @click="activeIndex = index">
            <span class="nav-text">{{ item.text }}</span>
          </router-link>
        </nav>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="competition-content">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, RouterLink } from 'vue-router'

const activeIndex = ref(0)
const navItems = ref([
  { path: '/home/graphical', text: '图形化' },
  { path: '/home/robot', text: '机器人' },
  { path: '/home/programme', text: 'GESP' },
  { path: '/home/other', text: '其他' }])

</script>

<script lang="ts">
export default {
  name: 'Competition'
}
</script>

<style scoped>
.competition {
  background-color: #f8f9fa;
  padding-bottom: 60px;
}

/* 粘性导航容器 */
.competition-nav-container {
  position: sticky;
  top: 85.5px;
  z-index: 1000;
  background: rgba(248, 249, 250, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.competition-nav-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 自定义导航栏 */
.competition-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 0;
  flex-wrap: wrap;
}

/* 导航项 */
.nav-item {
  position: relative;
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: #7f8c8d;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 10px;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #3498db, #9b59b6);
  transform: scaleX(0);
  transition: transform 0.3s ease;
  border-radius: 3px;
}

.nav-item:hover {
  color: #2c3e50;
  background: rgba(52, 152, 219, 0.1);
  transform: translateY(-2px);
}

.nav-item:hover::before {
  transform: scaleX(1);
}

/* 激活状态 */
.nav-item.active {
  color: #3498db;
  background: rgba(52, 152, 219, 0.15);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.nav-item.active::before {
  transform: scaleX(1);
  opacity: 1;
}

/* 内容区域 */
.competition-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 0;
  width: 90%;
  height: 600px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .competition-nav {
    gap: 8px;
    padding: 15px 0;
  }

  .nav-item {
    padding: 10px 20px;
    font-size: 1rem;
  }

  .competition-content {
    padding: 30px 15px 0;
  }
}

@media (max-width: 576px) {
  .competition-nav {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .nav-item {
    text-align: center;
  }

  .competition-nav-container {
    position: static;
    box-shadow: none;
    border-bottom: none;
  }
}
</style>