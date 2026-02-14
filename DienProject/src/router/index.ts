import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { hasMinRole, type UserRole } from '@/utils/permission'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/home',
      name: 'Home',
      component: () => import('@/pages/home/home.vue'),
      children: [
        {
          path: 'graphical',
          name: 'Graphical',
          component: () => import('@/pages/home/competition_pages/graphical.vue')
        }
        ,
        {
          path: 'robot',
          name: 'Robot',
          component: () => import('@/pages/home/competition_pages/robot.vue')
        }
        ,
        {
          path: 'other',
          name: 'Other',
          component: () => import('@/pages/home/competition_pages/other.vue')
        },
        {
          path: 'programme',
          name: 'Programme',
          component: () => import('@/pages/home/competition_pages/programme.vue')
        },
        {
          path: '/home',
          redirect: '/home/graphical'
        },
      ]
    },
    {
      path: '/users',
      name: 'Users',
      component: () => import('@/components/usersview.vue'),
      meta: { showNavbar: false, requiresAuth: true },
      children: [
        // 新闻信息
        { path: 'news', name: 'UserNews', component: () => import('@/pages/userRouter/user-pages/news.vue') },
        // 奖学金
        { path: 'scholarship', name: 'UserScholarship', component: () => import('@/pages/userRouter/user-pages/scholarship.vue') },
        // 课件资源
        { path: 'courseware/all', name: 'UserCoursewareAll', component: () => import('@/pages/userRouter/user-pages/courseware-all.vue') },
        { path: 'courseware/my', name: 'UserCoursewareMy', component: () => import('@/pages/userRouter/user-pages/courseware-my.vue') },
        // 我的题库
        { path: 'question-bank/questions', name: 'UserQuestionBankQuestions', component: () => import('@/pages/userRouter/user-pages/question-bank-questions.vue') },
        { path: 'question-bank/done', name: 'UserQuestionBankDone', component: () => import('@/pages/userRouter/user-pages/question-bank-done.vue') },
        { path: 'question-solve/:id', name: 'UserQuestionSolve', component: () => import('@/pages/userRouter/user-pages/question-solve.vue') },
        // 测评考试
        { path: 'exam/gesp-cpp', name: 'UserExamGespCpp', component: () => import('@/pages/userRouter/user-pages/exam-gesp-cpp.vue') },
        { path: 'exam/gesp-python', name: 'UserExamGespPython', component: () => import('@/pages/userRouter/user-pages/exam-gesp-python.vue') },
        { path: 'exam/robot-car', name: 'UserExamRobotCar', component: () => import('@/pages/userRouter/user-pages/exam-robot-car.vue') },
        // 个人中心 - 修复：添加占位组件或指向存在的组件
        { path: 'profile/personal', name: 'UserProfilePersonal', component: () => import('@/pages/userRouter/user-pages/profile-personal.vue') },
        { path: 'profile/organization', name: 'UserProfileOrganization', component: () => import('@/pages/userRouter/user-pages/profile-organization.vue') },
        { path: 'profile/school', name: 'UserProfileSchool', component: () => import('@/pages/userRouter/user-pages/profile-school.vue') },
        // 管理员路由
        {
          path: 'admin/news',
          name: 'AdminNews',
          component: () => import('@/pages/userRouter/admin-pages/news-manage.vue'),
          meta: { requiresAuth: true, requiresRole: 'admin' }
        },
        {
          path: 'admin/scholarship',
          name: 'AdminScholarship',
          component: () => import('@/pages/userRouter/admin-pages/scholarship-manage.vue'),
          meta: { requiresAuth: true, requiresRole: 'admin' }
        },
        {
          path: 'admin/scholarship-review',
          name: 'AdminScholarshipReview',
          component: () => import('@/pages/userRouter/admin-pages/scholarship-review.vue'),
          meta: { requiresAuth: true, requiresRole: 'admin' }
        },
        {
          path: 'admin/courseware',
          name: 'AdminCourseware',
          component: () => import('@/pages/userRouter/admin-pages/courseware-manage.vue'),
          meta: { requiresAuth: true, requiresRole: 'admin' }
        },
        {
          path: 'admin/questions',
          name: 'AdminQuestions',
          component: () => import('@/pages/userRouter/admin-pages/questions-manage.vue'),
          meta: { requiresAuth: true, requiresRole: 'admin' }
        },
        {
          path: 'admin/exams',
          name: 'AdminExams',
          component: () => import('@/pages/userRouter/admin-pages/exams-manage.vue'),
          meta: { requiresAuth: true, requiresRole: 'admin' }
        },
        // 超级管理员路由
        {
          path: 'super-admin/users',
          name: 'SuperAdminUsers',
          component: () => import('@/pages/userRouter/admin-pages/users-manage.vue'),
          meta: { requiresAuth: true, requiresRole: 'super_admin' }
        },
        {
          path: 'super-admin/review-center',
          name: 'SuperAdminReviewCenter',
          component: () => import('@/pages/userRouter/admin-pages/review-center.vue'),
          meta: { requiresAuth: true, requiresRole: 'super_admin' }
        },
        // 默认重定向到新闻信息
        { path: '', redirect: '/users/news' }
      ]
    },
    {
      path: '/',
      redirect: '/home'
    },
  ],
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiredRole = to.meta.requiresRole as UserRole | undefined

  // 如果需要鉴权
  if (requiresAuth) {
    // 尝试从 token 初始化用户信息（如果还未初始化）
    if (!userStore.isLoggedIn && !userStore.isInitializing) {
      await userStore.initFromToken()
    }

    // 检查登录状态
    if (!userStore.isLoggedIn) {
      // 如果需要鉴权且未登录，重定向到首页
      next('/home')
      return
    }

    // 检查角色权限
    if (requiredRole && !hasMinRole(userStore.user, requiredRole)) {
      // 权限不足，重定向到新闻页面
      console.warn(`权限不足: 需要${requiredRole}角色，当前角色为${userStore.user?.role}`)
      next('/users/news')
      return
    }

    // 登录状态有效且权限足够，允许访问
    next()
  } else {
    // 不需要鉴权的页面，直接通过
    next()
  }
})

export default router