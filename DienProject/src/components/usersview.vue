<template>
  <div class="users-view-container">
    <!-- 用户页面导航栏 -->
    <div class="user-navbar">
      <div class="navbar-content">
        <div class="navbar-left">
          <!-- Logo -->
          <div class="logo">
            <span class="logo-icon">🏠</span>
            <span class="logo-text">用户中心</span>
          </div>
          <!-- 菜单按钮，用于显示/隐藏左侧导航栏 -->
          <button class="menu-toggle-btn" @click="toggleSidebar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <div class="navbar-right">
          <!-- 角色徽章 -->
          <div class="role-badge" :style="{
            background: roleDisplay.color,
            boxShadow: `0 0 20px ${roleDisplay.color}40`
          }">
            <span class="role-icon">{{ roleDisplay.icon }}</span>
            <span class="role-text">{{ roleDisplay.text }}</span>
          </div>

          <!-- 认证标识 -->
          <div v-if="certificationBadge" class="certification-badge" :title="certificationBadge.title">
            <span class="cert-icon">{{ certificationBadge.icon }}</span>
            <span class="cert-text">{{ certificationBadge.text }}</span>
          </div>

          <div class="user-info" @click="goToProfile">
            <div class="user-avatar">
              <img v-if="avatarUrl" :src="avatarUrl" alt="头像" />
              <span v-else class="avatar-text">{{ userInitial }}</span>
            </div>
            <div class="user-details">
              <div class="user-name">{{ userStore.user?.nickname || userStore.user?.name }}</div>
              <div class="user-email">{{ userStore.user?.email || userStore.user?.phone || userStore.user?.account }}
              </div>
            </div>
          </div>
          <button class="logout-btn" @click="handleLogout">登出</button>
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧手风琴导航栏 -->
      <div class="sidebar" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <div class="accordion-menu">
          <!-- 使用v-for循环生成手风琴项 -->
          <div v-for="item in menuItems" :key="item.id" class="accordion-item">
            <div
              class="accordion-header"
              :class="{
                'no-children': !item.children || item.children.length === 0,
                'active': (!item.children || item.children.length === 0) && item.path && $route.path === item.path
              }"
              @click="toggleAccordion(item.id, item.children && item.children.length > 0, item.path || undefined)"
            >
              <span class="item-icon">{{ item.icon }}</span>
              <span class="item-title">{{ item.name }}</span>
              <!-- 只在有子菜单时显示展开图标 -->
              <span
                v-if="item.children && item.children.length > 0"
                class="toggle-icon"
                :class="{ 'toggle-open': activeAccordion === item.id }"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </span>
            </div>
            <!-- 只在有子菜单时显示内容区域 -->
            <div
              v-if="item.children && item.children.length > 0"
              class="accordion-content"
              :class="{ 'content-open': activeAccordion === item.id }"
            >
              <!-- 使用v-for循环生成子导航项 -->
              <router-link v-for="child in item.children" :key="child.id" :to="child.path" class="sub-item"
                :class="{ active: $route.path === child.path }">
                <span class="sub-item-icon">{{ child.icon }}</span>
                <span class="sub-item-title">{{ child.name }}</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容区域 -->
      <div class="content-area" :class="{ 'content-expanded': isSidebarCollapsed }">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getRoleDisplay, hasMinRole, isAdmin, isSuperAdmin, type UserRole } from '@/utils/permission'
import { getAvatarUrl } from '@/utils/apiConfig'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 响应式状态 - 控制左侧导航栏是否折叠
const isSidebarCollapsed = ref(false)

// 响应式状态 - 当前展开的手风琴类别
const activeAccordion = ref<string | null>(null)

// 计算头像URL
const avatarUrl = computed(() => {
  return getAvatarUrl(userStore.user?.avatar)
})

// 计算用户名首字母用于头像显示
const userInitial = computed(() => {
  const displayName = userStore.user?.nickname || userStore.user?.name
  if (!displayName) return '用'
  return displayName.charAt(0).toUpperCase()
})

// 跳转到个人中心
const goToProfile = () => {
  router.push('/users/profile/personal')
}

// 计算角色显示配置
const roleDisplay = computed(() => {
  if (!userStore.user?.role) return getRoleDisplay('user')
  return getRoleDisplay(userStore.user.role as UserRole)
})

// 计算认证标识
const certificationBadge = computed(() => {
  if (!userStore.user) return null

  const { organization, school } = userStore.user

  // 优先显示机构认证（如果两者都有）
  if (organization && typeof organization === 'object' && organization.name) {
    return {
      icon: '🏢',
      text: '机构认证',
      title: `已认证机构：${organization.name}`
    }
  }

  if (school && typeof school === 'object' && school.name) {
    return {
      icon: '🏫',
      text: '学校认证',
      title: `已认证学校：${school.name}`
    }
  }

  return null
})

// 初始化用户信息
const initUser = async () => {
  try {
    await userStore.initFromToken()
  } catch (error) {
    console.error('初始化用户信息失败:', error)
  }
}

// 组件挂载时初始化用户信息
onMounted(() => {
  initUser()
})

// 切换左侧导航栏的显示/隐藏状态
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// 切换手风琴类别的展开/折叠状态
const toggleAccordion = (category: string, hasChildren: boolean = true, path?: string) => {
  // 如果该导航项没有子菜单且有路径，则直接跳转
  if (!hasChildren && path) {
    router.push(path)
    return
  }

  if (activeAccordion.value === category) {
    // 如果点击的是当前展开的类别，则折叠它
    activeAccordion.value = null
  } else {
    // 否则展开点击的类别
    activeAccordion.value = category
  }
}

// 处理登出功能
const handleLogout = () => {
  // 清除用户状态
  userStore.logout()
  // 跳转到首页
  router.replace('/home')
}

// 监听路由变化，自动展开对应的手风琴类别
watch(
  () => route.path,
  (newPath) => {
    // 根据路由路径自动展开对应的导航栏
    if (newPath.includes('/users/courseware')) {
      activeAccordion.value = 'courseware'
    } else if (newPath.includes('/users/question-bank')) {
      activeAccordion.value = 'question-bank'
    } else if (newPath.includes('/users/exam')) {
      activeAccordion.value = 'exam'
    } else if (newPath.includes('/users/profile')) {
      activeAccordion.value = 'profile'
    } else if (newPath.includes('/users/admin')) {
      activeAccordion.value = 'admin'
    } else if (newPath.includes('/users/super-admin')) {
      activeAccordion.value = 'super-admin'
    }
  },
  { immediate: true } // 初始化时也执行一次
)

// 导航菜单数据结构 - 使用computed实现动态过滤
const menuItems = computed(() => {
  const user = userStore.user

  // 基础菜单项
  const baseItems = [
    // 新闻信息（无下拉子导航）
    {
      id: 'news',
      name: '新闻资讯',
      icon: '📰',
      path: '/users/news',
      children: [],
      requiredRole: 'user' as UserRole
    },
    // 奖学金（无下拉子导航）
    {
      id: 'scholarship',
      name: '英才激励奖金计划',
      icon: '🏆',
      path: '/users/scholarship',
      children: [],
      requiredRole: 'user' as UserRole
    },
    // 课件资源
    {
      id: 'courseware',
      name: '课件资源',
      icon: '📚',
      path: undefined,
      requiredRole: 'user' as UserRole,
      children: [
        { id: 'all-courseware', name: '全部课件', icon: '📖', path: '/users/courseware/all', requiredRole: 'user' as UserRole },
        { id: 'my-courseware', name: '我的课件', icon: '⭐', path: '/users/courseware/my', requiredRole: 'verified' as UserRole }
      ]
    },
    // 我的题库
    {
      id: 'question-bank',
      name: '题库资源',
      icon: '📝',
      path: undefined,
      requiredRole: 'user' as UserRole,
      children: [
        { id: 'questions', name: '题单/题目', icon: '📋', path: '/users/question-bank/questions', requiredRole: 'user' as UserRole },
        { id: 'done-questions', name: '已做题目', icon: '✅', path: '/users/question-bank/done', requiredRole: 'user' as UserRole }
      ]
    },
    // 测评考试
    {
      id: 'exam',
      name: '测评考试',
      icon: '🎯',
      path: undefined,
      requiredRole: 'user' as UserRole,
      children: [
        { id: 'gesp-cpp', name: 'GESPC++', icon: '💻', path: '/users/exam/gesp-cpp', requiredRole: 'user' as UserRole },
        { id: 'gesp-python', name: 'GESPpython', icon: '🐍', path: '/users/exam/gesp-python', requiredRole: 'user' as UserRole },
        { id: 'robot-car', name: '机器人大车', icon: '🤖', path: '/users/exam/robot-car', requiredRole: 'user' as UserRole }
      ]
    },
    // 个人中心
    {
      id: 'profile',
      name: '个人中心',
      icon: '👤',
      path: undefined,
      requiredRole: 'user' as UserRole,
      children: [
        { id: 'personal-info', name: '个人信息', icon: '📇', path: '/users/profile/personal', requiredRole: 'user' as UserRole },
        { id: 'org-info', name: '机构信息', icon: '🏢', path: '/users/profile/organization', requiredRole: 'user' as UserRole },
        { id: 'school-info', name: '学校信息', icon: '🏫', path: '/users/profile/school', requiredRole: 'user' as UserRole }
      ]
    }
  ]

  // 管理员菜单项
  const adminItems = [
    {
      id: 'admin',
      name: '资源管理',
      icon: '⚙️',
      path: undefined,
      requiredRole: 'admin' as UserRole,
      children: [
        { id: 'manage-news', name: '新闻管理', icon: '📰', path: '/users/admin/news', requiredRole: 'admin' as UserRole },
        { id: 'manage-scholarship', name: '奖学金管理', icon: '🏆', path: '/users/admin/scholarship', requiredRole: 'admin' as UserRole },
        { id: 'scholarship-review', name: '奖学金审核', icon: '✓', path: '/users/admin/scholarship-review', requiredRole: 'admin' as UserRole },
        { id: 'manage-courseware', name: '课件管理', icon: '📚', path: '/users/admin/courseware', requiredRole: 'admin' as UserRole },
        { id: 'manage-questions', name: '题库管理', icon: '📝', path: '/users/admin/questions', requiredRole: 'admin' as UserRole },
        { id: 'manage-exams', name: '考试管理', icon: '🎯', path: '/users/admin/exams', requiredRole: 'admin' as UserRole }
      ]
    }
  ]

  // 超级管理员菜单项
  const superAdminItems = [
    {
      id: 'super-admin',
      name: '超级管理',
      icon: '👑',
      path: undefined,
      requiredRole: 'super_admin' as UserRole,
      children: [
        { id: 'manage-users', name: '用户管理', icon: '👥', path: '/users/super-admin/users', requiredRole: 'super_admin' as UserRole },
        { id: 'review-center', name: '审核中心', icon: '✓', path: '/users/super-admin/review-center', requiredRole: 'super_admin' as UserRole }
      ]
    }
  ]

  // 合并所有菜单项
  let allItems = [...baseItems]
  if (isAdmin(user)) {
    allItems.push(...adminItems)
  }
  if (isSuperAdmin(user)) {
    allItems.push(...superAdminItems)
  }

  // 过滤菜单项：根据用户角色过滤
  return allItems
    .filter(item => hasMinRole(user, item.requiredRole))
    .map(item => ({
      ...item,
      children: item.children?.filter(child => hasMinRole(user, child.requiredRole)) || []
    }))
})
</script>

<script lang="ts">
export default {
  name: 'UsersView'
}

</script>

<style scoped>
/* 用户页面导航栏样式 */
.user-navbar {
  background: linear-gradient(90deg, #4CAF50, #45a049);
  color: white;
  padding: 15px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
}

/* Logo样式 */
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: white;
  transition: all 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-icon {
  font-size: 24px;
}

/* 菜单按钮样式 */
.menu-toggle-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.menu-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.user-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 角色徽章样式 */
.role-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-weight: 700;
  font-size: 14px;
  animation: pulse 2s ease-in-out infinite;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.role-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px currentColor !important;
}

.role-icon {
  font-size: 18px;
}

.role-text {
  font-weight: 700;
}

/* 认证标识样式 */
.certification-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  font-size: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  cursor: pointer;
}

.certification-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.4);
}

.cert-icon {
  font-size: 16px;
}

.cert-text {
  font-weight: 600;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* 用户信息样式 */
.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;
  cursor: pointer;
}

.user-avatar:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
}

.user-email {
  font-size: 12px;
  opacity: 0.9;
}

/* 登出按钮样式 */
.logout-btn {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* 主内容区域样式 */
.main-content {
  display: flex;
  min-height: 100vh;
  padding-top: 70px;
  /* 为顶部导航栏留出空间 */
}

/* 左侧边栏样式 */
.sidebar {
  width: 280px;
  background: #f7fafc;
  box-shadow: 2px 0 15px rgba(0, 0, 0, 0.08);
  position: fixed;
  top: 70px;
  /* 与顶部导航栏底部对齐 */
  left: 0;
  bottom: 0;
  overflow-y: auto;
  transition: all 0.3s ease;
  z-index: 99;
  border-right: 1px solid #e2e8f0;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏滚动条 - Webkit浏览器 */
.sidebar::-webkit-scrollbar {
  display: none;
}

/* 侧边栏折叠状态 */
.sidebar-collapsed {
  width: 0;
  overflow: hidden;
}

/* 手风琴菜单样式 */
.accordion-menu {
  padding: 10px 5px;
}

/* 手风琴项样式 */
.accordion-item {
  margin-bottom: 8px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}

/* 手风琴头部样式 */
.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  cursor: pointer;
  background: #ffffff;
  border-left: 4px solid transparent;
  transition: all 0.3s ease;
  font-weight: 600;
  color: #2d3748;
}

.accordion-header:hover {
  background: #edf2f7;
  border-left-color: #4299e1;
  transform: translateX(2px);
}

.accordion-header.active {
  background: #ebf8ff;
  border-left-color: #3182ce;
  color: #2b6cb0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

/* 无子菜单的导航项样式 */
.accordion-header.no-children {
  cursor: pointer;
}

.accordion-header.no-children:hover {
  background: #e6fffa;
}

.item-icon {
  margin-right: 10px;
  font-size: 18px;
}

/* 手风琴切换图标样式 */
.toggle-icon {
  transition: transform 0.3s ease;
}

.toggle-open {
  transform: rotate(180deg);
}

/* 手风琴内容样式 */
.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  background: #ffffff;
}

.content-open {
  max-height: 500px;
  /* 足够容纳所有子项的高度 */
}

/* 子导航项样式 */
.sub-item {
  display: flex;
  align-items: center;
  padding: 12px 20px 12px 50px;
  color: #4a5568;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.sub-item:hover {
  background: #f7fafc;
  color: #3182ce;
  padding-left: 53px;
}

.sub-item.active {
  background: #e6fffa;
  color: #2b6cb0;
  border-left-color: #38b2ac;
  font-weight: 600;
  padding-left: 53px;
}

.sub-item-icon {
  margin-right: 10px;
  font-size: 16px;
}

/* 右侧内容区域样式 */
.content-area {
  flex: 1;
  margin-left: 280px;
  /* 与左侧边栏宽度一致 */
  padding: 20px;
  transition: all 0.3s ease;
  background: #fafafa;
}

/* 内容区域展开状态（侧边栏折叠时） */
.content-expanded {
  margin-left: 0;
}

/* 用户页面样式 */
.user-page {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.user-page h3 {
  color: #333;
  margin-bottom: 15px;
}

.user-page p {
  color: #666;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar-content {
    padding: 0 15px;
  }

  .logo-text {
    display: none;
  }

  .user-details {
    display: none;
  }

  .logout-btn {
    padding: 6px 15px;
    font-size: 13px;
  }

  .sidebar {
    width: 100%;
    transform: translateX(-100%);
  }

  .sidebar:not(.sidebar-collapsed) {
    transform: translateX(0);
  }

  .content-area {
    margin-left: 0;
  }
}
</style>