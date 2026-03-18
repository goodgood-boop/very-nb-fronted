<template>
  <div 
    class="left-column" 
    :class="{ expanded }"
    @mouseenter="$emit('hover-change', true)"
    @mouseleave="$emit('hover-change', false)"
  >
    <div class="column-content">
      <!-- 1. 标签切换器：使用 fade-slide 动画 -->
      <Transition name="fade-slide">
        <div v-if="expanded" class="tab-switcher">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'record' }"
            @click="activeTab = 'record'"
          >
            面试记录
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'knowledge' }"
            @click="activeTab = 'knowledge'"
          >
            知识库
          </button>
        </div>
      </Transition>

      <!-- 内容区域 -->
      <div class="content-area">
        <!-- 2. 列表视图 vs 详情视图：使用 fade 动画 -->
        <Transition name="fade" mode="out-in">
          <div v-if="currentView === 'list'" class="list-view" key="list">
            <!-- 面试记录标签页 -->
            <div v-if="activeTab === 'record'" class="record-tab">
              <!-- 收缩状态：使用 v-if 而不是 v-show 来触发动画 -->
              <template v-if="!expanded">
                <!-- 记录列表：使用 TransitionGroup 让每个项目都有动画 -->
                <TransitionGroup name="list" tag="div" class="record-list compact">
                  <div 
                    v-for="(record, index) in recentRecords" 
                    :key="record.id"
                    class="record-item compact"
                    @click="viewRecordDetail(record)"
                  >
                    <div class="record-icon">📄</div>
                    <div class="record-info">
                      <div class="record-title">{{ record.title }}</div>
                      <div class="record-date">{{ formatDate(record.startedAt) }}</div>
                    </div>
                  </div>
                  <div v-if="recentRecords.length === 0" key="empty" class="empty-message">
                    暂无面试记录
                  </div>
                </TransitionGroup>
                
                <!-- 知识库快捷入口：使用 slide-up 动画 -->
                <Transition name="slide-up">
                  <div 
                    v-if="activeTab === 'record'" 
                    class="knowledge-quick-entry" 
                    @click="switchToKnowledgeTab"
                  >
                    <div class="entry-icon">📚</div>
                    <div class="entry-text">
                      <div class="entry-title">知识库</div>
                      <div class="entry-count">{{ knowledgeBases.length }} 个文档</div>
                    </div>
                    <div class="entry-arrow">→</div>
                  </div>
                </Transition>
              </template>

              <!-- 展开状态 -->
              <template v-else>
                <TransitionGroup name="list" tag="div" class="record-list full">
                  <div 
                    v-for="(record, index) in allRecords" 
                    :key="record.id"
                    class="record-item"
                    @click="viewRecordDetail(record)"
                  >
                    <div class="record-icon">📄</div>
                    <div class="record-info">
                      <div class="record-title">{{ record.title }}</div>
                      <div class="record-meta">
                        <span class="record-date">{{ formatDate(record.startedAt) }}</span>
                        <span class="record-score" :class="getScoreClass(record.overall)">
                          {{ record.overall }}分
                        </span>
                      </div>
                      <div class="record-preview">{{ record.notes || '暂无备注' }}</div>
                    </div>
                  </div>
                  <div v-if="allRecords.length === 0" key="empty" class="empty-message">
                    暂无面试记录
                  </div>
                </TransitionGroup>
              </template>
            </div>

            <!-- 知识库标签页 -->
            <div v-else class="knowledge-tab">
              <TransitionGroup name="list" tag="div" class="knowledge-list" :class="{ compact: !expanded }">
                <div 
                  v-for="(kb, index) in knowledgeBases" 
                  :key="kb.id"
                  class="knowledge-item"
                  @click="viewKnowledgeDetail(kb)"
                >
                  <div class="knowledge-icon">📚</div>
                  <div class="knowledge-info">
                    <div class="knowledge-name">{{ kb.name }}</div>
                    <div class="knowledge-meta">
                      <span class="knowledge-category">{{ kb.category || '未分类' }}</span>
                      <span class="knowledge-status" :class="kb.vectorStatus?.toLowerCase()">
                        {{ getStatusText(kb.vectorStatus) }}
                      </span>
                    </div>
                    <div v-if="expanded" class="knowledge-desc">
                      {{ kb.description || '暂无描述' }}
                    </div>
                  </div>
                </div>
                <div v-if="knowledgeBases.length === 0" key="empty" class="empty-message">
                  暂无知识库文档
                </div>
              </TransitionGroup>
            </div>
          </div>

          <!-- 详情视图 -->
          <div v-else class="detail-view" key="detail">
            <button class="back-btn" @click="backToList">
              <span class="back-icon">←</span>
              <span>返回</span>
            </button>

            <!-- 面试记录详情 -->
            <div v-if="detailType === 'record'" class="record-detail">
              <h3 class="detail-title">{{ currentRecord?.title }}</h3>
              <div class="detail-meta">
                <span class="detail-date">{{ formatDateTime(currentRecord?.startedAt) }}</span>
                <span class="detail-score" :class="getScoreClass(currentRecord?.overall)">
                  {{ currentRecord?.overall }}分
                </span>
              </div>
              
              <div class="detail-section">
                <h4>能力维度</h4>
                <div class="dimension-list">
                  <div v-for="dim in currentRecord?.dimensions" :key="dim.k" class="dimension-item">
                    <span class="dimension-name">{{ dim.k }}</span>
                    <span class="dimension-score">{{ dim.v }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h4>面试评价</h4>
                <p class="detail-notes">{{ currentRecord?.notes || '暂无评价' }}</p>
              </div>
            </div>

            <!-- 知识库详情 -->
            <div v-else class="knowledge-detail">
              <h3 class="detail-title">{{ currentKnowledge?.name }}</h3>
              <div class="detail-meta">
                <span class="detail-category">{{ currentKnowledge?.category || '未分类' }}</span>
                <span class="detail-status" :class="currentKnowledge?.vectorStatus?.toLowerCase()">
                  {{ getStatusText(currentKnowledge?.vectorStatus) }}
                </span>
              </div>
              
              <div class="detail-section">
                <h4>文件信息</h4>
                <div class="file-info">
                  <div class="file-row">
                    <span class="file-label">文件名：</span>
                    <span class="file-value">{{ currentKnowledge?.originalFilename }}</span>
                  </div>
                  <div class="file-row">
                    <span class="file-label">大小：</span>
                    <span class="file-value">{{ formatFileSize(currentKnowledge?.fileSize) }}</span>
                  </div>
                  <div class="file-row">
                    <span class="file-label">上传时间：</span>
                    <span class="file-value">{{ formatDateTime(currentKnowledge?.uploadedAt) }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h4>文档描述</h4>
                <p class="detail-desc">{{ currentKnowledge?.description || '暂无描述' }}</p>
              </div>

              <div class="detail-actions">
                <button class="action-btn primary" @click="chatWithKnowledge">
                  <span>💬</span> 基于此文档提问
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRecords } from '../../lib/records'
import { knowledgeBaseApi } from '../../api/knowledgebase'

const props = defineProps({
  expanded: Boolean
})

const emit = defineEmits(['hover-change'])

const router = useRouter()

// 状态管理
const activeTab = ref('record')  // 'record' 或 'knowledge'
const currentView = ref('list')  // 'list' 或 'detail'
const detailType = ref('record') // 'record' 或 'knowledge'
const currentRecord = ref(null)
const currentKnowledge = ref(null)

// 数据源
const allRecords = computed(() => getRecords())
const recentRecords = computed(() => allRecords.value.slice(0, 3))

const knowledgeBases = ref([])

// 加载知识库数据
const loadKnowledgeBases = async () => {
  try {
    const data = await knowledgeBaseApi.getAllKnowledgeBases('time')
    knowledgeBases.value = data || []
  } catch (err) {
    console.error('加载知识库失败:', err)
    knowledgeBases.value = []
  }
}

// 切换到知识库标签（从快捷入口）
const switchToKnowledgeTab = () => {
  activeTab.value = 'knowledge'
}

// 查看记录详情
const viewRecordDetail = (record) => {
  currentRecord.value = record
  detailType.value = 'record'
  currentView.value = 'detail'
}

// 查看知识库详情
const viewKnowledgeDetail = (kb) => {
  currentKnowledge.value = kb
  detailType.value = 'knowledge'
  currentView.value = 'detail'
}

// 返回列表
const backToList = () => {
  currentView.value = 'list'
  currentRecord.value = null
  currentKnowledge.value = null
}

// 基于知识库提问
const chatWithKnowledge = () => {
  if (currentKnowledge.value) {
    router.push({
      path: '/app/knowledge-chat',
      query: { 
        kbId: currentKnowledge.value.id,
        kbName: currentKnowledge.value.name
      }
    })
  }
}

// 格式化函数
const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

const formatDateTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getStatusText = (status) => {
  const map = {
    COMPLETED: '已完成',
    PROCESSING: '处理中',
    PENDING: '待处理',
    FAILED: '失败'
  }
  return map[status] || status || '未知'
}

const getScoreClass = (score) => {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

onMounted(() => {
  loadKnowledgeBases()
})
</script>

<style scoped>
.left-column {
  height: 100%;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.column-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

/* 标签切换器 */
.tab-switcher {
  display: flex;
  gap: 8px;
  padding: 4px;
  background: var(--panel2);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  margin-bottom: 16px;
}

.tab-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--panel);
  color: var(--brand);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 内容区域 */
.content-area {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* 列表视图 */
.list-view {
  height: 100%;
}

/* 面试记录列表 */
.record-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-list.compact {
  height: calc(75% - 8px);
  overflow-y: auto;
}

.record-list.full {
  height: 100%;
  overflow-y: auto;
}

.record-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--panel2);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.record-item:hover {
  background: var(--panel);
  transform: translateX(4px);
}

.record-item.compact {
  padding: 8px 12px;
}

.record-icon {
  width: 32px;
  height: 32px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand);
  font-size: 16px;
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-title {
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-date {
  font-size: 12px;
  color: var(--muted);
}

.record-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.record-score {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
}

.record-score.high {
  background: rgba(54, 211, 153, 0.2);
  color: var(--ok);
}

.record-score.medium {
  background: rgba(245, 158, 11, 0.2);
  color: var(--warn);
}

.record-score.low {
  background: rgba(239, 68, 68, 0.2);
  color: var(--bad);
}

.record-preview {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 知识库快捷入口 */
.knowledge-quick-entry {
  height: 25%;
  margin-top: 8px;
  padding: 12px;
  background: var(--panel2);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.knowledge-quick-entry:hover {
  background: var(--panel);
  transform: translateY(-2px);
}

.entry-icon {
  width: 32px;
  height: 32px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand);
  font-size: 16px;
}

.entry-text {
  flex: 1;
}

.entry-title {
  font-weight: 600;
  color: var(--text);
  font-size: 14px;
}

.entry-count {
  font-size: 12px;
  color: var(--muted);
}

.entry-arrow {
  color: var(--muted2);
  font-size: 18px;
}

/* 知识库列表 */
.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  overflow-y: auto;
}

.knowledge-list.compact {
  height: 100%;
}

.knowledge-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--panel2);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.knowledge-item:hover {
  background: var(--panel);
  transform: translateX(4px);
}

.knowledge-icon {
  width: 32px;
  height: 32px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand);
  font-size: 16px;
}

.knowledge-info {
  flex: 1;
  min-width: 0;
}

.knowledge-name {
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.knowledge-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.knowledge-category {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  color: var(--muted);
  border-radius: 12px;
}

.knowledge-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
}

.knowledge-status.completed {
  background: rgba(54, 211, 153, 0.2);
  color: var(--ok);
}

.knowledge-status.processing {
  background: rgba(100, 108, 255, 0.2);
  color: var(--brand);
}

.knowledge-status.pending {
  background: var(--panel);
  color: var(--muted);
}

.knowledge-status.failed {
  background: rgba(239, 68, 68, 0.2);
  color: var(--bad);
}

.knowledge-desc {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 详情视图 */
.detail-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--stroke);
  background: var(--panel2);
  border-radius: 10px;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 16px;
  align-self: flex-start;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--panel);
  color: var(--text);
}

.back-icon {
  font-size: 16px;
}

/* 记录详情 */
.record-detail,
.knowledge-detail {
  flex: 1;
  overflow-y: auto;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 8px;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--stroke);
}

.detail-date,
.detail-category {
  font-size: 13px;
  color: var(--muted);
}

.detail-score {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 20px;
}

.detail-score.high {
  background: rgba(54, 211, 153, 0.2);
  color: var(--ok);
}

.detail-score.medium {
  background: rgba(245, 158, 11, 0.2);
  color: var(--warn);
}

.detail-score.low {
  background: rgba(239, 68, 68, 0.2);
  color: var(--bad);
}

.detail-status {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 20px;
}

.detail-status.completed {
  background: rgba(54, 211, 153, 0.2);
  color: var(--ok);
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  margin: 0 0 12px;
}

/* 维度列表 */
.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dimension-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--panel2);
  border: 1px solid var(--stroke);
  border-radius: 8px;
}

.dimension-name {
  font-size: 13px;
  color: var(--muted);
}

.dimension-score {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

/* 文件信息 */
.file-info {
  background: var(--panel2);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  padding: 12px;
}

.file-row {
  display: flex;
  padding: 6px 0;
  border-bottom: 1px solid var(--stroke);
}

.file-row:last-child {
  border-bottom: none;
}

.file-label {
  width: 60px;
  font-size: 13px;
  color: var(--muted);
}

.file-value {
  flex: 1;
  font-size: 13px;
  color: var(--text);
}

/* 详情文本 */
.detail-notes,
.detail-desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  background: var(--panel2);
  border: 1px solid var(--stroke);
  padding: 12px;
  border-radius: 12px;
  margin: 0;
}

/* 详情页操作按钮 */
.detail-actions {
  margin-top: 20px;
}

.action-btn {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--brand);
  border-radius: 12px;
  background: var(--brand);
  color: white;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

/* 空状态 */
.empty-message {
  padding: 20px;
  text-align: center;
  color: var(--muted2);
  font-size: 13px;
}

/* 滚动条 */
.record-list::-webkit-scrollbar,
.knowledge-list::-webkit-scrollbar,
.detail-view::-webkit-scrollbar {
  width: 4px;
}

.record-list::-webkit-scrollbar-track,
.knowledge-list::-webkit-scrollbar-track,
.detail-view::-webkit-scrollbar-track {
  background: transparent;
}

.record-list::-webkit-scrollbar-thumb,
.knowledge-list::-webkit-scrollbar-thumb,
.detail-view::-webkit-scrollbar-thumb {
  background: var(--stroke);
  border-radius: 2px;
}
/* 列表项的渐入动画 */
.record-item, .knowledge-item, .knowledge-quick-entry {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 标签切换器淡入 */
.tab-switcher {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 内容区域的高度过渡 */
.record-list, .knowledge-list {
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 收缩状态和展开状态的平滑切换 */
.record-list.compact,
.record-list.full,
.knowledge-list.compact,
.knowledge-list.full {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 快捷入口的悬停效果 */
.knowledge-quick-entry {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.knowledge-quick-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
/* ===== Transition 动画 ===== */

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 带滑动的淡入淡出 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 向上滑动动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 列表项动画 - 这是最关键的 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 列表项移动时的动画 */
.list-move {
  transition: transform 0.3s ease;
}

/* 给列表容器添加 overflow 处理 */
.record-list,
.knowledge-list {
  position: relative;
  overflow: hidden;
}

/* 单个列表项的动画 */
.record-item,
.knowledge-item {
  transition: all 0.2s ease;
  position: relative;
}

/* 悬停效果 */
.record-item:hover,
.knowledge-item:hover {
  transform: translateX(4px);
  background: #f1f5f9;
}

/* 快捷入口动画 */
.knowledge-quick-entry {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: pulseEntry 0.5s ease-out;
}

@keyframes pulseEntry {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 标签切换器动画 */
.tab-switcher {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 详情视图动画 */
.detail-view {
  animation: fadeScale 0.3s ease-out;
}

@keyframes fadeScale {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 返回按钮动画 */
.back-btn {
  transition: all 0.2s ease;
}

.back-btn:hover {
  transform: translateX(-4px);
  background: #f1f5f9;
}

/* 确保动画不影响布局 */
.list-enter-active,
.list-leave-active {
  will-change: transform, opacity;
}
</style>