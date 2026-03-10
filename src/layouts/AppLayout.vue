<template>
  <div class="layout">
    <main class="main">
      <!-- Back Button for non-Windmill pages -->
      <div v-if="!isWindmill" class="back-nav">
        <button @click="goHome" class="back-btn">
          <ArrowLeft :size="20" />
          <span>返回主页</span>
        </button>
      </div>

      <router-view v-slot="{ Component, route }">
        <transition 
          :css="false" 
          @enter="enter" 
          @leave="leave"
        >
          <component :is="Component" :key="route.path" class="page-container" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
/* Global fix for layout to handle absolute positioning */
.layout {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.main {
  position: relative;
  width: 100%;
  height: 100%;
}

.page-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  will-change: clip-path, transform, opacity;
  overflow-y: auto; /* Enable scrolling for sub-pages */
  background: transparent; /* Allow stacking context */
}

/* Ensure Windmill home doesn't scroll unnecessarily */
.windmill-container {
  overflow: hidden;
}
</style>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import gsap from 'gsap'
import '../components/layout_extras.css'

const router = useRouter()
const route = useRoute()

const isWindmill = computed(() => route.path === '/app/home')

const goHome = () => {
  router.push('/app/home')
}

// Curtain Open Animation (Entering a sub-page from Windmill)
const enter = (el, done) => {
  const isEnteringWindmill = route.path === '/app/home'
  
  if (isEnteringWindmill) {
     // Entering Windmill: Fade in and scale up slightly
     // Important: set absolute position to ensure it overlaps correctly
     gsap.set(el, { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 })
     gsap.fromTo(el, 
       { opacity: 0, scale: 0.95 }, 
       { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out', onComplete: done }
     )
  } else {
     // Entering Sub-page: Curtain Effect
     // Set high z-index to cover the windmill
     gsap.set(el, { 
       position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
       zIndex: 100,
       backgroundColor: '#f5f7ff' // Ensure opaque background
     })
     
     gsap.fromTo(el,
       { 
         clipPath: 'circle(0% at 90% 90%)'
       },
       { 
         clipPath: 'circle(150% at 90% 90%)', 
         duration: 1.2, 
         ease: 'power2.inOut', 
         onComplete: () => {
           gsap.set(el, { clearProps: 'clipPath' }) // Clear clipPath to allow full interaction
           done()
         }
       }
     )
  }
}

const leave = (el, done) => {
  const isGoingToWindmill = route.path === '/app/home'
  
  if (isGoingToWindmill) {
     // Leaving Sub-page: Shrink back to bottom-right
     // Ensure it stays on top while shrinking
     gsap.set(el, { zIndex: 100, overflow: 'hidden' })
     
     gsap.to(el, {
       clipPath: 'circle(0% at 90% 90%)',
       duration: 1.0,
       ease: 'power2.inOut',
       onComplete: done
     })
  } else {
     // Leaving Windmill: Fade out slightly
     gsap.set(el, { zIndex: 1 })
     gsap.to(el, { 
       opacity: 0, 
       scale: 0.95,
       duration: 1.0, 
       ease: 'power2.inOut',
       onComplete: done 
     }) 
  }
}
</script>
