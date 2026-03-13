<template>
  <div class="interview-history-page">
    <!-- 头部区域 -->
    <MotionDiv
      tag="div"
      class="page-header"
      :initial="{ opacity: 0, y: -20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.5 }"
    >
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h1 class="page-title">面试历史</h1>
          <p class="page-subtitle">查看所有模拟面试记录和统计</p>
        </div>
      </div>
      
      <!-- 搜索框 -->
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input 
          v-model="searchKeyword"
          type="text"
          placeholder="搜索简历名称..."
          class="search-input"
        />
      </div>
    </MotionDiv>

    <!-- 统计卡片区域 -->
    <div class="stats-grid">
      <MotionDiv
        v-for="(stat, index) in statsCards"
        :key="stat.key"
        class="stat-card"
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5, delay: index * 0.1 }"
        :while-hover="{ y: -4, scale: 1.02 }"
      >
        <div class="stat-icon" :class="stat.color">
          <component :is="stat.icon" width="24" height="24" />
        </div>
        <div class="stat-content">
          <p class="stat-label">{{ stat.label }}</p>
          <p class="stat-value">
            {{ stat.value }}
            <span v-if="stat.suffix" class="stat-suffix">{{ stat.suffix }}</span>
          </p>
        </div>
      </MotionDiv>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 面试列表 -->
    <MotionDiv
      v-else
      class="interview-list-card"
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.5, delay: 0.3 }"
    >
      <div class="list-header">
        <h3 class="list-title">面试记录</h3>
        <div class="list-filters">
          <button 
            v-for="filter in filters" 
            :key="filter.key"
            class="filter-btn"
            :class="{ active: currentFilter === filter.key }"
            @click="currentFilter = filter.key"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- 使用虚拟列表 -->
      <VirtualList
        v-if="filteredInterviews.length > 0"
        ref="virtualListRef"
        :items="filteredInterviews"
        :item-height="80"
        :buffer-size="3"
        class="interview-virtual-list"
      >
        <template #default="{ item: interview, index }">
          <MotionDiv
            class="interview-item"
            :initial="{ opacity: 0, x: -20 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.3, delay: index * 0.05 }"
            :while-hover="{ backgroundColor: 'rgba(99, 102, 241, 0.03)' }"
            @click="viewInterview(interview)"
          >
            <div class="item-main">
              <div class="resume-info">
                <div class="file-icon">
                  <FileText width="20" height="20" />
                </div>
                <div class="resume-details">
                  <p class="resume-name">{{ interview.resumeFilename || '未知简历' }}</p>
                  <p class="resume-meta">
                    <span class="meta-item">{{ interview.totalQuestions || 8 }} 题</span>
                    <span class="meta-dot">·</span>
                    <span class="meta-item">{{ formatDate(interview.createdAt) }}</span>
                  </p>
                </div>
              </div>
              
              <div class="item-status">
                <StatusBadge :interview="interview" />
              </div>
              
              <div class="item-score">
                <ScoreDisplay 
                  v-if="isEvaluateCompleted(interview) && interview.overallScore !== null"
                  :score="interview.overallScore"
                />
                <span v-else-if="isEvaluating(interview)" class="evaluating-badge">
                  <Loader2 width="14" height="14" class="animate-spin" />
                  评估中
                </span>
                <span v-else class="no-score">-</span>
              </div>
            </div>
            
            <div class="item-actions" @click.stop>
              <button 
                v-if="isEvaluateCompleted(interview)"
                class="action-btn"
                title="导出PDF"
                @click="exportInterview(interview)"
                :disabled="exporting === interview.sessionId"
              >
                <Download v-if="exporting !== interview.sessionId" width="16" height="16" />
                <Loader2 v-else width="16" height="16" class="animate-spin" />
              </button>
              <button 
                class="action-btn delete"
                title="删除"
                @click="confirmDelete(interview)"
              >
                <Trash2 width="16" height="16" />
              </button>
              <ChevronRight width="20" height="20" class="arrow-icon" />
            </div>
          </MotionDiv>
        </template>
      </VirtualList>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <Users width="48" height="48" />
        </div>
        <h3 class="empty-title">暂无面试记录</h3>
        <p class="empty-desc">开始一次模拟面试后，记录将显示在这里</p>
      </div>
    </MotionDiv>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
          <MotionDiv
            class="modal-content"
            :initial="{ opacity: 0, scale: 0.9 }"
            :animate="{ opacity: 1, scale: 1 }"
            :transition="{ type: 'spring', stiffness: 300, damping: 25 }"
            @click.stop
          >
            <div class="modal-header">
              <AlertCircle width="24" height="24" class="warning-icon" />
              <h3>确认删除</h3>
            </div>
            <div class="modal-body">
              <p>确定要删除这次面试记录吗？此操作无法撤销。</p>
              <div v-if="deleteTarget" class="delete-info">
                <p><strong>简历：</strong>{{ deleteTarget.resumeFilename }}</p>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn secondary" @click="showDeleteModal = false">取消</button>
              <button class="btn danger" @click="handleDelete" :disabled="deleting">
                <Loader2 v-if="deleting" width="16" height="16" class="animate-spin" />
                {{ deleting ? '删除中...' : '确认删除' }}
              </button>
            </div>
          </MotionDiv>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Users, 
  CheckCircle, 
  TrendingUp, 
  FileText, 
  Download, 
  Trash2, 
  ChevronRight,
  Loader2,
  AlertCircle,
  Search
} from 'lucide-vue-next'
import { MotionDiv } from '../components/motion'
import VirtualList from '../components/VirtualList.vue'
import { interviewApi } from '../api/interview'
import StatusBadge from '../components/StatusBadge.vue'
import ScoreDisplay from '../components/ScoreDisplay.vue'

const router = useRouter()

// 状态
const interviews = ref([])
const loading = ref(true)
const searchKeyword = ref('')
const currentFilter = ref('all')
const exporting = ref(null)
const deleting = ref(false)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const virtualListRef = ref(null)
const pollingTimer = ref(null)

// 筛选选项
const filters = [
  { key: 'all', label: '全部' },
  { key: 'completed', label: '已完成' },
  { key: 'in_progress', label: '进行中' }
]

// 统计卡片数据
const statsCards = computed(() => [
  {
    key: 'total',
    label: '面试总数',
    value: stats.value?.totalCount || 0,
    icon: Users,
    color: 'blue'
  },
  {
    key: 'completed',
    label: '已完成',
    value: stats.value?.completedCount || 0,
    icon: CheckCircle,
    color: 'green'
  },
  {
    key: 'average',
    label: '平均分数',
    value: stats.value?.averageScore || 0,
    suffix: '分',
    icon: TrendingUp,
    color: 'purple'
  }
])

// 统计数据
const stats = computed(() => {
  const total = interviews.value.length
  const completed = interviews.value.filter(i => isEvaluateCompleted(i)).length
  const scored = interviews.value.filter(i => isEvaluateCompleted(i) && i.overallScore !== null)
  const average = scored.length > 0 
    ? Math.round(scored.reduce((sum, i) => sum + i.overallScore, 0) / scored.length)
    : 0
  
  return { totalCount: total, completedCount: completed, averageScore: average }
})

// 筛选后的面试列表
const filteredInterviews = computed(() => {
  let result = interviews.value
  
  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(i => 
      (i.resumeFilename || '').toLowerCase().includes(keyword)
    )
  }
  
  // 状态筛选
  if (currentFilter.value === 'completed') {
    result = result.filter(i => isEvaluateCompleted(i))
  } else if (currentFilter.value === 'in_progress') {
    result = result.filter(i => !isEvaluateCompleted(i) && i.status === 'IN_PROGRESS')
  }
  
  return result
})

// 状态判断函数
function isEvaluateCompleted(interview) {
  if (interview.evaluateStatus === 'COMPLETED') return true
  if (interview.status === 'EVALUATED') return true
  return false
}

function isEvaluating(interview) {
  return interview.evaluateStatus === 'PENDING' || interview.evaluateStatus === 'PROCESSING'
}

function isEvaluateFailed(interview) {
  return interview.evaluateStatus === 'FAILED'
}

// 加载数据
const loadData = async () => {
  try {
    loading.value = true
    const data = await interviewApi.getInterviewHistory()
    interviews.value = data || []
  } catch (err) {
    console.error('加载面试历史失败', err)
  } finally {
    loading.value = false
  }
}

// 轮询更新（有评估中的面试时）
const startPolling = () => {
  if (pollingTimer.value) return
  pollingTimer.value = setInterval(() => {
    const hasEvaluating = interviews.value.some(i => isEvaluating(i))
    if (hasEvaluating) {
      loadData()
    }
  }, 5000)
}

const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}

// 查看面试详情
const viewInterview = (interview) => {
  router.push(`/interview-detail/${interview.sessionId}`)
}

// 导出面试
const exportInterview = async (interview) => {
  try {
    exporting.value = interview.sessionId
    // 导出逻辑
    const blob = await interviewApi.exportReport(interview.sessionId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `面试报告_${interview.resumeFilename || '未知'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('导出失败', err)
    alert('导出失败：' + err.message)
  } finally {
    exporting.value = null
  }
}

// 删除确认
const confirmDelete = (interview) => {
  deleteTarget.value = interview
  showDeleteModal.value = true
}

// 执行删除
const handleDelete = async () => {
  if (!deleteTarget.value) return
  
  try {
    deleting.value = true
    await interviewApi.deleteSession(deleteTarget.value.sessionId)
    interviews.value = interviews.value.filter(
      i => i.sessionId !== deleteTarget.value.sessionId
    )
    showDeleteModal.value = false
  } catch (err) {
    console.error('删除失败', err)
    alert('删除失败：' + err.message)
  } finally {
    deleting.value = false
    deleteTarget.value = null
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 格式化日期
const formatDate = (dateStr) => {
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

onMounted(() => {
  loadData()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.interview-history-page {
  padding: 24px;
  width: 100%;
  max-width: none;
  margin: 0;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-back {
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0;
}

.search-box {
  position: relative;
  width: 280px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  background: white;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f3f4f6;
  cursor: pointer;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.blue {
  background: #eff6ff;
  color: #3b82f6;
}

.stat-icon.green {
  background: #f0fdf4;
  color: #22c55e;
}

.stat-icon.purple {
  background: #faf5ff;
  color: #a855f7;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.stat-suffix {
  font-size: 16px;
  font-weight: 500;
  color: #9ca3af;
  margin-left: 4px;
}

.interview-list-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f3f4f6;
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.list-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.list-filters {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 6px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #f9fafb;
}

.filter-btn.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.interview-virtual-list {
  height: 500px;
}

.interview-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
}

.interview-item:last-child {
  border-bottom: none;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.resume-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-icon {
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.resume-details {
  flex: 1;
}

.resume-name {
  font-size: 15px;
  font-weight: 500;
  color: #111827;
  margin: 0 0 4px;
}

.resume-meta {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-dot {
  opacity: 0.5;
}

.item-status {
  width: 100px;
}

.item-score {
  width: 120px;
  display: flex;
  justify-content: center;
}

.evaluating-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6366f1;
  padding: 6px 12px;
  background: #eef2ff;
  border-radius: 20px;
}

.no-score {
  font-size: 14px;
  color: #9ca3af;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.action-btn.delete:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #ef4444;
}

.arrow-icon {
  color: #d1d5db;
  margin-left: 8px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: #f9fafb;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d1d5db;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.warning-icon {
  color: #f59e0b;
}

.modal-body {
  padding: 20px 24px;
}

.modal-body p {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px;
}

.delete-info {
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
}

.delete-info p {
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn.secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn.secondary:hover {
  background: #e5e7eb;
}

.btn.danger {
  background: #ef4444;
  color: white;
}

.btn.danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
