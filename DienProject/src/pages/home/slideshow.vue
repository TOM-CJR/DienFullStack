<template>
    <div>
        <b-carousel id="carousel-1" :interval="4000" controls indicators background="#ababab"
            img-width="100%" img-height="900px" style="text-shadow: 1px 1px 2px #333;"  :fade="true" :no-hover-pause="true" ride="carousel">
            <b-carousel-slide v-for="s in slides" :key="s.id" :caption="s.caption" :text="s.text" :img-src="s.imgSrc">
            </b-carousel-slide>
        </b-carousel>
    </div>
</template>

<script setup lang="ts">
import { BCarousel, BCarouselSlide } from 'bootstrap-vue-next'
import { type Sliderlist } from '@/types'


const slides: Sliderlist[] = ([
    {
        id: "1",
        caption: "First slide",
        text: "风景如画",
        imgSrc: "/src/assets/星系空间恒星宇宙太空景观星云4k壁纸_彼岸图网.jpg"
    },
    {
        id: "2",
        caption: "Second slide",
        text: "风景如画",
        imgSrc: "/src/assets/美国华盛顿州雷尼尔山风景4K壁纸_彼岸图网.jpg"
    },
    {
        id: "3",
        caption: "Third slide",
        text: "风景如画",
        imgSrc: "/src/assets/夜晚 夜间 别墅风景 湖水 树 草 房子 倒影 小屋 灯光 4k风景壁纸_彼岸图网.jpg"
    },
])

</script>

<style scoped></style>