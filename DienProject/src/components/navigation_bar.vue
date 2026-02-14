<template>
    <!-- navbar-scrolled: 滚动时的基础样式 -->
    <!-- navbar-green: 滚动时的绿色背景样式 -->
    <div class="navbar-container" :class="{ 'navbar-scrolled': isScrolled, 'navbar-green': isScrolled }" v-if="$route.meta.showNavbar !== false">
        <b-navbar toggleable="lg" type="dark">

            <div class="logo-container">
                <div class="logo">Logo</div>
            </div>

            <b-navbar-nav>
                <b-nav-item :to="'/home'" active-class="active" class="nav-link">
                    首页
                </b-nav-item>
            </b-navbar-nav>

            <b-collapse id="nav-collapse" is-nav>

                <b-navbar-nav>
                    <b-nav-item :to="'/students'" active-class="active" class="nav-link">
                        学生/教师
                    </b-nav-item>
                    <b-nav-item :to="'/about'" active-class="active" class="nav-link">
                        关于我们
                    </b-nav-item>
                </b-navbar-nav>

                <b-navbar-nav class="ms-auto btn-login-container">
                    <b-button variant="outline-primary" class="btn-login" @click="showLogin = true">登录/注册</b-button>
                </b-navbar-nav>
            </b-collapse>
        </b-navbar>
    </div>
    <router-view></router-view>
    <Login v-if="showLogin" :is-visible="showLogin" @close="showLogin = false" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { BNavbar, BNavbarNav, BCollapse, BNavItem, BButton } from 'bootstrap-vue-next'
import Login from './login.vue'
const isScrolled = ref(false)
const showLogin = ref(false)

// 滚动事件处理函数
const handleScroll = () => {
    isScrolled.value = window.scrollY > 0
}

onMounted(() => {
    window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
})
</script>

<script lang="ts">
export default {
    name: 'NavBar'
}
</script>

<style scoped>
/* 导航栏置顶 */
.navbar-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
    padding: 0px 5%;
    box-sizing: border-box;
}

/* 滚动时的导航栏样式 */
.navbar-green {
    opacity: 0.95;
    background-color: #4CAF50 !important;
    transition: background-color 1s ease;
}

/* Logo容器样式 */
.logo-container {
    display: flex;
    align-items: center;
    margin-right: 20px;
}

/* Logo文字样式 */
.logo {
    font-size: 28px;
    /* 字体大小 */
    font-weight: bold;
    /* 字体加粗 */
    color: #ffffff;
    /* 文字颜色：白色 */
    padding: 8px 15px;
    /* 内边距 */
    border-radius: 5px;
    /* 圆角 */
    background-color: rgba(255, 255, 255, 0.1);
    /* 半透明白色背景 */
}

/* 导航栏菜单块 */
:deep(.b-navbar) {
    display: flex !important;
    width: 100%;
    justify-content: space-between;
    background-color: transparent !important;
    border: none !important;
    padding: 0;
    margin-bottom: 0;
}

/* 登录/注册按钮样式 */
.btn-login {
    font-size: 20px;
    font-weight: bold;
    color: #ffffff;
    border: 2px solid #ffffff;
}

/* 登录按钮容器样式 */
.btn-login-container {
    display: flex;
    align-items: center;
    border-radius: 0.5rem;
}

/* 导航链接样式：添加灵动下划线效果 */
:deep(.nav-link) {
    position: relative;
    padding: 8px 0;
    transition: all 0.3s ease;
    overflow: hidden;
    font-size: 25px;
    font-weight: bold;
    color: #2401ea !important;
}

/* 导航链接下划线：基础样式 */
:deep(.nav-link::after) {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 3px;
    background: linear-gradient(90deg, #2401ea, #2401ea);
    border-radius: 2px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateX(-50%);
}

/* 导航链接激活/悬停时的下划线样式 */
:deep(.nav-link.active::after),
:deep(.nav-link:hover::after) {
    width: 80%;
}

/* 导航链接激活/悬停时的文字颜色 */
:deep(.nav-link.active),
:deep(.nav-link:hover) {
    color: #ffffff !important;
}
</style>