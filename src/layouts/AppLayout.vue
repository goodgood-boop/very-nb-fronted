<template>
  <div class="layout">
    <Sidebar />
    <main class="main">
      <transition :css="false" @enter="enter" @leave="leave">
        <router-view />
      </transition>
    </main>

    <!-- 小屏幕导航：当 Sidebar 被隐藏时，提供底部导航（更实用） -->
    <MobileNav />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '../components/ui/Sidebar.vue'
import MobileNav from '../components/ui/MobileNav.vue'
import gsap from 'gsap'

const router = useRouter()

// 页面进入动画
const enter = (el) => {
  gsap.set(el, { opacity: 0, y: 50, scale: 1 })
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    ease: 'elastic.out(0.3, 0.3)',
    onComplete: () => {
      gsap.set(el, { clearProps: 'opacity, transform' })
    }
  })
}

// 页面离开动画
const leave = (el) => {
  gsap.to(el, {
    opacity: 0,
    scale: 0.95,
    duration: 0.3,
    ease: 'power2.in'
  })
}

// 确保在路由变化时正确触发动画
onMounted(() => {
  // 可以在这里添加额外的初始化逻辑
})
</script>
