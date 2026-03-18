<template>
  <div class="dashboard-new-home" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- 三栏主体 -->
    <div class="columns-container">
      <!-- 左栏：全屏时隐藏 -->
      <div 
        v-show="!isFullscreen"
        class="column left" 
        :style="{ width: leftWidth }"
        @mouseenter="handleLeftHover(true)"
        @mouseleave="handleLeftHover(false)"
      >
        <LeftColumn 
          :expanded="leftHover" 
          @hover-change="leftHover = $event"
        />
      </div>

      <!-- 中栏 -->
      <div 
        class="column middle" 
        :style="{ width: middleWidth }"
        @mouseenter="handleMiddleHover(true)"
        @mouseleave="handleMiddleHover(false)"
      >
        <MiddleColumn 
          :expanded="middleHover" 
          @hover-change="middleHover = $event"
          @fullscreen-change="handleFullscreenChange"
        />
      </div>

      <!-- 右栏：全屏时隐藏 -->
      <div 
        v-show="!isFullscreen"
        class="column right" 
        :style="{ width: rightWidth }"
        @mouseenter="handleRightHover(true)"
        @mouseleave="handleRightHover(false)"
      >
        <RightColumn 
          :expanded="rightHover" 
          @hover-change="rightHover = $event"
        />
      </div>
    </div>

    <!-- 底部横条：全屏时隐藏 -->
    <BottomBar v-show="!isFullscreen" />
  </div>
</template>

<script setup>
import { ref, computed, provide } from 'vue'
import LeftColumn from '../components/home/LeftColumn.vue'
import MiddleColumn from '../components/home/MiddleColumn.vue'
import RightColumn from '../components/home/RightColumn.vue'
import BottomBar from '../components/home/BottomBar.vue'

// 悬停状态
const leftHover = ref(false)
const middleHover = ref(false)
const rightHover = ref(false)
// 添加延迟定时器
let leftTimer = null
let middleTimer = null
let rightTimer = null
// 处理左栏悬停
const handleLeftHover = (value) => {
  if (leftTimer) clearTimeout(leftTimer)
  if (value) {
    // 鼠标进入：延迟200ms后展开
    leftTimer = setTimeout(() => {
      leftHover.value = true
    }, 200)
  } else {
    // 鼠标离开：立即收缩
    leftHover.value = false
  }
}

// 处理中栏悬停
const handleMiddleHover = (value) => {
  if (middleTimer) clearTimeout(middleTimer)
  if (value) {
    // 鼠标进入：延迟200ms后展开
    middleTimer = setTimeout(() => {
      middleHover.value = true
    }, 200)
  } else {
    // 鼠标离开：立即收缩
    middleHover.value = false
  }
}

// 处理右栏悬停
const handleRightHover = (value) => {
  if (rightTimer) clearTimeout(rightTimer)
  if (value) {
    // 鼠标进入：延迟200ms后展开
    rightTimer = setTimeout(() => {
      rightHover.value = true
    }, 200)
  } else {
    // 鼠标离开：立即收缩
    rightHover.value = false
  }
}
// 全屏状态
const isFullscreen = ref(false)

// 处理全屏变化
const handleFullscreenChange = (value) => {
  isFullscreen.value = value
}

// 提供全屏状态给子组件
provide('fullscreen', isFullscreen)

// 宽度计算
const leftWidth = computed(() => leftHover.value ? '40%' : '20%')
const rightWidth = computed(() => rightHover.value ? '40%' : '20%')
const middleWidth = computed(() => {
  // 全屏模式：中栏占满
  if (isFullscreen.value) return '100%'
  
  // 中栏悬停：中栏展开到70%
  if (middleHover.value) return '70%'
  
  // 左右同时悬停：各40%，中栏20%
  if (leftHover.value && rightHover.value) {
    return '20%'
  }
  
  // 只有左栏悬停：左40%，右20%，中40%
  if (leftHover.value) {
    return '40%'
  }
  
  // 只有右栏悬停：右40%，左20%，中40%
  if (rightHover.value) {
    return '40%'
  }
  
  // 默认：中栏60%
  return '60%'
})
</script>

<style scoped>
.dashboard-new-home {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg0);
  transition: all 0.3s ease;
}

/* 全屏模式样式 */
.dashboard-new-home.fullscreen-mode {
  background: var(--bg0);
}

/* 三栏容器 */
.columns-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 20px;
  gap: 16px;
  transition: padding 0.3s ease;
}

/* 全屏时去除内边距 */
.fullscreen-mode .columns-container {
  padding: 0;
}

/* 通用栏样式 */
.column {
  height: 100%;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border-radius: 20px;
  background: var(--panel);
  box-shadow: var(--shadow);
  border: 1px solid var(--stroke);
}

/* 全屏时中栏样式 */
.fullscreen-mode .column.middle {
  border-radius: 0;
  border: none;
  box-shadow: none;
}

/* 左栏和右栏在悬停时可以有阴影 */
.column.left:hover,
.column.right:hover {
  box-shadow: var(--shadow-hover);
}

/* 中栏悬停效果 */
.column.middle:hover {
  box-shadow: var(--shadow-hover);
}

/* 占位内容样式（用于未实现的组件） */
.placeholder-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--muted2);
  font-size: 14px;
}

.placeholder-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}

.placeholder-content p {
  margin: 4px 0;
}

/* 自定义滚动条 */
.column-content::-webkit-scrollbar {
  width: 4px;
}

.column-content::-webkit-scrollbar-track {
  background: transparent;
}

.column-content::-webkit-scrollbar-thumb {
  background: var(--stroke);
  border-radius: 2px;
}

.column-content::-webkit-scrollbar-thumb:hover {
  background: var(--stroke2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .columns-container {
    padding: 12px;
    gap: 12px;
  }
  
  .column {
    border-radius: 16px;
  }
}

@media (max-width: 480px) {
  .columns-container {
    padding: 8px;
    gap: 8px;
  }
  
  .column {
    border-radius: 12px;
  }
}
</style>