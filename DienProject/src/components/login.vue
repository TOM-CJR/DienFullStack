<template>
  <div v-if="isVisible" class="login-modal-overlay" @click="closeModal">
    <div class="login-modal" @click.stop>
      <!-- 背景SVG动画 -->
      <div class="modal-background">
        <svg class="svg-bg" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <!-- 定义渐变效果 -->
          <defs>
            <!-- 线性渐变从左上角(0%,0%)到右下角(100%,100%) -->
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <!-- 渐变起始色：蓝色，透明度30% -->
              <stop offset="0%" :style="{ stopColor: '#3498db', stopOpacity: 0.3 }" />
              <!-- 渐变结束色：紫色，透明度30% -->
              <stop offset="100%" :style="{ stopColor: '#9b59b6', stopOpacity: 0.3 }" />
            </linearGradient>
          </defs>

          <!-- 第一个圆形：水平移动动画 -->
          <circle cx="100" cy="100" r="80" fill="url(#gradient)">
            <!-- cx属性动画：从100→300→100，持续15秒，无限循环 -->
            <animate attributeName="cx" values="100; 300; 100" dur="15s" repeatCount="indefinite" />
            <!-- cy属性保持不变 -->
            <animate attributeName="cy" values="100; 100; 100" dur="10s" repeatCount="indefinite" />
          </circle>

          <!-- 第二个圆形：反向水平移动动画 -->
          <circle cx="300" cy="300" r="60" fill="url(#gradient)">
            <!-- cx属性动画：从300→100→300，持续12秒，无限循环 -->
            <animate attributeName="cx" values="300; 100; 300" dur="12s" repeatCount="indefinite" />
            <!-- cy属性保持不变 -->
            <animate attributeName="cy" values="300; 300; 300" dur="15s" repeatCount="indefinite" />
          </circle>

          <!-- 第三个圆形：垂直移动动画 -->
          <circle cx="200" cy="200" r="40" fill="url(#gradient)">
            <!-- cx属性保持不变 -->
            <animate attributeName="cx" values="200; 200; 200" dur="20s" repeatCount="indefinite" />
            <!-- cy属性动画：从200→100→300，持续18秒，无限循环 -->
            <animate attributeName="cy" values="200; 100; 300" dur="18s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <!-- 选项卡导航 -->
      <div class="tab-nav">
        <button :class="['tab-btn', { active: activeTab === 'login' }]" @click="activeTab = 'login'">
          登录
        </button>
        <button :class="['tab-btn', { active: activeTab === 'register' }]" @click="activeTab = 'register'">
          注册
        </button>
      </div>

      <!-- 表单内容 -->
      <div class="form-container">
        <!-- 登录表单 -->
        <div v-if="activeTab === 'login'" class="form-content">
          <h2 class="form-title">登录账户</h2>
          <!-- 登录表单 禁用默认行为 使用自定义方法 -->
          <form @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="login-account" class="form-label">邮箱/手机号</label>
              <input type="text" id="login-account" v-model="loginForm.account" class="form-input"
                placeholder="请输入邮箱或手机号" required />
              <div v-if="loginForm.error" class="error-text">
                {{ loginForm.error }}
              </div>
            </div>

            <div class="form-group">
              <label for="login-password" class="form-label">密码</label>
              <input type="password" id="login-password" v-model="loginForm.password" class="form-input"
                placeholder="请输入密码" required />
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="loginForm.remember" class="form-checkbox" />
                记住我
              </label>
              <a href="#" class="forgot-link">忘记密码?</a>
            </div>

            <button type="submit" class="submit-btn">登录</button>
          </form>
        </div>

        <!-- 注册表单 -->
        <div v-if="activeTab === 'register'" class="form-content">
          <h2 class="form-title">创建账户</h2>
          <form @submit.prevent="handleRegister">
            <div class="form-group">
              <label for="register-name" class="form-label">用户名</label>
              <input type="text" id="register-name" v-model="registerForm.name" class="form-input" placeholder="请输入用户名"
                required />
            </div>

            <div class="form-group">
              <label for="register-account" class="form-label">邮箱/手机号</label>
              <input type="text" id="register-account" v-model="registerForm.account" class="form-input"
                placeholder="请输入邮箱或手机号" required />
              <div v-if="registerForm.error" class="error-text">
                {{ registerForm.error }}
              </div>
            </div>

            <div class="form-group">
              <label for="register-password" class="form-label">密码</label>
              <input type="password" id="register-password" v-model="registerForm.password" class="form-input"
                placeholder="请输入密码 (至少6位)" required minlength="6" />
            </div>

            <div class="form-group">
              <label for="register-confirm" class="form-label">确认密码</label>
              <input type="password" id="register-confirm" v-model="registerForm.confirmPassword" class="form-input"
                placeholder="请再次输入密码" required />
              <div v-if="registerForm.password !== registerForm.confirmPassword" class="error-text">
                密码不匹配
              </div>
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="registerForm.agree" class="form-checkbox" required />
                我同意 <a href="#" class="terms-link">服务条款</a> 和 <a href="#" class="terms-link">隐私政策</a>
              </label>
            </div>

            <button type="submit" class="submit-btn" :disabled="registerForm.password !== registerForm.confirmPassword"
              @click="handleRegister">
              {{ isRegistering ? '注册中...' : '注册' }}
            </button>
          </form>
        </div>
      </div>

      <!-- 关闭按钮 -->
      <button class="close-btn" @click="closeModal">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { login as loginApi, register as registerApi } from '@/api/userApi'
const router = useRouter()
const userStore = useUserStore()

// Props
const props = defineProps<{
  isVisible: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// State
const activeTab = ref('login')

// 正则表达式验证模式
const emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
const phonePattern = /^1[3-9]\d{9}$/

// 验证账户格式是否为邮箱或手机号
const validateAccount = (account: string): { valid: boolean; message: string } => {
  if (emailPattern.test(account)) {
    return { valid: true, message: '邮箱格式正确' }
  } else if (phonePattern.test(account)) {
    return { valid: true, message: '手机号格式正确' }
  } else {
    return { valid: false, message: '请输入正确的邮箱或手机号格式' }
  }
}

// Login form state - 登录表单状态
const loginForm = ref({
  account: '', // 账户（邮箱或手机号）
  password: '', // 密码
  remember: false, // 记住我
  error: '' // 错误信息
})

// Register form state - 注册表单状态
const registerForm = ref({
  name: '', // 用户名
  account: '', // 账户（邮箱或手机号）
  password: '', // 密码
  confirmPassword: '', // 确认密码
  agree: false, // 同意条款
  error: '' // 错误信息
})

// Methods
// 关闭模态框
const closeModal = () => {
  emit('close')
}

// 处理登录提交
const handleLogin = async () => {
  // 验证账户格式
  const { valid, message } = validateAccount(loginForm.value.account);
  if (!valid) {
    loginForm.value.error = message;
    return;
  }

  // 清除错误信息
  loginForm.value.error = '';

  console.log('Login submitted:', loginForm.value);

  try {
    // 调用登录 API
    const data = await loginApi(loginForm.value.account, loginForm.value.password);

    if (data.success) {
      // 保存用户信息和 token 到状态管理
      userStore.login(data.user, data.token);

      // 登录成功后，检查是否有保存的跳转路径
      closeModal();
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        // 清除保存的路径
        sessionStorage.removeItem('redirectAfterLogin');
        // 跳转到保存的路径
        router.replace(redirectPath);
      } else {
        // 默认跳转到用户中心
        router.replace('/users');
      }
    } else {
      // 登录失败
      loginForm.value.error = data.message || '登录失败，请稍后重试';
    }
  } catch (error: any) {
    // 网络错误或其他错误
    console.error('Login error:', error);
    loginForm.value.error = error.response?.data?.message || '登录失败，请稍后重试';
  }
};

// 注册加载状态
const isRegistering = ref(false)

// 处理注册提交
const handleRegister = async () => {
  // 验证账户格式
  const { valid, message } = validateAccount(registerForm.value.account)
  if (!valid) {
    registerForm.value.error = message
    return
  }

  // 验证密码是否匹配
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    registerForm.value.error = '密码不匹配'
    return
  }

  // 清除错误信息
  registerForm.value.error = ''
  // 设置加载状态
  isRegistering.value = true

  try {
    // 调用注册 API
    const data = await registerApi(
      registerForm.value.name,
      registerForm.value.account,
      registerForm.value.password
    )

    if (data.success) {
      // 注册成功，直接登录
      console.log('Register successful:', data)
      // 保存用户信息和 token 到状态管理
      userStore.login(data.user, data.token)

      // 关闭模态框并跳转到用户中心
      closeModal()
      router.replace('/users')
      // 显示成功提示
      alert('注册成功，欢迎使用！')
    } else {
      // 注册失败
      registerForm.value.error = data.message || '注册失败，请稍后重试'
    }
  } catch (error: any) {
    // 网络错误或其他错误
    console.error('Register error:', error)
    registerForm.value.error = error.response?.data?.message || '注册失败，请稍后重试'
  } finally {
    // 清除加载状态
    isRegistering.value = false
  }
}
</script>

<style scoped>
.login-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.login-modal {
  position: relative;
  width: 100%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.4s ease;
}

/* 背景SVG动画 */
.modal-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.5;
}

.svg-bg {
  width: 100%;
  height: 100%;
}

/* 选项卡导航 */
.tab-nav {
  display: flex;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.tab-btn {
  flex: 1;
  padding: 16px;
  background: transparent;
  border: none;
  font-size: 16px;
  font-weight: 600;
  color: #7f8c8d;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  color: #3498db;
}

.tab-btn.active {
  color: #3498db;
  background: rgba(52, 152, 219, 0.1);
}

/* 表单内容 */
.form-container {
  position: relative;
  z-index: 1;
  padding: 30px;
}

.form-content {
  animation: fadeIn 0.3s ease;
}

.form-title {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  font-size: 16px;
  color: #2c3e50;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 14px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #7f8c8d;
  cursor: pointer;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #3498db;
}

.forgot-link,
.terms-link {
  color: #3498db;
  text-decoration: none;
  transition: color 0.3s ease;
}

.forgot-link:hover,
.terms-link:hover {
  color: #2980b9;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(90deg, #3498db, #9b59b6);
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(52, 152, 219, 0.3);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* 错误文本 */
.error-text {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 2;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  color: #2c3e50;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 576px) {
  .login-modal {
    margin: 20px;
    max-width: none;
  }

  .form-container {
    padding: 20px;
  }
}
</style>