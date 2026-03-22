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
        ref="card0"
        class="card card-3d card-interview"
        :class="{
          'expanded': hoveredCard === 0,
          'compressed': hoveredCard !== null && hoveredCard !== 0,
          'container-hovered': isContainerHovered
        }"
        :style="getCardStyle(0)"
        @mouseenter="handleCardEnter(0, $event)"
        @mouseleave="handleCardLeave(0)"
        @mousemove="handleCardMove(0, $event)"
        @click="goToInterview"
      >
        <div class="card-shine"></div>
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
        ref="card1"
        class="card card-3d card-qa"
        :class="{
          'expanded': hoveredCard === 1,
          'compressed': hoveredCard !== null && hoveredCard !== 1,
          'container-hovered': isContainerHovered
        }"
        :style="getCardStyle(1)"
        @mouseenter="handleCardEnter(1, $event)"
        @mouseleave="handleCardLeave(1)"
        @mousemove="handleCardMove(1, $event)"
        @click="goToQA"
      >
        <div class="card-shine"></div>
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
        ref="card2"
        class="card card-3d card-resume"
        :class="{
          'expanded': hoveredCard === 2,
          'compressed': hoveredCard !== null && hoveredCard !== 2,
          'container-hovered': isContainerHovered
        }"
        :style="getCardStyle(2)"
        @mouseenter="handleCardEnter(2, $event)"
        @mouseleave="handleCardLeave(2)"
        @mousemove="handleCardMove(2, $event)"
        @click="goToResumes"
      >
        <div class="card-shine"></div>
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

// ===== 3D倾斜效果 =====
const card0 = ref(null)
const card1 = ref(null)
const card2 = ref(null)
const cardRefs = [card0, card1, card2]

// 存储每张卡片的旋转状态
const cardRotations = ref([
  { x: 0, y: 0, shineX: 50, shineY: 50 },
  { x: 0, y: 0, shineX: 50, shineY: 50 },
  { x: 0, y: 0, shineX: 50, shineY: 50 }
])

// 获取卡片的3D样式
const getCardStyle = (index) => {
  const rot = cardRotations.value[index]
  return {
    transform: `perspective(1000px) rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale3d(1, 1, 1)`,
    '--shine-x': `${rot.shineX}%`,
    '--shine-y': `${rot.shineY}%`
  }
}

// 处理鼠标进入卡片
const handleCardEnter = (index, event) => {
  hoveredCard.value = index
}

// 处理鼠标离开卡片
const handleCardLeave = (index) => {
  hoveredCard.value = null
  // 重置旋转
  cardRotations.value[index] = { x: 0, y: 0, shineX: 50, shineY: 50 }
}

// 处理鼠标在卡片上移动
const handleCardMove = (index, event) => {
  const card = cardRefs[index].value
  if (!card) return
  
  const rect = card.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  // 计算旋转角度（最大8度，更 subtle）
  const rotateX = ((y - centerY) / centerY) * -8
  const rotateY = ((x - centerX) / centerX) * 8
  
  // 计算光泽位置
  const shineX = (x / rect.width) * 100
  const shineY = (y / rect.height) * 100
  
  cardRotations.value[index] = {
    x: rotateX,
    y: rotateY,
    shineX,
    shineY
  }
}
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
  // 清除之前的面试设置，开始新的面试流程
  localStorage.removeItem('selectedResume')
  localStorage.removeItem('interviewSettings')
  router.push('/app/home/interview/select-resume')
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

/* 3D卡片样式 */
.card-3d {
  transform-style: preserve-3d;
  transition: transform 0.1s ease-out, box-shadow 0.3s ease, border-color 0.3s ease;
  will-change: transform;
}

/* 卡片光泽效果 */
.card-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at var(--shine-x, 50%) var(--shine-y, 50%),
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.05) 25%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 1;
  border-radius: inherit;
}

.card-3d:hover .card-shine {
  opacity: 1;
}

/* 卡片悬停效果 */
.card:hover {
  box-shadow: var(--shadow-hover);
  border-color: var(--stroke2);
}

/* 展开状态 */
.card.expanded {
  flex: 1.5;
}

/* 压缩状态（其他卡片被压缩） */
.card.compressed {
  flex: 0.7;
  opacity: 0.7;
}

/* ===== 渐变色彩卡片 ===== */

/* 开始面试 - 蓝紫渐变 */
.card-interview {
  background: linear-gradient(135deg, 
    rgba(20, 25, 35, 0.95) 0%, 
    rgba(59, 130, 246, 0.35) 40%,
    rgba(20, 25, 35, 0.95) 100%
  );
  border-color: rgba(59, 130, 246, 0.5);
  animation: breathe-interview 4s ease-in-out infinite;
}

.card-interview:hover,
.card-interview.expanded {
  background: linear-gradient(135deg, 
    rgba(20, 25, 35, 0.9) 0%, 
    rgba(59, 130, 246, 0.5) 40%,
    rgba(20, 25, 35, 0.9) 100%
  );
  border-color: rgba(59, 130, 246, 0.8);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4);
}

@keyframes breathe-interview {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2), 0 0 0 1px rgba(59, 130, 246, 0.4);
    border-color: rgba(59, 130, 246, 0.5);
  }
  50% {
    box-shadow: 0 12px 48px rgba(59, 130, 246, 0.4), 0 0 0 2px rgba(59, 130, 246, 0.6);
    border-color: rgba(59, 130, 246, 0.7);
  }
}

/* 问答助手 - 青绿渐变 */
.card-qa {
  background: linear-gradient(135deg, 
    rgba(20, 25, 35, 0.95) 0%, 
    rgba(13, 148, 136, 0.35) 40%,
    rgba(20, 25, 35, 0.95) 100%
  );
  border-color: rgba(13, 148, 136, 0.5);
  animation: breathe-qa 4s ease-in-out infinite;
}

.card-qa:hover,
.card-qa.expanded {
  background: linear-gradient(135deg, 
    rgba(20, 25, 35, 0.9) 0%, 
    rgba(13, 148, 136, 0.5) 40%,
    rgba(20, 25, 35, 0.9) 100%
  );
  border-color: rgba(13, 148, 136, 0.8);
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.4);
}

@keyframes breathe-qa {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(13, 148, 136, 0.2), 0 0 0 1px rgba(13, 148, 136, 0.4);
    border-color: rgba(13, 148, 136, 0.5);
  }
  50% {
    box-shadow: 0 12px 48px rgba(13, 148, 136, 0.4), 0 0 0 2px rgba(13, 148, 136, 0.6);
    border-color: rgba(13, 148, 136, 0.7);
  }
}

/* 简历库 - 粉紫渐变 */
.card-resume {
  background: linear-gradient(135deg, 
    rgba(20, 25, 35, 0.95) 0%, 
    rgba(139, 92, 246, 0.35) 40%,
    rgba(20, 25, 35, 0.95) 100%
  );
  border-color: rgba(139, 92, 246, 0.5);
  animation: breathe-resume 4s ease-in-out infinite;
}

.card-resume:hover,
.card-resume.expanded {
  background: linear-gradient(135deg, 
    rgba(20, 25, 35, 0.9) 0%, 
    rgba(139, 92, 246, 0.5) 40%,
    rgba(20, 25, 35, 0.9) 100%
  );
  border-color: rgba(139, 92, 246, 0.8);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
}

@keyframes breathe-resume {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.2), 0 0 0 1px rgba(139, 92, 246, 0.4);
    border-color: rgba(139, 92, 246, 0.5);
  }
  50% {
    box-shadow: 0 12px 48px rgba(139, 92, 246, 0.4), 0 0 0 2px rgba(139, 92, 246, 0.6);
    border-color: rgba(139, 92, 246, 0.7);
  }
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