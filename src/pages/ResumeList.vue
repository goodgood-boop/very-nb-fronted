<template>
  <div class="resume-list-page">
    <!-- 头部 -->
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="router.back()">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
        <div>
          <h1 class="page-title">简历库</h1>
          <p class="page-subtitle">管理您已分析过的所有简历及面试记录</p>
        </div>
      </div>
      
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          v-model="searchTerm"
          placeholder="搜索简历..."
          class="search-input"
        />
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredResumes.length === 0" class="empty-state">
      <div class="empty-icon">📄</div>
      <h3>暂无简历记录</h3>
      <p>上传简历开始您的第一次 AI 面试分析</p>
      <button class="btn primary" @click="router.push('/app/interview')">
        上传简历
      </button>
    </div>

    <!-- 简历列表 -->
    <div v-else class="resume-table-container">
      <table class="resume-table">
        <thead>
          <tr>
            <th>简历名称</th>
            <th>上传日期</th>
            <th>AI 评分</th>
            <th>面试状态</th>
            <th class="action-col"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="resume in filteredResumes"
            :key="resume.id"
            @click="viewResumeDetail(resume.id)"
            class="resume-row"
          >
            <td>
              <div class="resume-name-cell">
                <div class="file-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                </div>
                <span class="filename">{{ resume.filename }}</span>
              </div>
            </td>
            <td class="date-cell">{{ formatDate(resume.uploadedAt) }}</td>
            <td>
              <div v-if="resume.latestScore !== undefined" class="score-cell">
                <div class="score-bar">
                  <div
                    class="score-fill"
                    :class="getScoreColorClass(resume.latestScore)"
                    :style="{ width: resume.latestScore + '%' }"
                  ></div>
                </div>
                <span class="score-value">{{ resume.latestScore }}</span>
              </div>
              <span v-else class="no-score">-</span>
            </td>
            <td>
              <span v-if="resume.interviewCount > 0" class="status-badge completed">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="9,12 11,14 15,10"/>
                </svg>
                已完成 {{ resume.interviewCount }} 次面试
              </span>
              <span v-else class="status-badge pending">待面试</span>
            </td>
            <td class="action-col">
              <div class="action-buttons">
                <button
                  class="action-btn delete"
                  @click.stop="confirmDelete(resume)"
                  :disabled="deletingId === resume.id"
                  title="删除简历"
                >
                  <svg v-if="deletingId !== resume.id" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"/>
                    <path d="M10 11V17M14 11V17"/>
                  </svg>
                  <span v-else class="spinner-small"></span>
                </button>
                <svg class="arrow-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 删除确认对话框 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" class="warning-icon">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <h3>确认删除</h3>
            </div>
            <div class="modal-body">
              <p v-if="deleteTarget">
                确定要删除简历 <strong>"{{ deleteTarget.filename }}"</strong> 吗？
              </p>
              <p class="hint-text">删除后将同时删除：</p>
              <ul class="delete-list">
                <li>简历评价记录</li>
                <li>所有模拟面试记录</li>
              </ul>
              <p class="warning-text">此操作不可恢复！</p>
            </div>
            <div class="modal-footer">
              <button class="btn secondary" @click="showDeleteModal = false">取消</button>
              <button class="btn danger" @click="handleDelete" :disabled="deletingId !== null">
                <span v-if="deletingId" class="spinner-small"></span>
                {{ deletingId ? '删除中...' : '确认删除' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { resumeApi } from '../api/resume.js'

const router = useRouter()

// 状态
const resumes = ref([])
const loading = ref(true)
const searchTerm = ref('')
const deletingId = ref(null)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)

// 过滤后的简历列表
const filteredResumes = computed(() => {
  if (!searchTerm.value) return resumes.value
  const term = searchTerm.value.toLowerCase()
  return resumes.value.filter(r => r.filename.toLowerCase().includes(term))
})

// 加载简历列表
const loadResumes = async () => {
  loading.value = true
  try {
    const data = await resumeApi.getResumes()
    resumes.value = data || []
  } catch (err) {
    console.error('加载简历列表失败', err)
  } finally {
    loading.value = false
  }
}

// 查看简历详情
const viewResumeDetail = (id) => {
  router.push(`/app/resume-analysis/${id}`)
}

// 确认删除
const confirmDelete = (resume) => {
  deleteTarget.value = resume
  showDeleteModal.value = true
}

// 删除简历
const handleDelete = async () => {
  if (!deleteTarget.value) return
  
  deletingId.value = deleteTarget.value.id
  try {
    await resumeApi.deleteResume(deleteTarget.value.id)
    // 重新加载列表
    await loadResumes()
    showDeleteModal.value = false
    deleteTarget.value = null
  } catch (err) {
    console.error('删除简历失败', err)
    alert('删除失败，请稍后重试')
  } finally {
    deletingId.value = null
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 获取评分颜色类
const getScoreColorClass = (score) => {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

// 初始化
onMounted(() => {
  loadResumes()
})
</script>

<style scoped>
.resume-list-page {
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
  flex-wrap: wrap;
  gap: 16px;
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

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px;
}

.empty-state p {
  color: #6b7280;
  margin: 0 0 24px;
}

.resume-table-container {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.resume-table {
  width: 100%;
  border-collapse: collapse;
}

.resume-table th {
  text-align: left;
  padding: 16px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.resume-table td {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.resume-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.resume-row:hover {
  background-color: #f9fafb;
}

.resume-row:last-child td {
  border-bottom: none;
}

.resume-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  width: 40px;
  height: 40px;
  background: #eef2ff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
}

.filename {
  font-weight: 500;
  color: #111827;
}

.date-cell {
  color: #6b7280;
}

.score-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-bar {
  width: 80px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.score-fill.high {
  background: #10b981;
}

.score-fill.medium {
  background: #f59e0b;
}

.score-fill.low {
  background: #ef4444;
}

.score-value {
  font-weight: 600;
  color: #111827;
}

.no-score {
  color: #9ca3af;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.status-badge.completed {
  background: #d1fae5;
  color: #059669;
}

.status-badge.pending {
  background: #f3f4f6;
  color: #6b7280;
}

.action-col {
  width: 100px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.arrow-icon {
  color: #d1d5db;
  transition: all 0.2s;
}

.resume-row:hover .arrow-icon {
  color: #6366f1;
  transform: translateX(4px);
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

/* 模态框样式 */
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
  max-width: 420px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 0;
}

.warning-icon {
  color: #f59e0b;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-body {
  padding: 16px 20px;
}

.modal-body p {
  margin: 0 0 12px;
  color: #374151;
}

.hint-text {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.delete-list {
  margin: 0 0 12px;
  padding-left: 20px;
  color: #6b7280;
  font-size: 14px;
}

.delete-list li {
  margin-bottom: 4px;
}

.warning-text {
  color: #ef4444;
  font-weight: 600;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 20px 20px;
}

.btn {
  padding: 10px 20px;
  border-radius: 10px;
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

.btn.danger:hover {
  background: #dc2626;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
