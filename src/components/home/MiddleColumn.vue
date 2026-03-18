<template>
  <div 
    class="middle-column"
    @mouseenter="$emit('hover-change', true)"
    @mouseleave="$emit('hover-change', false)"
  >
    <!-- 返回按钮 - 只在子页面显示，位于中栏左上角 -->
    <div v-if="$route.path !== '/app/home'" class="back-button">
      <button class="back-btn" @click="goBackToHome">
        <span class="back-icon">←</span>
        <span>返回</span>
      </button>
    </div>
    <!-- 根据是否有子路由显示不同内容 -->
    <router-view 
      v-if="$route.path !== '/app/home'" 
      v-slot="{ Component }"
      @fullscreen-change="handleChildFullscreen"
    >
      <component 
        :is="Component" 
        :key="$route.path"
        @fullscreen-change="handleChildFullscreen"
      />
    </router-view>
    
    <!-- 卡片视图（没有子路由时显示） -->
    <div v-else class="cards-container" :class="{ 'hovering-container': isContainerHovered }">
      <!-- 卡片1：开始面试 -->
      <div 
        class="card"
        :class="{
          'expanded': hoveredCard === 0,
          'compressed': hoveredCard !== null && hoveredCard !== 0,
          'container-hovered': isContainerHovered
        }"
        @mouseenter="hoveredCard = 0"
        @mouseleave="hoveredCard = null"
        @click="goToInterview"
      >
        <div class="card-content">
          <div class="card-icon">🎯</div>
          <h3 class="card-title">开始面试</h3>
          <p class="card-subtitle">模拟真实面试环境</p>
          
          <!-- 展开时显示更多内容 -->
          <Transition name="fade">
            <div v-if="hoveredCard === 0" class="card-details">
              <div class="detail-item">
                <span class="detail-label">岗位：</span>
                <span class="detail-value">前端/后端/算法</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">时长：</span>
                <span class="detail-value">30-45分钟</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">难度：</span>
                <span class="detail-value">自适应</span>
              </div>
              <div class="card-buttons">
                <button class="card-btn primary">立即开始</button>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 卡片2：问答助手 -->
      <div 
        class="card"
        :class="{
          'expanded': hoveredCard === 1,
          'compressed': hoveredCard !== null && hoveredCard !== 1,
          'container-hovered': isContainerHovered
        }"
        @mouseenter="hoveredCard = 1"
        @mouseleave="hoveredCard = null"
        @click="goToQA"
      >
        <div class="card-content">
          <div class="card-icon">💬</div>
          <h3 class="card-title">问答助手</h3>
          <p class="card-subtitle">基于知识库智能问答</p>
          
          <Transition name="fade">
            <div v-if="hoveredCard === 1" class="card-details">
              <div class="detail-item">
                <span class="detail-label">今日高频：</span>
                <span class="detail-value">3道题</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">知识库：</span>
                <span class="detail-value">{{ knowledgeCount }}个文档</span>
              </div>
              <div class="preview-question">
                "JVM内存模型？"
              </div>
              <div class="card-buttons">
                <button class="card-btn primary">开始提问</button>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 卡片3：简历库 -->
      <div 
        class="card"
        :class="{
          'expanded': hoveredCard === 2,
          'compressed': hoveredCard !== null && hoveredCard !== 2,
          'container-hovered': isContainerHovered
        }"
        @mouseenter="hoveredCard = 2"
        @mouseleave="hoveredCard = null"
        @click="goToResumes"
      >
        <div class="card-content">
          <div class="card-icon">📄</div>
          <h3 class="card-title">简历库</h3>
          <p class="card-subtitle">管理简历和面试记录</p>
          
          <Transition name="fade">
            <div v-if="hoveredCard === 2" class="card-details">
              <div class="detail-item">
                <span class="detail-label">简历总数：</span>
                <span class="detail-value">{{ resumeCount }}份</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">面试次数：</span>
                <span class="detail-value">{{ interviewCount }}次</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">最新分析：</span>
                <span class="detail-value">{{ lastAnalysisTime || '暂无' }}</span>
              </div>
              <div class="card-buttons">
                <button class="card-btn primary">查看简历库</button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getRecords } from '../../lib/records'
import { knowledgeBaseApi } from '../../api/knowledgebase'

const props = defineProps({
  expanded: Boolean
})

const emit = defineEmits(['hover-change', 'fullscreen-change'])

const router = useRouter()
const route = useRoute()
// 返回主页卡片视图
const goBackToHome = () => {
  router.push('/app/home')
}

// 悬停状态
const hoveredCard = ref(null)
const isContainerHovered = computed(() => props.expanded)

// 统计数据
const resumeCount = ref(0)
const interviewCount = ref(0)
const knowledgeCount = ref(0)
const lastAnalysisTime = ref('')

// 处理子组件的全屏事件
const handleChildFullscreen = (value) => {
  emit('fullscreen-change', value)
}

// 加载数据
const loadStats = async () => {
  // 面试记录统计
  const records = getRecords()
  interviewCount.value = records.length
  
  // 去重简历数量
  const uniqueResumes = new Set(records.map(r => r.resumeId).filter(Boolean))
  resumeCount.value = uniqueResumes.size
  
  // 最新面试时间
  if (records.length > 0) {
    const lastRecord = records[0]
    const date = new Date(lastRecord.startedAt)
    lastAnalysisTime.value = date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // 知识库统计
  try {
    const kbs = await knowledgeBaseApi.getAllKnowledgeBases('time')
    knowledgeCount.value = kbs.length
  } catch (err) {
    console.error('加载知识库统计失败:', err)
  }
}

// 保存点击位置到localStorage，供AppLayout.vue使用
const saveClickPosition = (event) => {
  const x = (event.clientX / window.innerWidth) * 100
  const y = (event.clientY / window.innerHeight) * 100
  localStorage.setItem('transitionOrigin', JSON.stringify({ x, y }))
}

// 导航函数
const goToInterview = (event) => {
  saveClickPosition(event)
  router.push('/app/home/interview')
}

const goToQA = (event) => {
  saveClickPosition(event)
  router.push('/app/home/qa')
}

const goToResumes = (event) => {
  saveClickPosition(event)
  router.push('/app/home/resumes')
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.middle-column {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;  /* 为绝对定位的返回按钮提供参考 */
}
/* 返回按钮样式 */
.back-button {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 1000;  /* 确保按钮在最上层 */
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: var(--panel2);
  color: var(--brand);
  transform: translateX(-2px);
}

.back-icon {
  font-size: 16px;
  line-height: 1;
}

/* 确保子页面内容不会被返回按钮挡住 */
.middle-column :deep(.interview-room),
.middle-column :deep(.knowledge-chat-page),
.middle-column :deep(.resume-list-page) {
  padding-top: 60px;  /* 给返回按钮留出空间 */
}

/* 卡片视图不需要 padding */
.middle-column .cards-container {
  padding-top: 16px;  /* 恢复原来的值 */
}

.cards-container {
  height: 100%;
  display: flex;
  gap: 12px;
  padding: 16px;
  transition: gap 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 中间栏悬停时，卡片间距拉大 */
.cards-container.hovering-container {
  gap: 20px;
}

/* 卡片基础样式 */
.card {
  flex: 1;
  background: var(--panel);
  border-radius: 20px;
  border: 1px solid var(--stroke);
  box-shadow: var(--shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

/* 卡片悬停效果 */
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
  border-color: var(--stroke2);
}

/* 展开状态 */
.card.expanded {
  flex: 1.5;
  background: var(--panel);
  border-color: var(--brand);
  box-shadow: 0 12px 28px rgba(100, 108, 255, 0.15);
}

/* 压缩状态（其他卡片被压缩） */
.card.compressed {
  flex: 0.7;
  opacity: 0.7;
}

/* 卡片内容 */
.card-content {
  height: 100%;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* 卡片图标 */
.card-icon {
  font-size: 36px;
  margin-bottom: 12px;
  transition: transform 0.3s ease;
}

.card:hover .card-icon {
  transform: scale(1.1);
}

.card.expanded .card-icon {
  transform: scale(1.2);
  margin-bottom: 16px;
}

/* 卡片标题 */
.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 8px 0;
  transition: all 0.3s ease;
}

.card.expanded .card-title {
  font-size: 22px;
  color: var(--brand);
}

/* 卡片副标题 */
.card-subtitle {
  font-size: 13px;
  color: var(--muted);
  margin: 0 0 16px 0;
  transition: all 0.3s ease;
}

.card.expanded .card-subtitle {
  color: var(--text);
}

/* 卡片详情（展开时显示） */
.card-details {
  width: 100%;
  margin-top: 12px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--stroke);
  font-size: 13px;
}

.detail-item:last-of-type {
  border-bottom: none;
}

.detail-label {
  color: var(--muted);
  font-weight: 500;
}

.detail-value {
  color: var(--text);
  font-weight: 600;
}

/* 预览问题 */
.preview-question {
  background: var(--panel2);
  border: 1px solid var(--stroke);
  color: var(--text);
  padding: 10px;
  border-radius: 10px;
  font-size: 12px;
  margin: 12px 0;
  font-style: italic;
  border-left: 3px solid var(--brand);
}

/* 卡片按钮 */
.card-buttons {
  margin-top: 16px;
  width: 100%;
}

.card-btn {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--stroke);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-btn.primary {
  background: var(--brand);
  border-color: var(--brand);
  color: white;
}

.card-btn.primary:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

/* 确保子页面占满整个中栏 */
.middle-column :deep(.interview-room),
.middle-column :deep(.knowledge-chat-page),
.middle-column :deep(.resume-list-page) {
  height: 100%;
  width: 100%;
  padding: 0;
  overflow-y: auto;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .cards-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .cards-container.hovering-container {
    gap: 16px;
  }
  
  .card {
    width: 100%;
  }
  
  .card.expanded {
    flex: 1.2;
  }
  
  .card.compressed {
    flex: 0.8;
  }
}
</style>