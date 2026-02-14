import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/types'
import TokenManager from '@/utils/tokenManager'
import { getUserProfile } from '@/api/userApi'

export const useUserStore = defineStore('user', () => {
  // 用户信息状态
  const user = ref<User | null>(null)
  // 是否正在初始化
  const isInitializing = ref(false)

  // 登录状态（检查用户信息和 token 是否都存在）
  const isLoggedIn = computed(() => {
    return user.value !== null && TokenManager.hasToken()
  })

  // 从 token 恢复用户信息（页面刷新时调用）
  async function initFromToken() {
    // 如果没有 token，直接返回
    if (!TokenManager.hasToken()) {
      return false
    }

    // 如果已经有用户信息，不需要重新获取
    if (user.value !== null) {
      return true
    }

    // 如果正在初始化，避免重复调用
    if (isInitializing.value) {
      return false
    }

    try {
      isInitializing.value = true

      // 调用接口获取用户信息
      const data = await getUserProfile()

      if (data.success && data.user) {
        user.value = data.user
        return true
      } else {
        // 获取失败，清除 token
        TokenManager.clearToken()
        return false
      }
    } catch (error) {
      console.error('从 token 恢复用户信息失败:', error)
      // 发生错误，清除 token
      TokenManager.clearToken()
      return false
    } finally {
      isInitializing.value = false
    }
  }

  // 登录成功后保存用户信息和 token
  function login(userInfo: User, token: string) {
    user.value = userInfo
    TokenManager.setToken(token)
  }

  // 登出后清除用户信息和 token
  function logout() {
    user.value = null
    TokenManager.clearToken()
  }

  // 更新用户信息
  function updateUserInfo(updates: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...updates }
    }
  }

  // 强制刷新用户信息（用于更新操作后刷新最新数据）
  async function fetchUserInfo() {
    try {
      const data = await getUserProfile()
      if (data.success && data.user) {
        user.value = data.user
        return true
      }
      return false
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return false
    }
  }

  return {
    user,
    isLoggedIn,
    isInitializing,
    initFromToken,
    login,
    logout,
    updateUserInfo,
    fetchUserInfo
  }
})
