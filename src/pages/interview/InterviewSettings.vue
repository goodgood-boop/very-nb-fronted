<template>
  <div class="interview-settings-page">
    <!-- 返回按钮 -->
    <button class="back-btn" @click="goBack">
      <span class="back-icon">←</span>
      <span>返回</span>
    </button>

    <div class="page-header">
      <h1 class="page-title">面试设置</h1>
      <p class="page-subtitle">配置您的 AI 模拟面试参数</p>
    </div>

    <!-- 已选简历信息 -->
    <div v-if="selectedResume" class="selected-resume">
      <div class="section-title">已选简历</div>
      <div class="resume-info-card">
        <div class="resume-icon">📄</div>
        <div class="resume-details">
          <div class="resume-name">{{ selectedResume.filename }}</div>
          <div class="resume-meta">
            <span>{{ formatDate(selectedResume.uploadedAt) }}</span>
            <span>{{ formatFileSize(selectedResume.fileSize) }}</span>
          </div>
        </div>
        <button class="change-btn" @click="changeResume">更换</button>
      </div>
    </div>

    <!-- 面试设置表单 -->
    <div class="settings-form">
      <div class="section-title">面试配置</div>
      
      <!-- 岗位类型 -->
      <div class="form-item">
        <label class="form-label">
          <span class="label-icon">💼</span>
          岗位类型
        </label>
        <div class="job-type-grid">
          <button
            v-for="type in jobTypes"
            :key="type.value"
            class="job-type-btn"
            :class="{ active: settings.jobType === type.value }"
            @click="settings.jobType = type.value"
          >
            <span class="job-icon">{{ type.icon }}</span>
            <span class="job-name">{{ type.label }}</span>
          </button>
        </div>
      </div>

      <!-- 面试时长/题数 -->
      <div class="form-item">
        <label class="form-label">
          <span class="label-icon">📝</span>
          题目数量
          <span class="question-count">{{ settings.questionCount }} 题</span>
        </label>
        <div class="slider-container">
          <input
            v-model.number="settings.questionCount"
            type="range"
            min="3"
            max="10"
            step="1"
            class="slider"
          />
          <div class="slider-labels">
            <span>3题</span>
            <span>10题</span>
          </div>
        </div>
        <p class="form-hint">建议 5-8 题，每题预计 3-5 分钟</p>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="action-bar">
      <button class="btn secondary" @click="goBack">上一步</button>
      <button class="btn primary" @click="startInterview">
        <span class="btn-icon">🚀</span>
        开始面试
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 已选简历
const selectedResume = ref(null)
// 已选知识库
const selectedKnowledgeBases = ref([])

// 面试设置（仅保留后端支持的参数）
const settings = ref({
  jobType: 'frontend',
  questionCount: 5
})

// 岗位类型选项
const jobTypes = [
  { value: 'frontend', label: '前端开发', icon: '💻' },
  { value: 'backend', label: '后端开发', icon: '⚙️' },
  { value: 'algorithm', label: '算法工程师', icon: '📊' },
  { value: 'fullstack', label: '全栈开发', icon: '🚀' },
  { value: 'mobile', label: '移动端开发', icon: '📱' },
  { value: 'devops', label: '运维开发', icon: '🔧' }
]

// 加载已选简历和知识库
onMounted(() => {
  const savedResume = localStorage.getItem('selectedResume')
  if (savedResume) {
    try {
      selectedResume.value = JSON.parse(savedResume)
    } catch (e) {
      console.error('解析已选简历失败:', e)
    }
  }
  
  const savedKnowledgeBases = localStorage.getItem('selectedKnowledgeBases')
  if (savedKnowledgeBases) {
    try {
      selectedKnowledgeBases.value = JSON.parse(savedKnowledgeBases)
    } catch (e) {
      console.error('解析已选知识库失败:', e)
    }
  }
  
  // 如果没有选中的简历，返回选择页面
  if (!selectedResume.value) {
    router.replace('/app/home/interview/resume-select')
  }
  
  // 如果没有选中的知识库，返回知识库选择页面
  if (selectedKnowledgeBases.value.length === 0) {
    router.replace('/app/home/interview/knowledgebase-select')
  }
})

// 返回上一页
const goBack = () => {
  router.push('/app/home/interview/knowledgebase-select')
}

// 更换简历
const changeResume = () => {
  router.push('/app/home/interview/select-resume')
}

// 开始面试
const startInterview = () => {
  // 保存面试设置
  localStorage.setItem('interviewSettings', JSON.stringify({
    ...settings.value,
    resumeId: selectedResume.value.id,
    knowledgeBaseIds: selectedKnowledgeBases.value
  }))
  
  // 跳转到面试房间
  router.push('/app/home/interview/room')
}

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<style scoped>
.interview-settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: var(--bg0);
  position: relative;
  overflow-y: auto;
}

/* 返回按钮 */
.back-btn {
  position: absolute;
  top: 16px;
  left: 16px;
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
  z-index: 10;
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

/* 页面头部 */
.page-header {
  text-align: center;
  margin-bottom: 24px;
  margin-top: 40px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 8px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--muted);
  margin: 0;
}

/* 区块标题 */
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 已选简历 */
.selected-resume {
  margin-bottom: 24px;
}

.resume-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--panel-hover);
  border: 1px solid var(--stroke);
  border-radius: 16px;
}

.resume-icon {
  font-size: 32px;
}

.resume-details {
  flex: 1;
  min-width: 0;
}

.resume-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resume-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--muted);
}

.change-btn {
  padding: 8px 16px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.change-btn:hover {
  border-color: var(--brand);
  background: var(--panel2);
}

/* 设置表单 */
.settings-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.label-icon {
  font-size: 18px;
}

.question-count {
  margin-left: auto;
  padding: 4px 12px;
  background: var(--brand);
  color: white;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.form-hint {
  font-size: 12px;
  color: var(--muted);
  margin: 0;
}

/* 岗位类型网格 */
.job-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.job-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--panel);
  border: 2px solid var(--stroke);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.job-type-btn:hover {
  border-color: var(--brand);
  transform: translateY(-2px);
}

.job-type-btn.active {
  border-color: var(--brand);
  background: var(--panel-hover);
  box-shadow: 0 8px 24px var(--shadow-hover);
}

.job-icon {
  font-size: 24px;
}

.job-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

/* 滑块 */
.slider-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--panel);
  border-radius: 4px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background: var(--brand);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px var(--shadow);
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px var(--shadow-hover);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--muted);
}

/* 底部操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid var(--stroke);
  margin-top: 24px;
}

/* 按钮样式 */
.btn {
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn.primary {
  background: var(--brand);
  color: white;
  box-shadow: 0 4px 16px var(--shadow);
}

.btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--shadow-hover);
}

.btn.secondary {
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--stroke);
}

.btn.secondary:hover {
  background: var(--panel2);
  border-color: var(--brand);
}

.btn-icon {
  font-size: 18px;
}

/* 滚动条样式 */
.interview-settings-page::-webkit-scrollbar {
  width: 6px;
}

.interview-settings-page::-webkit-scrollbar-track {
  background: transparent;
}

.interview-settings-page::-webkit-scrollbar-thumb {
  background: var(--stroke);
  border-radius: 3px;
}

.interview-settings-page::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
}
</style>
