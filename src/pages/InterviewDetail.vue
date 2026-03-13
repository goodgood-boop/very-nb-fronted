<template>
  <div class="interview-detail-page">
    <!-- 头部 -->
    <MotionDiv
      class="detail-header"
      :initial="{ opacity: 0, y: -20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.5 }"
    >
      <div class="header-left">
        <button class="back-btn" @click="router.back()">
          <ArrowLeft width="20" height="20" />
          返回
        </button>
        <div class="header-info">
          <h1 class="detail-title">面试详情</h1>
          <p v-if="interview" class="detail-subtitle">
            {{ interview.resumeFilename || '未知简历' }} · {{ formatDate(interview.createdAt) }}
          </p>
        </div>
      </div>
      <div class="header-actions">
        <button 
          v-if="interview && isEvaluateCompleted(interview)"
          class="export-btn" 
          @click="exportInterview"
          :disabled="exporting"
        >
          <Download v-if="!exporting" width="16" height="16" />
          <Loader2 v-else width="16" height="16" class="animate-spin" />
          导出PDF
        </button>
      </div>
    </MotionDiv>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <AlertCircle width="48" height="48" />
      <p>{{ error }}</p>
      <button class="btn primary" @click="loadInterviewDetail">重试</button>
    </div>

    <!-- 面试详情内容 -->
    <div v-else-if="interview" class="detail-content">
      <!-- 顶部评分区域 -->
      <div class="top-section">
        <!-- 总分卡片 -->
        <MotionDiv
          class="score-card"
          :initial="{ opacity: 0, scale: 0.9 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.5, delay: 0.1 }"
        >
          <div class="score-header">
            <h3>面试评分</h3>
            <span class="score-badge" :class="getScoreLevel(interview.overallScore)">
              {{ getScoreLevelText(interview.overallScore) }}
            </span>
          </div>
          <div class="score-main">
            <div class="score-circle-large">
              <svg class="score-ring-large" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="62" fill="none" stroke="#f1f5f9" stroke-width="10"/>
                <circle 
                  cx="70" cy="70" r="62" 
                  fill="none" 
                  :stroke="getScoreColor(interview.overallScore)"
                  stroke-width="10"
                  stroke-linecap="round"
                  :stroke-dasharray="circumferenceLarge"
                  :stroke-dashoffset="strokeDashoffsetLarge"
                  class="score-progress"
                />
              </svg>
              <div class="score-value-large">
                <span class="score-number">{{ interview.overallScore ?? '-' }}</span>
                <span class="score-total">/100</span>
              </div>
            </div>
            <div class="score-info">
              <p class="score-feedback">{{ interview.overallFeedback || '表现良好，展示了扎实的技术基础。' }}</p>
            </div>
          </div>
        </MotionDiv>

        <!-- 维度评分 -->
        <MotionDiv
          v-if="interview.dimensionScores && interview.dimensionScores.length > 0"
          class="dimensions-card"
          :initial="{ opacity: 0, x: 20 }"
          :animate="{ opacity: 1, x: 0 }"
          :transition="{ duration: 0.5, delay: 0.2 }"
        >
          <h3>维度评分</h3>
          <div class="dimensions-list">
            <div 
              v-for="(dim, idx) in interview.dimensionScores" 
              :key="idx"
              class="dimension-item"
            >
              <div class="dimension-header">
                <span class="dimension-name">{{ dim.name }}</span>
                <span class="dimension-score">{{ dim.score }}分</span>
              </div>
              <div class="dimension-bar">
                <div 
                  class="dimension-fill"
                  :style="{ width: dim.score + '%', backgroundColor: getScoreColor(dim.score) }"
                ></div>
              </div>
            </div>
          </div>
        </MotionDiv>
      </div>

      <!-- 优势和改进建议 -->
      <div class="middle-section">
        <!-- 表现优势 -->
        <MotionDiv
          v-if="interview.strengths && interview.strengths.length > 0"
          class="section-card"
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5, delay: 0.3 }"
        >
          <div class="section-header success">
            <CheckCircle2 width="20" height="20" />
            <h4>表现优势</h4>
          </div>
          <ul class="section-list">
            <li v-for="(strength, i) in interview.strengths" :key="i">
              <span class="list-dot success"></span>
              <span>{{ strength }}</span>
            </li>
          </ul>
        </MotionDiv>

        <!-- 改进建议 -->
        <MotionDiv
          v-if="interview.improvements && interview.improvements.length > 0"
          class="section-card"
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5, delay: 0.4 }"
        >
          <div class="section-header warning">
            <AlertTriangle width="20" height="20" />
            <h4>改进建议</h4>
          </div>
          <ul class="section-list">
            <li v-for="(improvement, i) in interview.improvements" :key="i">
              <span class="list-dot warning"></span>
              <span>{{ improvement }}</span>
            </li>
          </ul>
        </MotionDiv>
      </div>

      <!-- 问答记录详情 -->
      <MotionDiv
        v-if="interview.answers && interview.answers.length > 0"
        class="questions-section"
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5, delay: 0.5 }"
      >
        <div class="section-header">
          <MessageSquare width="20" height="20" />
          <h4>问答记录详情</h4>
          <span class="question-count">共 {{ interview.answers.length }} 题</span>
        </div>
        
        <div class="questions-list">
          <div 
            v-for="(answer, idx) in interview.answers" 
            :key="idx"
            class="question-card"
            :class="{ expanded: expandedQuestions.has(idx) }"
          >
            <!-- 问题头部 -->
            <div class="question-header" @click="toggleQuestion(idx)">
              <div class="question-meta">
                <span class="question-index">Q{{ answer.questionIndex + 1 }}</span>
                <span class="question-category">{{ answer.category || '综合' }}</span>
                <span class="question-score-badge" :class="getScoreClass(answer.score)">
                  {{ answer.score }}分
                </span>
              </div>
              <div class="question-actions">
                <ChevronDown 
                  width="20" 
                  height="20" 
                  class="expand-icon"
                  :class="{ expanded: expandedQuestions.has(idx) }"
                />
              </div>
            </div>

            <!-- 问题内容 -->
            <div class="question-content">
              <p class="question-text">{{ answer.question }}</p>
            </div>

            <!-- 展开内容 -->
            <div v-show="expandedQuestions.has(idx)" class="question-detail">
              <!-- 你的回答 -->
              <div class="detail-box user-answer">
                <div class="detail-label">
                  <User width="14" height="14" />
                  你的回答
                </div>
                <p class="detail-text" :class="{ 'no-answer': !answer.userAnswer || answer.userAnswer === '不知道' }">
                  {{ answer.userAnswer || '(未回答)' }}
                </p>
              </div>

              <!-- AI 评价 -->
              <div v-if="answer.feedback" class="detail-box ai-feedback">
                <div class="detail-label">
                  <Bot width="14" height="14" />
                  AI 评价
                </div>
                <p class="detail-text">{{ answer.feedback }}</p>
              </div>

              <!-- 参考答案 -->
              <div v-if="answer.referenceAnswer" class="detail-box reference">
                <div class="detail-label">
                  <BookOpen width="14" height="14" />
                  参考答案
                </div>
                <pre class="reference-text">{{ answer.referenceAnswer }}</pre>
              </div>
            </div>
          </div>
        </div>
      </MotionDiv>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  Download, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  User,
  Bot,
  BookOpen
} from 'lucide-vue-next'
import { MotionDiv } from '../components/motion'
import { interviewApi } from '../api/interview'

const route = useRoute()
const router = useRouter()

// 状态
const interview = ref(null)
const loading = ref(true)
const error = ref(null)
const exporting = ref(false)
const expandedQuestions = ref(new Set())

// 计算属性 - 圆环进度
const circumferenceLarge = 2 * Math.PI * 62 // r=62
const strokeDashoffsetLarge = computed(() => {
  const score = interview.value?.overallScore || 0
  const percent = score / 100
  return circumferenceLarge - (percent * circumferenceLarge)
})

// 状态判断
function isEvaluateCompleted(interview) {
  if (!interview) return false
  if (interview.evaluateStatus === 'COMPLETED') return true
  if (interview.status === 'EVALUATED') return true
  return false
}

// 获取分数颜色
function getScoreColor(score) {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

// 获取分数等级
function getScoreLevel(score) {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  return 'needs-improvement'
}

// 获取分数等级文本
function getScoreLevelText(score) {
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  return '需改进'
}

// 获取分数样式类
function getScoreClass(score) {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

// 切换问题展开/收起
function toggleQuestion(index) {
  const newSet = new Set(expandedQuestions.value)
  if (newSet.has(index)) {
    newSet.delete(index)
  } else {
    newSet.add(index)
  }
  expandedQuestions.value = newSet
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 加载面试详情
async function loadInterviewDetail() {
  const sessionId = route.params.sessionId
  if (!sessionId) {
    error.value = '无效的面试ID'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const detail = await interviewApi.getInterviewDetail(sessionId)
    interview.value = detail
    
    // 默认展开所有问题
    if (detail.answers) {
      expandedQuestions.value = new Set(detail.answers.map((_, idx) => idx))
    }
  } catch (err) {
    console.error('加载面试详情失败:', err)
    error.value = err.message || '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

// 导出PDF
async function exportInterview() {
  const sessionId = route.params.sessionId
  if (!sessionId) return

  exporting.value = true
  try {
    const blob = await interviewApi.exportReport(sessionId)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `面试报告_${sessionId.slice(-8)}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    alert('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

// 初始化
onMounted(() => {
  loadInterviewDetail()
})
</script>

<style scoped>
.interview-detail-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 24px;
  width: 100%;
  box-sizing: border-box;
}

/* 头部 */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f8fafc;
  color: #334155;
  border-color: #cbd5e1;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.detail-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  gap: 16px;
  color: #64748b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  gap: 16px;
  color: #ef4444;
}

.error-state p {
  color: #64748b;
  font-size: 14px;
}

/* 按钮 */
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn.primary {
  background: #6366f1;
  color: white;
}

.btn.primary:hover {
  background: #4f46e5;
}

/* 详情内容 */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 顶部区域 */
.top-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 1024px) {
  .top-section {
    grid-template-columns: 1fr;
  }
}

/* 评分卡片 */
.score-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.score-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.score-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.score-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.score-badge.excellent {
  background: #f0fdf4;
  color: #16a34a;
}

.score-badge.good {
  background: #fef3c7;
  color: #d97706;
}

.score-badge.needs-improvement {
  background: #fef2f2;
  color: #dc2626;
}

.score-main {
  display: flex;
  align-items: center;
  gap: 24px;
}

.score-circle-large {
  position: relative;
  width: 140px;
  height: 140px;
  flex-shrink: 0;
}

.score-ring-large {
  transform: rotate(-90deg);
}

.score-progress {
  transition: stroke-dashoffset 0.8s ease;
}

.score-value-large {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-number {
  font-size: 36px;
  font-weight: 700;
  color: #1e293b;
}

.score-total {
  font-size: 14px;
  color: #94a3b8;
}

.score-info {
  flex: 1;
}

.score-feedback {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

/* 维度评分 */
.dimensions-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.dimensions-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px;
}

.dimensions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dimension-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dimension-name {
  font-size: 14px;
  color: #475569;
}

.dimension-score {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.dimension-bar {
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}

.dimension-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* 中间区域 */
.middle-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .middle-section {
    grid-template-columns: 1fr;
  }
}

/* 卡片通用样式 */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.section-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.section-header.success {
  color: #16a34a;
}

.section-header.success h4 {
  color: #16a34a;
}

.section-header.warning {
  color: #d97706;
}

.section-header.warning h4 {
  color: #d97706;
}

.section-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
}

.list-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-top: 8px;
  flex-shrink: 0;
}

.list-dot.success {
  background: #22c55e;
}

.list-dot.warning {
  background: #f59e0b;
}

/* 问答区域 */
.questions-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.questions-section .section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.question-count {
  margin-left: auto;
  font-size: 13px;
  color: #94a3b8;
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: 12px;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
}

.question-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.question-card.expanded {
  border-color: #6366f1;
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  background: #fafafa;
  transition: background 0.2s;
}

.question-header:hover {
  background: #f8fafc;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.question-index {
  width: 32px;
  height: 32px;
  background: #6366f1;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.question-category {
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
}

.question-score-badge {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
}

.question-score-badge.high {
  background: #f0fdf4;
  color: #16a34a;
}

.question-score-badge.medium {
  background: #fef3c7;
  color: #d97706;
}

.question-score-badge.low {
  background: #fef2f2;
  color: #dc2626;
}

.expand-icon {
  color: #94a3b8;
  transition: transform 0.2s;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.question-content {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.question-text {
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
  margin: 0;
  line-height: 1.5;
}

.question-detail {
  padding: 20px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-box {
  background: white;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 10px;
}

.detail-text {
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
  margin: 0;
}

.detail-text.no-answer {
  color: #94a3b8;
  font-style: italic;
}

.ai-feedback {
  border-color: #c7d2fe;
  background: #eef2ff;
}

.ai-feedback .detail-label {
  color: #6366f1;
}

.reference {
  border-color: #fde68a;
  background: #fffbeb;
}

.reference .detail-label {
  color: #d97706;
}

.reference-text {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.5);
  padding: 12px;
  border-radius: 6px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
