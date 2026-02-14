<template>
  <!-- 轮播图模块 -->
  <Slideshow></Slideshow>
  <!-- 最新资讯模块 -->
  <LatestNews></LatestNews>
  <!-- 赛事模块 -->
  <Competition></Competition>
</template>

<script setup lang="ts">
import Slideshow from '@/pages/home/slideshow.vue'
import LatestNews from '@/pages/home/latest_news.vue'
import Competition from '@/pages/home/competition.vue'
</script>

<script lang="ts">
export default {
  name: 'Home'
}

</script>

<style scoped>
</style>