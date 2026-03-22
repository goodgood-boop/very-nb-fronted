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
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'stats' }"
            @click="activeTab = 'stats'"
          >
            面试统计
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
              <!-- 加载状态 -->
              <div v-if="loadingRecords" class="loading-state">
                <div class="loading-spinner"></div>
                <p>加载面试记录...</p>
              </div>

              <!-- 收缩状态 -->
              <template v-else-if="!expanded">
                <div class="compact-top-section">
                  <TransitionGroup name="list" tag="div" class="record-list compact">
                    <div 
                      v-for="record in recentRecords" 
                      :key="record.sessionId"
                      class="record-item compact"
                      @click="viewRecordDetail(record)"
                    >
                      <div class="record-icon">📄</div>
                      <div class="record-info">
                        <div class="record-title">{{ getInterviewTitle(record) }}</div>
                        <div class="record-date">{{ formatDate(record.createdAt) }}</div>
                      </div>
                    </div>
                    <div v-if="recentRecords.length === 0" key="empty" class="empty-message">
                      暂无面试记录
                    </div>
                  </TransitionGroup>
                  
                  <!-- 知识库快捷入口 -->
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
                </div>

                <!-- 收缩状态下的统计概览（下方50%） -->
                <div class="compact-stats-section">
                  <div class="compact-stats-header">
                    <span class="stats-title">📈 成长概览</span>
                    <span v-if="analytics.points.length > 0" class="stats-trend" :class="getTrendClass()">
                      {{ getTrendText() }}
                    </span>
                  </div>
                  
                  <!-- 迷你成长曲线 -->
                  <div class="mini-chart-container">
                    <canvas ref="miniChartCanvas" class="mini-chart"></canvas>
                  </div>
                  
                  <!-- 综合评分 -->
                  <div class="compact-score-row">
                    <div class="compact-score-item">
                      <div class="score-value" :class="getScoreClass(analytics.avgScore)">{{ analytics.avgScore }}</div>
                      <div class="score-label">平均分</div>
                    </div>
                    <div class="compact-score-item">
                      <div class="score-value">{{ analytics.totalCount }}</div>
                      <div class="score-label">面试次数</div>
                    </div>
                    <div class="compact-score-item">
                      <div class="score-value" :class="getImprovementClass()">{{ getImprovementValue() }}</div>
                      <div class="score-label">较上周</div>
                    </div>
                  </div>
                  
                  <!-- 建议卡片 -->
                  <div v-if="suggestions.length > 0" class="compact-suggestion-card">
                    <div class="suggestion-title">💡 提升建议</div>
                    <div class="suggestion-text">{{ suggestions[0] }}</div>
                  </div>
                  
                  <!-- 面试统计摘要 -->
                  <div v-if="filteredAnalytics.totalCount > 0" class="compact-summary-card">
                    <div class="summary-title">📊 统计摘要</div>
                    <div class="summary-text">
                      近{{ timeRange === 'week' ? '7天' : '30天' }}完成 {{ filteredAnalytics.totalCount }} 次面试
                    </div>
                  </div>
                </div>
              </template>

              <!-- 展开状态 -->
              <template v-else>
                <!-- 筛选栏 -->
                <div class="filter-bar">
                  <button 
                    class="filter-btn" 
                    :class="{ active: recordFilter === 'all' }"
                    @click="recordFilter = 'all'"
                  >
                    全部
                  </button>
                  <button 
                    class="filter-btn" 
                    :class="{ active: recordFilter === 'unfinished' }"
                    @click="recordFilter = 'unfinished'"
                  >
                    未完成
                  </button>
                  <button 
                    class="filter-btn" 
                    :class="{ active: recordFilter === 'completed' }"
                    @click="recordFilter = 'completed'"
                  >
                    已完成
                  </button>
                </div>
                
                <!-- 搜索栏 -->
                <div class="search-bar">
                  <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    v-model="recordSearchTerm"
                    type="text"
                    placeholder="搜索面试记录..."
                    class="search-input"
                  />
                  <button v-if="recordSearchTerm" class="search-clear" @click="recordSearchTerm = ''">×</button>
                </div>
                <TransitionGroup name="list" tag="div" class="record-list full">
                  <div 
                    v-for="record in filteredInterviewRecords" 
                    :key="record.sessionId"
                    class="record-item"
                  >
                    <div class="record-content" @click="viewRecordDetail(record)">
                      <div class="record-icon">📄</div>
                      <div class="record-info">
                        <div class="record-title">{{ getInterviewTitle(record) }}</div>
                        <div class="record-meta">
                          <span class="record-date">{{ formatDate(record.createdAt) }}</span>
                          <span class="record-questions">{{ record.totalQuestions || 0 }}题</span>
                          <span v-if="record.overallScore" class="record-score" :class="getScoreClass(record.overallScore)">
                            {{ record.overallScore }}分
                          </span>
                          <span v-else class="record-status" :class="record.status?.toLowerCase()">
                            {{ getStatusText(record.status) }}
                          </span>
                        </div>
                        <div class="record-preview">{{ getInterviewPreview(record) }}</div>
                      </div>
                    </div>
                    <div class="record-actions">
                      <button 
                        class="action-btn delete" 
                        @click.stop="confirmDelete(record, 'record')"
                        title="删除"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div v-if="filteredInterviewRecords.length === 0" key="empty" class="empty-message">
                    {{ recordSearchTerm ? '未找到匹配的记录' : '暂无面试记录' }}
                  </div>
                </TransitionGroup>
              </template>
            </div>

            <!-- 知识库标签页 -->
            <div v-else-if="activeTab === 'knowledge'" class="knowledge-tab">
              <!-- 展开状态：搜索和工具栏 -->
              <template v-if="expanded">
                <div class="knowledge-toolbar">
                  <div class="search-bar">
                    <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      v-model="knowledgeSearchTerm"
                      type="text"
                      placeholder="搜索知识库..."
                      class="search-input"
                      @keyup.enter="searchKnowledgeBases"
                    />
                    <button v-if="knowledgeSearchTerm" class="search-clear" @click="clearKnowledgeSearch">×</button>
                  </div>
                  <button class="toolbar-btn upload" @click="showKnowledgeUpload = true" title="上传文档">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17,8 12,3 7,8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </button>
                  <button class="toolbar-btn refresh" @click="loadKnowledgeBases" title="刷新" :class="{ spinning: loadingKnowledge }">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="23,4 23,10 17,10"/>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                  </button>
                </div>
                <TransitionGroup name="list" tag="div" class="knowledge-list full">
                  <div 
                    v-for="kb in filteredKnowledgeBases" 
                    :key="kb.id"
                    class="knowledge-item"
                    :class="{ disabled: kb.vectorStatus !== 'COMPLETED' }"
                  >
                    <div class="knowledge-icon">📚</div>
                    <div class="knowledge-info" @click="viewKnowledgeDetail(kb)">
                      <div class="knowledge-name">{{ kb.name }}</div>
                      <div class="knowledge-meta">
                        <span class="knowledge-size">{{ formatFileSize(kb.fileSize) }}</span>
                        <span class="knowledge-status" :class="kb.vectorStatus?.toLowerCase()">
                          {{ getStatusText(kb.vectorStatus) }}
                      </span>
                      </div>
                      <div class="knowledge-desc">{{ kb.description || '暂无描述' }}</div>
                    </div>
                    <div class="knowledge-actions">
                      <button 
                        class="action-btn download" 
                        @click.stop="downloadKnowledge(kb)"
                        :disabled="kb.vectorStatus !== 'COMPLETED'"
                        title="下载"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7,10 12,15 17,10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                      <button 
                        class="action-btn chat" 
                        @click.stop="chatWithKnowledgeItem(kb)"
                        :disabled="kb.vectorStatus !== 'COMPLETED'"
                        title="问答"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                        </svg>
                      </button>
                      <button 
                        class="action-btn delete" 
                        @click.stop="confirmDelete(kb, 'knowledge')"
                        title="删除"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div v-if="filteredKnowledgeBases.length === 0" key="empty" class="empty-message">
                    {{ knowledgeSearchTerm ? '未找到匹配的文档' : '暂无知识库文档' }}
                  </div>
                </TransitionGroup>
              </template>
              <!-- 收缩状态：简化列表 -->
              <TransitionGroup v-else name="list" tag="div" class="knowledge-list compact">
                <div 
                  v-for="kb in knowledgeBases.slice(0, 3)" 
                  :key="kb.id"
                  class="knowledge-item compact"
                  @click="viewKnowledgeDetail(kb)"
                >
                  <div class="knowledge-icon">📚</div>
                  <div class="knowledge-info">
                    <div class="knowledge-name">{{ kb.name }}</div>
                    <div class="knowledge-meta">
                      <span class="knowledge-status" :class="kb.vectorStatus?.toLowerCase()">
                        {{ getStatusText(kb.vectorStatus) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="knowledgeBases.length === 0" key="empty" class="empty-message">
                  暂无知识库文档
                </div>
              </TransitionGroup>
            </div>

            <!-- 面试统计标签页（展开状态） -->
            <div v-else-if="activeTab === 'stats'" class="stats-tab">
              <div class="stats-content">
                <!-- 时间范围切换 -->
                <div class="time-range-switcher">
                  <button 
                    class="range-btn" 
                    :class="{ active: timeRange === 'week' }"
                    @click="timeRange = 'week'"
                  >
                    近一周
                  </button>
                  <button 
                    class="range-btn" 
                    :class="{ active: timeRange === 'month' }"
                    @click="timeRange = 'month'"
                  >
                    近一月
                  </button>
                </div>

                <!-- 统计概览卡片 -->
                <div class="stats-overview">
                  <div class="overview-card">
                    <div class="overview-icon">📊</div>
                    <div class="overview-info">
                      <div class="overview-value">{{ filteredAnalytics.avgScore }}</div>
                      <div class="overview-label">平均分</div>
                    </div>
                  </div>
                  <div class="overview-card">
                    <div class="overview-icon">📝</div>
                    <div class="overview-info">
                      <div class="overview-value">{{ filteredAnalytics.totalCount }}</div>
                      <div class="overview-label">面试次数</div>
                    </div>
                  </div>
                  <div class="overview-card">
                    <div class="overview-icon">📈</div>
                    <div class="overview-info">
                      <div class="overview-value" :class="getImprovementClass()">{{ getImprovementValue() }}</div>
                      <div class="overview-label">成长幅度</div>
                    </div>
                  </div>
                </div>

                <!-- 成长曲线 -->
                <div class="chart-section">
                  <div class="section-header">
                    <span class="section-title">成长曲线</span>
                    <span class="section-subtitle">分数变化趋势</span>
                  </div>
                  <div class="chart-container">
                    <canvas ref="statsChartCanvas" class="stats-chart"></canvas>
                  </div>
                </div>

                <!-- 提升建议 -->
                <div class="suggestions-section">
                  <div class="section-header">
                    <span class="section-title">💡 提升建议</span>
                  </div>
                  
                  <!-- 建议列表 -->
                  <div v-if="suggestions.length > 0" class="suggestion-list">
                    <div v-for="(suggestion, idx) in suggestions" :key="idx" class="suggestion-item">
                      <span class="suggestion-num">{{ idx + 1 }}</span>
                      <span class="suggestion-text">{{ suggestion }}</span>
                    </div>
                  </div>
                  <div v-else class="empty-suggestion">
                    <p>暂无建议，开始更多面试来获取个性化建议</p>
                  </div>
                </div>
              </div>
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
              <!-- 加载状态 -->
              <div v-if="loadingDetail" class="loading-state">
                <div class="loading-spinner"></div>
                <p>加载面试详情...</p>
              </div>

              <template v-else-if="currentRecordDetail">
                <h3 class="detail-title">{{ getInterviewTitle(currentRecordDetail) }}</h3>
                <div class="detail-meta">
                  <span class="detail-date">{{ formatDateTime(currentRecordDetail.createdAt) }}</span>
                  <span v-if="currentRecordDetail.overallScore" class="detail-score" :class="getScoreClass(currentRecordDetail.overallScore)">
                    {{ currentRecordDetail.overallScore }}分
                  </span>
                  <span v-else class="detail-status" :class="currentRecordDetail.status?.toLowerCase()">
                    {{ getStatusText(currentRecordDetail.status) }}
                  </span>
                </div>
                
                <!-- 能力维度 -->
                <div v-if="currentRecordDetail.categoryScores?.length" class="detail-section">
                  <h4>能力维度</h4>
                  <div class="dimension-list">
                    <div v-for="dim in currentRecordDetail.categoryScores" :key="dim.category" class="dimension-item">
                      <span class="dimension-name">{{ dim.category }}</span>
                      <div class="dimension-bar">
                        <div class="dimension-fill" :style="{ width: dim.score + '%' }" :class="getScoreClass(dim.score)"></div>
                      </div>
                      <span class="dimension-score">{{ dim.score }}</span>
                    </div>
                  </div>
                </div>

                <!-- 面试评价 -->
                <div v-if="currentRecordDetail.overallFeedback" class="detail-section">
                  <h4>面试评价</h4>
                  <p class="detail-feedback">{{ currentRecordDetail.overallFeedback }}</p>
                </div>

                <!-- 优点 -->
                <div v-if="currentRecordDetail.strengths?.length" class="detail-section">
                  <h4>优点</h4>
                  <ul class="detail-list">
                    <li v-for="(strength, index) in currentRecordDetail.strengths" :key="index">{{ strength }}</li>
                  </ul>
                </div>

                <!-- 改进建议 -->
                <div v-if="currentRecordDetail.improvements?.length" class="detail-section">
                  <h4>改进建议</h4>
                  <ul class="detail-list">
                    <li v-for="(improvement, index) in currentRecordDetail.improvements" :key="index">{{ improvement }}</li>
                  </ul>
                </div>

                <!-- 问题详情 -->
                <div v-if="currentRecordDetail.questionDetails?.length" class="detail-section">
                  <h4>问题详情 ({{ currentRecordDetail.questionDetails.length }}题)</h4>
                  <div class="question-list">
                    <div v-for="(q, index) in currentRecordDetail.questionDetails" :key="index" class="question-item">
                      <div class="question-header">
                        <span class="question-number">Q{{ index + 1 }}</span>
                        <span v-if="q.score" class="question-score" :class="getScoreClass(q.score)">{{ q.score }}分</span>
                      </div>
                      <p class="question-text">{{ q.question }}</p>
                      <p v-if="q.feedback" class="question-feedback">{{ q.feedback }}</p>
                    </div>
                  </div>
                </div>
              </template>

              <div v-else class="error-state">
                <p>加载失败，请重试</p>
                <button class="btn secondary" @click="reloadDetail">重新加载</button>
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

    <!-- 知识库上传弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showKnowledgeUpload" class="modal-overlay" @click="showKnowledgeUpload = false">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>上传知识库文档</h3>
              <button class="modal-close" @click="showKnowledgeUpload = false">×</button>
            </div>
            <div class="modal-body">
              <div class="upload-form">
                <div class="form-item">
                  <label>选择文件</label>
                  <div class="file-input-wrapper">
                    <input
                      ref="knowledgeFileInput"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.md"
                      @change="handleKnowledgeFileSelect"
                      style="display: none"
                    />
                    <button class="btn secondary" @click="$refs.knowledgeFileInput.click()">
                      {{ knowledgeUploadFile ? knowledgeUploadFile.name : '选择文件' }}
                    </button>
                  </div>
                  <p class="form-hint">支持 PDF、DOC、DOCX、TXT、MD 格式</p>
                </div>
                <div class="form-item">
                  <label>文档名称</label>
                  <input
                    v-model="knowledgeUploadName"
                    type="text"
                    placeholder="输入文档名称"
                    class="form-input"
                  />
                </div>
                <div class="form-item">
                  <label>分类（可选）</label>
                  <input
                    v-model="knowledgeUploadCategory"
                    type="text"
                    placeholder="输入分类"
                    class="form-input"
                  />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn secondary" @click="showKnowledgeUpload = false">取消</button>
              <button 
                class="btn primary" 
                @click="uploadKnowledge"
                :disabled="!knowledgeUploadFile || uploadingKnowledge"
              >
                {{ uploadingKnowledge ? '上传中...' : '上传' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
          <div class="modal-content" @click.stop>
            <div class="modal-header warning">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <h3>确认删除</h3>
            </div>
            <div class="modal-body">
              <p>{{ getDeleteConfirmText() }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn secondary" @click="showDeleteConfirm = false">取消</button>
              <button 
                class="btn danger" 
                @click="doDelete"
                :disabled="deleting"
              >
                {{ deleting ? '删除中...' : '删除' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>


  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { interviewApi } from '../../api/interview.js'
import { resumeApi } from '../../api/resume.js'
import { knowledgeBaseApi } from '../../api/knowledgebase.js'
import dayjs from 'dayjs'

const props = defineProps({
  expanded: Boolean
})

const emit = defineEmits(['hover-change'])

const router = useRouter()

// ==================== 标签页管理 ====================
const activeTab = ref('record')  // 'record' | 'knowledge' | 'stats'
const currentView = ref('list')  // 'list' 或 'detail'
const detailType = ref('record') // 'record' | 'knowledge'
const currentRecord = ref(null)  // 列表中选中的记录（基础信息）
const currentRecordDetail = ref(null)  // 详情数据
const currentKnowledge = ref(null)
const timeRange = ref('week') // 'week' | 'month'

// ==================== 数据加载状态 ====================
const loadingRecords = ref(false)
const loadingDetail = ref(false)
const loadingKnowledge = ref(false)

// ==================== 数据源 ====================
const interviewRecords = ref([])
const knowledgeBases = ref([])

// ==================== 搜索相关 ====================
const recordSearchTerm = ref('')
const knowledgeSearchTerm = ref('')

// ==================== 筛选相关 ====================
const recordFilter = ref('all') // 'all' | 'unfinished' | 'completed'

// ==================== 知识库筛选排序 ====================
const knowledgeSortBy = ref('time') // 'time' | 'size' | 'access' | 'question'
const knowledgeFilterStatus = ref('') // '' | 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'FAILED'
const knowledgeStats = ref({})

// ==================== 知识库上传弹窗 ====================
const showKnowledgeUpload = ref(false)
const knowledgeUploadFile = ref(null)
const knowledgeUploadName = ref('')
const knowledgeUploadCategory = ref('')
const uploadingKnowledge = ref(false)

// ==================== 删除确认弹窗 ====================
const showDeleteConfirm = ref(false)
const deleteTarget = ref(null)
const deleteTargetType = ref('') // 'knowledge' | 'record'
const deleting = ref(false)

// ==================== Canvas refs ====================
const miniChartCanvas = ref(null)
const statsChartCanvas = ref(null)

// ==================== 计算属性：过滤后的面试记录 ====================
const filteredInterviewRecords = computed(() => {
  let records = interviewRecords.value
  
  // 状态筛选
  if (recordFilter.value === 'unfinished') {
    records = records.filter(r => ['CREATED', 'IN_PROGRESS'].includes(r.status))
  } else if (recordFilter.value === 'completed') {
    records = records.filter(r => ['COMPLETED', 'EVALUATED'].includes(r.status))
  }
  
  // 搜索筛选
  if (recordSearchTerm.value) {
    const term = recordSearchTerm.value.toLowerCase()
    records = records.filter(r => 
      getInterviewTitle(r).toLowerCase().includes(term) ||
      (r.resumeName && r.resumeName.toLowerCase().includes(term))
    )
  }
  
  return records
})

// ==================== 计算属性：过滤后的知识库 ====================
const filteredKnowledgeBases = computed(() => {
  if (!knowledgeSearchTerm.value) return knowledgeBases.value
  const term = knowledgeSearchTerm.value.toLowerCase()
  return knowledgeBases.value.filter(kb => 
    kb.name.toLowerCase().includes(term) ||
    (kb.description && kb.description.toLowerCase().includes(term)) ||
    (kb.category && kb.category.toLowerCase().includes(term))
  )
})

// ==================== 计算属性：最近3条记录 ====================
const recentRecords = computed(() => interviewRecords.value.slice(0, 3))

// ==================== 计算属性：基于后端数据的统计分析 ====================
// 从面试记录计算统计数据（基于后端API返回的真实数据）
const analytics = computed(() => {
  const recs = interviewRecords.value
  
  // 按时间排序（时间戳升序）
  const sortedRecs = [...recs].sort((a, b) => 
    new Date(a.createdAt || a.startedAt) - new Date(b.createdAt || b.startedAt)
  )
  
  // 生成数据点
  const points = sortedRecs.map(r => ({
    x: dayjs(r.createdAt || r.startedAt).format('MM-DD'),
    y: r.overallScore || r.score || 0
  })).filter(p => p.y > 0)
  
  // 计算平均分
  const avgScore = points.length > 0 
    ? Math.round(points.reduce((sum, p) => sum + p.y, 0) / points.length)
    : 0
  
  // 计算趋势（移动平均）
  const trend = points.map((p, i) => {
    const window = points.slice(Math.max(0, i - 2), i + 1)
    const avg = window.reduce((s, t) => s + t.y, 0) / window.length
    return { x: p.x, y: Math.round(avg) }
  })
  
  return {
    recs: sortedRecs,
    points,
    trend,
    avgScore,
    totalCount: recs.length
  }
})

// ==================== 计算属性：根据时间范围过滤数据 ====================
const filteredAnalytics = computed(() => {
  const days = timeRange.value === 'week' ? 7 : 30
  const cutoffDate = dayjs().subtract(days, 'day')
  
  const filteredRecs = analytics.value.recs.filter(r => 
    dayjs(r.createdAt || r.startedAt).isAfter(cutoffDate)
  )
  
  const points = filteredRecs.map(r => ({ 
    x: dayjs(r.createdAt || r.startedAt).format('MM-DD'), 
    y: r.overallScore || r.score || 0
  })).filter(p => p.y > 0)
  
  // 计算平均分
  const avgScore = points.length > 0 
    ? Math.round(points.reduce((sum, p) => sum + p.y, 0) / points.length)
    : 0
  
  return {
    points,
    avgScore,
    totalCount: filteredRecs.length,
    recs: filteredRecs
  }
})

// ==================== 计算属性：基于面试记录的建议 ====================
// 从面试详情中提取维度数据并计算建议
const suggestions = computed(() => {
  const list = []
  const recs = filteredAnalytics.value.recs
  
  if (recs.length === 0) {
    list.push('暂无面试数据，开始您的第一次面试来获取个性化建议')
    return list
  }
  
  // 收集所有维度分数
  const dimScores = {}
  const dimCounts = {}
  
  recs.forEach(r => {
    if (r.dimensions && Array.isArray(r.dimensions)) {
      r.dimensions.forEach(d => {
        const name = d.name || d.k || d.key
        const score = d.score || d.v || d.value || 0
        if (name) {
          dimScores[name] = (dimScores[name] || 0) + score
          dimCounts[name] = (dimCounts[name] || 0) + 1
        }
      })
    }
  })
  
  // 计算平均分并找出弱项（<60分）
  const weakAreas = []
  Object.keys(dimScores).forEach(name => {
    const avg = dimScores[name] / dimCounts[name]
    if (avg < 60) {
      weakAreas.push({ name, score: Math.round(avg) })
    }
  })
  
  // 基于弱项给出建议
  weakAreas.forEach(area => {
    const name = area.name
    if (name.includes('技术') || name.includes('深度')) {
      list.push('技术深度有待提升，建议深入学习核心技术原理，多阅读源码和技术文档')
    } else if (name.includes('表达') || name.includes('沟通')) {
      list.push('表达能力需要加强，建议多用 STAR 法则组织答案，并进行模拟练习')
    } else if (name.includes('逻辑') || name.includes('思维')) {
      list.push('逻辑思维可以进一步提升，建议学习结构化思维方法，如金字塔原理')
    } else if (name.includes('项目') || name.includes('经验')) {
      list.push('项目经验描述不够充分，建议准备 2-3 个核心项目的详细案例')
    } else if (name.includes('算法')) {
      list.push('算法能力需要加强，建议每天坚持刷题，重点掌握常见数据结构')
    }
  })
  
  // 通用建议
  if (list.length === 0) {
    list.push('整体表现不错！建议保持学习节奏，挑战更高难度的面试题')
  }
  if (recs.length < 3) {
    list.push('面试次数较少，建议多进行模拟面试以积累经验')
  }
  
  return list.slice(0, 3)
})

// 获取趋势文本
const getTrendText = () => {
  const points = analytics.value.points
  if (points.length < 2) return '持平'
  const first = points[0].y
  const last = points[points.length - 1].y
  const diff = last - first
  if (diff > 5) return `↗ +${diff}`
  if (diff < -5) return `↘ ${diff}`
  return '→ 持平'
}

const getTrendClass = () => {
  const points = analytics.value.points
  if (points.length < 2) return 'neutral'
  const first = points[0].y
  const last = points[points.length - 1].y
  const diff = last - first
  if (diff > 5) return 'positive'
  if (diff < -5) return 'negative'
  return 'neutral'
}

const getImprovementValue = () => {
  const points = analytics.value.points
  if (points.length < 2) return '0%'
  const first = points[0].y
  const last = points[points.length - 1].y
  const diff = last - first
  const percent = Math.round((diff / first) * 100)
  return (percent > 0 ? '+' : '') + percent + '%'
}

const getImprovementClass = () => {
  const val = getImprovementValue()
  if (val.startsWith('+')) return 'positive'
  if (val.startsWith('-')) return 'negative'
  return 'neutral'
}

// 绘制迷你图表（收缩状态）
const drawMiniChart = () => {
  if (!miniChartCanvas.value || analytics.value.points.length === 0) return
  
  const canvas = miniChartCanvas.value
  const ctx = canvas.getContext('2d')
  const points = analytics.value.points
  
  // 设置 canvas 尺寸
  const rect = canvas.parentElement.getBoundingClientRect()
  canvas.width = rect.width * 2
  canvas.height = rect.height * 2
  ctx.scale(2, 2)
  
  const width = rect.width
  const height = rect.height
  const padding = 10
  
  // 清空画布
  ctx.clearRect(0, 0, width, height)
  
  // 计算范围
  const scores = points.map(p => p.y)
  const minScore = Math.min(...scores, 60)
  const maxScore = Math.max(...scores, 100)
  const range = maxScore - minScore || 1
  
  // 绘制渐变背景
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, 'rgba(100, 108, 255, 0.3)')
  gradient.addColorStop(1, 'rgba(100, 108, 255, 0)')
  
  // 绘制填充区域
  ctx.beginPath()
  ctx.moveTo(padding, height - padding)
  points.forEach((p, i) => {
    const x = padding + (i / (points.length - 1 || 1)) * (width - padding * 2)
    const y = height - padding - ((p.y - minScore) / range) * (height - padding * 2)
    if (i === 0) ctx.lineTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.lineTo(width - padding, height - padding)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()
  
  // 绘制线条
  ctx.beginPath()
  ctx.strokeStyle = '#646CFF'
  ctx.lineWidth = 2
  points.forEach((p, i) => {
    const x = padding + (i / (points.length - 1 || 1)) * (width - padding * 2)
    const y = height - padding - ((p.y - minScore) / range) * (height - padding * 2)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  
  // 绘制数据点
  points.forEach((p, i) => {
    const x = padding + (i / (points.length - 1 || 1)) * (width - padding * 2)
    const y = height - padding - ((p.y - minScore) / range) * (height - padding * 2)
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#646CFF'
    ctx.fill()
  })
}

// 绘制统计图表（展开状态）
const drawStatsChart = () => {
  if (!statsChartCanvas.value || filteredAnalytics.value.points.length === 0) return
  
  const canvas = statsChartCanvas.value
  const ctx = canvas.getContext('2d')
  const points = filteredAnalytics.value.points
  
  // 设置 canvas 尺寸
  const rect = canvas.parentElement.getBoundingClientRect()
  canvas.width = rect.width * 2
  canvas.height = rect.height * 2
  ctx.scale(2, 2)
  
  const width = rect.width
  const height = rect.height
  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  
  // 清空画布
  ctx.clearRect(0, 0, width, height)
  
  // 计算范围
  const scores = points.map(p => p.y)
  const minScore = Math.min(...scores, 60)
  const maxScore = Math.max(...scores, 100)
  const range = maxScore - minScore || 1
  
  // 绘制网格线
  ctx.strokeStyle = 'rgba(100, 108, 255, 0.1)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (i / 4) * chartHeight
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()
    
    // Y轴标签
    const label = Math.round(maxScore - (i / 4) * range)
    ctx.fillStyle = 'var(--muted)'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(label, padding.left - 8, y + 3)
  }
  
  // 绘制渐变背景
  const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
  gradient.addColorStop(0, 'rgba(100, 108, 255, 0.3)')
  gradient.addColorStop(1, 'rgba(100, 108, 255, 0.05)')
  
  // 绘制填充区域
  ctx.beginPath()
  ctx.moveTo(padding.left, height - padding.bottom)
  points.forEach((p, i) => {
    const x = padding.left + (i / (points.length - 1 || 1)) * chartWidth
    const y = padding.top + (1 - (p.y - minScore) / range) * chartHeight
    if (i === 0) ctx.lineTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.lineTo(width - padding.right, height - padding.bottom)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()
  
  // 绘制线条
  ctx.beginPath()
  ctx.strokeStyle = '#646CFF'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  points.forEach((p, i) => {
    const x = padding.left + (i / (points.length - 1 || 1)) * chartWidth
    const y = padding.top + (1 - (p.y - minScore) / range) * chartHeight
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  
  // 绘制数据点
  points.forEach((p, i) => {
    const x = padding.left + (i / (points.length - 1 || 1)) * chartWidth
    const y = padding.top + (1 - (p.y - minScore) / range) * chartHeight
    
    // 外圈
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fillStyle = 'var(--bg0)'
    ctx.fill()
    ctx.strokeStyle = '#646CFF'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 内圈
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#646CFF'
    ctx.fill()
    
    // X轴标签
    if (points.length <= 7 || i % Math.ceil(points.length / 7) === 0) {
      ctx.fillStyle = 'var(--muted)'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(p.x, x, height - padding.bottom + 15)
    }
  })
}

// 监听数据变化重绘图表
watch(() => analytics.value.points, () => {
  nextTick(() => {
    drawMiniChart()
    drawStatsChart()
  })
}, { deep: true })

watch(() => filteredAnalytics.value.points, () => {
  nextTick(() => {
    drawStatsChart()
  })
}, { deep: true })

watch(() => activeTab.value, (newTab) => {
  if (newTab === 'stats') {
    nextTick(() => {
      drawStatsChart()
    })
  }
})

watch(() => props.expanded, (isExpanded) => {
  if (!isExpanded) {
    nextTick(() => {
      drawMiniChart()
    })
  } else if (activeTab.value === 'stats') {
    nextTick(() => {
      drawStatsChart()
    })
  }
})

// ==================== 面试记录 API ====================
const loadInterviewRecords = async () => {
  loadingRecords.value = true
  try {
    console.log('开始加载面试记录...')
    // 获取所有简历
    const resumes = await resumeApi.getResumes()
    console.log('获取到简历列表:', resumes)
    const allInterviews = []
    
    // 遍历每个简历，获取其面试记录
    for (const resume of resumes) {
      console.log('处理简历:', resume.filename)
      const detail = await resumeApi.getResumeDetail(resume.id)
      console.log('简历详情:', detail)
      if (detail.interviews && detail.interviews.length > 0) {
        console.log('找到面试记录:', detail.interviews.length, '条')
        detail.interviews.forEach(interview => {
          allInterviews.push({
            ...interview,
            resumeId: resume.id,
            resumeFilename: resume.filename
          })
        })
      } else {
        console.log('该简历无面试记录')
      }
    }
    
    console.log('所有面试记录:', allInterviews)
    // 按创建时间倒序排序
    const sortedInterviews = allInterviews.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.startTime || 0).getTime()
      const timeB = new Date(b.createdAt || b.startTime || 0).getTime()
      return timeB - timeA
    })
    
    console.log('排序后面试记录:', sortedInterviews)
    interviewRecords.value = sortedInterviews
    console.log('面试记录加载完成，共', sortedInterviews.length, '条')
  } catch (err) {
    console.error('加载面试记录失败:', err)
    interviewRecords.value = []
  } finally {
    loadingRecords.value = false
  }
}

// 删除面试记录
const deleteInterviewRecord = async (sessionId) => {
  try {
    await interviewApi.deleteSession(sessionId)
    // 重新加载列表
    await loadInterviewRecords()
    // 如果在详情页，返回列表
    if (currentView.value === 'detail' && currentRecord.value?.sessionId === sessionId) {
      backToList()
    }
  } catch (err) {
    console.error('删除面试记录失败:', err)
    alert('删除失败: ' + err.message)
  }
}

// 加载面试详情
const loadInterviewDetail = async (sessionId) => {
  loadingDetail.value = true
  try {
    const data = await interviewApi.getInterviewDetail(sessionId)
    currentRecordDetail.value = data
  } catch (err) {
    console.error('加载面试详情失败:', err)
    currentRecordDetail.value = null
  } finally {
    loadingDetail.value = false
  }
}

// ==================== 知识库 API ====================
// 加载知识库数据（带排序和筛选）
const loadKnowledgeBases = async () => {
  loadingKnowledge.value = true
  try {
    const data = await knowledgeBaseApi.getAllKnowledgeBases(
      knowledgeSortBy.value,
      knowledgeFilterStatus.value || undefined
    )
    knowledgeBases.value = data || []
  } catch (err) {
    console.error('加载知识库失败:', err)
    knowledgeBases.value = []
  } finally {
    loadingKnowledge.value = false
  }
}

// 加载知识库统计
const loadKnowledgeStats = async () => {
  try {
    const data = await knowledgeBaseApi.getStatistics()
    knowledgeStats.value = data || {}
  } catch (err) {
    console.error('加载知识库统计失败:', err)
    knowledgeStats.value = {}
  }
}

// 搜索知识库
const searchKnowledgeBases = async () => {
  if (!knowledgeSearchTerm.value.trim()) {
    loadKnowledgeBases()
    return
  }
  loadingKnowledge.value = true
  try {
    const data = await knowledgeBaseApi.search(knowledgeSearchTerm.value.trim())
    knowledgeBases.value = data || []
  } catch (err) {
    console.error('搜索知识库失败:', err)
  } finally {
    loadingKnowledge.value = false
  }
}

// 清除知识库搜索
const clearKnowledgeSearch = () => {
  knowledgeSearchTerm.value = ''
  loadKnowledgeBases()
}

// 下载知识库
const downloadKnowledge = async (item) => {
  try {
    const blob = await knowledgeBaseApi.downloadKnowledgeBase(item.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.originalFilename || item.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('下载失败:', err)
    alert('下载失败: ' + err.message)
  }
}

// 知识库问答
const chatWithKnowledgeItem = (item) => {
  router.push({
    path: '/app/knowledge-chat',
    query: { kbId: item.id, kbName: item.name }
  })
}

// 确认删除（通用）
const confirmDelete = (item, type) => {
  deleteTarget.value = item
  deleteTargetType.value = type
  showDeleteConfirm.value = true
}

// 执行删除（通用）
const doDelete = async () => {
  if (!deleteTarget.value || !deleteTargetType.value) return
  
  deleting.value = true
  try {
    switch (deleteTargetType.value) {
      case 'knowledge':
        await knowledgeBaseApi.deleteKnowledgeBase(deleteTarget.value.id)
        await loadKnowledgeBases()
        await loadKnowledgeStats()
        break
      case 'record':
        await interviewApi.deleteSession(deleteTarget.value.sessionId)
        await loadInterviewRecords()
        break
    }
    showDeleteConfirm.value = false
    deleteTarget.value = null
    deleteTargetType.value = ''
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败: ' + err.message)
  } finally {
    deleting.value = false
  }
}

// 获取删除确认文本
const getDeleteConfirmText = () => {
  if (!deleteTarget.value || !deleteTargetType.value) return ''
  const name = deleteTarget.value.name || deleteTarget.value.resumeName || '此项'
  switch (deleteTargetType.value) {
    case 'knowledge':
      return `确定要删除知识库 "${name}" 吗？`
    case 'record':
      return `确定要删除面试记录 "${name}" 吗？此操作不可恢复。`
    default:
      return `确定要删除 "${name}" 吗？`
  }
}

// 处理文件选择
const handleKnowledgeFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) {
    knowledgeUploadFile.value = file
    knowledgeUploadName.value = file.name.replace(/\.[^/.]+$/, '')
  }
}

// 上传知识库
const uploadKnowledge = async () => {
  if (!knowledgeUploadFile.value) return
  
  uploadingKnowledge.value = true
  try {
    await knowledgeBaseApi.uploadKnowledgeBase(
      knowledgeUploadFile.value,
      knowledgeUploadName.value || knowledgeUploadFile.value.name,
      knowledgeUploadCategory.value
    )
    showKnowledgeUpload.value = false
    knowledgeUploadFile.value = null
    knowledgeUploadName.value = ''
    knowledgeUploadCategory.value = ''
    loadKnowledgeBases()
    loadKnowledgeStats()
  } catch (err) {
    console.error('上传失败:', err)
    alert('上传失败: ' + err.message)
  } finally {
    uploadingKnowledge.value = false
  }
}

// 获取面试标题
const getInterviewTitle = (record) => {
  if (record.resumeFilename) {
    return `${record.resumeFilename} · 模拟面试`
  }
  return `面试记录 #${record.sessionId?.slice(-6) || 'Unknown'}`
}

// 获取面试预览文本
const getInterviewPreview = (record) => {
  if (record.overallFeedback) {
    return record.overallFeedback.slice(0, 50) + (record.overallFeedback.length > 50 ? '...' : '')
  }
  if (record.status === 'IN_PROGRESS') {
    return '面试进行中...'
  }
  return '暂无评价'
}

// 切换到知识库标签
const switchToKnowledgeTab = () => {
  activeTab.value = 'knowledge'
}

// 查看记录详情
const viewRecordDetail = async (record) => {
  currentRecord.value = record
  detailType.value = 'record'
  currentView.value = 'detail'
  
  // 加载详情数据
  await loadInterviewDetail(record.sessionId)
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
  currentRecordDetail.value = null
  currentKnowledge.value = null
}

// 重新加载详情
const reloadDetail = () => {
  if (currentRecord.value?.sessionId) {
    loadInterviewDetail(currentRecord.value.sessionId)
  }
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
    IN_PROGRESS: '进行中',
    PROCESSING: '处理中',
    PENDING: '待处理',
    FAILED: '失败',
    COMPLETED: '已完成'
  }
  return map[status] || status || '未知'
}

const getScoreClass = (score) => {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

onMounted(() => {
  // 加载数据
  const loadAllData = async () => {
    await loadInterviewRecords()
    await loadKnowledgeBases()
    await loadKnowledgeStats()
    
    // 延迟绘制图表，确保 DOM 已渲染
    setTimeout(() => {
      drawMiniChart()
      drawStatsChart()
    }, 100)
  }
  
  // 初始加载
  loadAllData()
  
  // 定时刷新数据，确保数据最新
  setInterval(() => {
    loadAllData()
  }, 30000) // 每30秒刷新一次
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    drawMiniChart()
    drawStatsChart()
  })
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
}

/* 标签切换器 */
.tab-switcher {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid var(--stroke);
}

.tab-btn {
  flex: 1;
  padding: 10px 12px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  border-color: var(--brand);
  color: var(--text);
}

.tab-btn.active {
  background: var(--brand);
  border-color: var(--brand);
  color: white;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 6px;
  padding: 0 16px 12px;
}

.filter-btn {
  flex: 1;
  padding: 6px 10px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: var(--brand);
  color: var(--text);
}

.filter-btn.active {
  background: var(--brand);
  border-color: var(--brand);
  color: white;
}

/* 内容区域 */
.content-area {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 列表视图 */
.list-view {
  height: 100%;
  overflow-y: auto;
  padding: 12px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: var(--muted);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--stroke);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
  color: var(--muted);
  text-align: center;
}

/* 收缩状态布局 */
.compact-top-section {
  height: 50%;
  overflow: hidden;
  position: relative;
}

.compact-stats-section {
  height: 50%;
  padding: 12px;
  border-top: 1px solid var(--stroke);
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.compact-stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}

.stats-trend {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.stats-trend.positive {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.stats-trend.negative {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.stats-trend.neutral {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
}

/* 迷你图表 */
.mini-chart-container {
  height: 60px;
  background: var(--bg0);
  border-radius: 8px;
  padding: 4px;
}

.mini-chart {
  width: 100%;
  height: 100%;
}

/* 紧凑评分行 */
.compact-score-row {
  display: flex;
  justify-content: space-around;
  gap: 8px;
}

.compact-score-item {
  text-align: center;
}

.score-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.score-value.positive {
  color: #22c55e;
}

.score-value.negative {
  color: #ef4444;
}

.score-value.neutral {
  color: var(--muted);
}

.score-value.high {
  color: #22c55e;
}

.score-value.medium {
  color: #eab308;
}

.score-value.low {
  color: #ef4444;
}

.score-label {
  font-size: 10px;
  color: var(--muted2);
  margin-top: 2px;
}

/* 紧凑建议卡片 */
.compact-suggestion-card,
.compact-summary-card {
  background: var(--bg0);
  border: 1px solid var(--stroke);
  border-radius: 8px;
  padding: 8px;
}

.suggestion-title,
.summary-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--brand);
  margin-bottom: 4px;
}

.suggestion-text,
.summary-text {
  font-size: 11px;
  color: var(--text);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 记录列表 */
.record-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-list.compact {
  padding-bottom: 80px;
  max-height: 100%;
  overflow-y: auto;
}

.record-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--bg0);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.record-content {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
}

.record-item:hover {
  border-color: var(--brand);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.1);
}

.record-item.compact {
  padding: 10px;
}

.record-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.record-date {
  color: var(--muted);
}

.record-questions {
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 10px;
  font-size: 11px;
  color: #6b7280;
}

.record-score {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.record-score.high {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.record-score.medium {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
}

.record-score.low {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.record-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.record-status.completed {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.record-status.in_progress {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.record-status.pending {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
}

.record-status.failed {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.record-preview {
  font-size: 12px;
  color: var(--muted);
  margin-top: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.record-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  align-items: flex-start;
  margin-top: 4px;
}

.action-btn {
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* 空状态 */
.empty-message {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
  font-size: 14px;
}

/* 知识库快捷入口 */
.knowledge-quick-entry {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, var(--panel) 0%, rgba(100, 108, 255, 0.1) 100%);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.knowledge-quick-entry:hover {
  border-color: var(--brand);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.15);
}

.entry-icon {
  font-size: 24px;
}

.entry-text {
  flex: 1;
}

.entry-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.entry-count {
  font-size: 12px;
  color: var(--muted);
}

.entry-arrow {
  font-size: 18px;
  color: var(--brand);
}

/* 知识库列表 */
.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.knowledge-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--bg0);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.knowledge-item:hover {
  border-color: var(--brand);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.1);
}

.knowledge-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.knowledge-info {
  flex: 1;
  min-width: 0;
}

.knowledge-name {
  font-size: 14px;
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
  font-size: 12px;
}

.knowledge-category {
  color: var(--muted);
}

.knowledge-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.knowledge-status.completed {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.knowledge-status.processing {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.knowledge-status.pending {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
}

.knowledge-status.failed {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.knowledge-desc {
  font-size: 12px;
  color: var(--muted);
  margin-top: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 知识库工具栏 */
.knowledge-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 4px;
}

.knowledge-toolbar .search-bar {
  flex: 1;
}

.toolbar-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 10px;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background: var(--panel2);
  border-color: var(--stroke2);
}

.toolbar-btn.upload {
  color: var(--brand);
}

.toolbar-btn.upload:hover {
  background: rgba(100, 108, 255, 0.1);
  border-color: var(--brand);
}

.toolbar-btn.refresh.spinning svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 知识库操作按钮 */
.knowledge-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.knowledge-item:hover .knowledge-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg0);
  border: 1px solid var(--stroke);
  border-radius: 6px;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background: var(--panel);
  border-color: var(--stroke2);
}

.action-btn.download:hover:not(:disabled) {
  color: var(--brand);
  border-color: var(--brand);
}

.action-btn.chat:hover:not(:disabled) {
  color: #22c55e;
  border-color: #22c55e;
}

.action-btn.delete:hover:not(:disabled) {
  color: #ef4444;
  border-color: #ef4444;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 搜索栏 */
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 36px;
  background: var(--bg0);
  border: 1px solid var(--stroke);
  border-radius: 10px;
  font-size: 13px;
  color: var(--text);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--brand);
  background: var(--panel);
}

.search-input::placeholder {
  color: var(--muted);
}

.search-clear {
  position: absolute;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--stroke);
  border: none;
  border-radius: 50%;
  color: var(--muted);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-clear:hover {
  background: var(--stroke2);
  color: var(--text);
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--stroke);
}

.modal-header.warning {
  color: #f59e0b;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--muted);
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--bg0);
  color: var(--text);
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--stroke);
}

/* 上传表单 */
.upload-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

.form-input {
  padding: 10px 14px;
  background: var(--bg0);
  border: 1px solid var(--stroke);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text);
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--brand);
}

.form-input::placeholder {
  color: var(--muted);
}

.form-hint {
  font-size: 12px;
  color: var(--muted);
  margin: 0;
}

.file-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 按钮样式 */
.btn {
  padding: 10px 18px;
  background: var(--bg0);
  border: 1px solid var(--stroke);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover:not(:disabled) {
  background: var(--panel2);
  border-color: var(--stroke2);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.primary {
  background: var(--brand);
  border-color: var(--brand);
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: var(--brand2);
}

.btn.secondary {
  background: var(--panel);
  border-color: var(--stroke);
  color: var(--muted);
}

.btn.secondary:hover:not(:disabled) {
  background: var(--panel2);
  color: var(--text);
}

.btn.danger {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
}

.btn.danger:hover:not(:disabled) {
  background: #dc2626;
}

/* 面试统计标签页 */
.stats-tab {
  height: 100%;
  overflow-y: auto;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 时间范围切换 */
.time-range-switcher {
  display: flex;
  gap: 8px;
  padding: 4px;
  background: var(--bg0);
  border-radius: 10px;
}

.range-btn {
  flex: 1;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.3s ease;
}

.range-btn:hover {
  color: var(--text);
}

.range-btn.active {
  background: var(--brand);
  color: white;
}

/* 统计概览 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.overview-card {
  background: var(--bg0);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  transition: all 0.3s ease;
}

.overview-card:hover {
  border-color: var(--brand);
  transform: translateY(-2px);
}

.overview-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.overview-value.positive {
  color: #22c55e;
}

.overview-value.negative {
  color: #ef4444;
}

.overview-value.neutral {
  color: var(--muted);
}

.overview-label {
  font-size: 11px;
  color: var(--muted2);
  margin-top: 4px;
}

/* 图表区域 */
.chart-section {
  background: var(--bg0);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  padding: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.section-subtitle {
  font-size: 11px;
  color: var(--muted2);
}

.chart-container {
  height: 150px;
}

.stats-chart {
  width: 100%;
  height: 100%;
}

/* 能力维度 */
.dimensions-section {
  background: var(--bg0);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  padding: 12px;
}

.dimension-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dimension-bar-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dim-name {
  font-size: 12px;
  color: var(--text);
}

.dim-score {
  font-size: 12px;
  font-weight: 600;
}

.dim-score.high {
  color: #22c55e;
}

.dim-score.medium {
  color: #eab308;
}

.dim-score.low {
  color: #ef4444;
}

.dim-progress {
  height: 6px;
  background: var(--stroke);
  border-radius: 3px;
  overflow: hidden;
}

.dim-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.dim-fill.high {
  background: linear-gradient(90deg, #22c55e, #4ade80);
}

.dim-fill.medium {
  background: linear-gradient(90deg, #eab308, #facc15);
}

.dim-fill.low {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

/* 优势区域 */
.strengths-section {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, var(--bg0) 100%);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 12px;
}

.strength-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.strength-tag {
  padding: 6px 12px;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

/* 建议区域 */
.suggestions-section {
  background: linear-gradient(135deg, rgba(100, 108, 255, 0.1) 0%, var(--bg0) 100%);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  padding: 12px;
}

.weakness-list {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--stroke);
}

.weakness-title {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 8px;
}

.weakness-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.weakness-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(239, 68, 68, 0.15);
  border-radius: 6px;
}

.weakness-name {
  font-size: 12px;
  color: #ef4444;
}

.weakness-score {
  font-size: 11px;
  color: #ef4444;
  font-weight: 600;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestion-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.suggestion-num {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand);
  color: white;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.suggestion-text {
  font-size: 12px;
  color: var(--text);
  line-height: 1.5;
  flex: 1;
}

/* 详情视图 */
.detail-view {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  margin-bottom: 16px;
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

/* 详情标题 */
.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 12px;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.detail-date {
  font-size: 13px;
  color: var(--muted);
}

.detail-score {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
}

.detail-score.high {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.detail-score.medium {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
}

.detail-score.low {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.detail-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

/* 详情区块 */
.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--stroke);
}

/* 能力维度 */
.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dimension-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dimension-name {
  width: 80px;
  font-size: 13px;
  color: var(--text);
  flex-shrink: 0;
}

.dimension-bar {
  flex: 1;
  height: 8px;
  background: var(--stroke);
  border-radius: 4px;
  overflow: hidden;
}

.dimension-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.dimension-fill.high {
  background: linear-gradient(90deg, #22c55e, #4ade80);
}

.dimension-fill.medium {
  background: linear-gradient(90deg, #eab308, #facc15);
}

.dimension-fill.low {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.dimension-score {
  width: 40px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  text-align: right;
}

/* 评价文本 */
.detail-feedback {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text);
  margin: 0;
}

/* 列表样式 */
.detail-list {
  margin: 0;
  padding-left: 20px;
}

.detail-list li {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 8px;
}

.detail-list li:last-child {
  margin-bottom: 0;
}

/* 问题列表 */
.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-item {
  padding: 16px;
  background: var(--bg0);
  border: 1px solid var(--stroke);
  border-radius: 12px;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.question-number {
  padding: 4px 10px;
  background: var(--brand);
  color: white;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}

.question-score {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.question-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin: 0 0 8px;
  line-height: 1.5;
}

.question-feedback {
  font-size: 13px;
  color: var(--muted);
  margin: 0;
  line-height: 1.5;
}

/* 滚动条样式 */
.list-view::-webkit-scrollbar,
.detail-view::-webkit-scrollbar,
.stats-tab::-webkit-scrollbar {
  width: 6px;
}

.list-view::-webkit-scrollbar-track,
.detail-view::-webkit-scrollbar-track,
.stats-tab::-webkit-scrollbar-track {
  background: transparent;
}

.list-view::-webkit-scrollbar-thumb,
.detail-view::-webkit-scrollbar-thumb,
.stats-tab::-webkit-scrollbar-thumb {
  background: var(--stroke);
  border-radius: 3px;
}

.list-view::-webkit-scrollbar-thumb:hover,
.detail-view::-webkit-scrollbar-thumb:hover,
.stats-tab::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>