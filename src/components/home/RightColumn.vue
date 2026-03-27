<template>
  <div 
    class="right-column" 
    :class="{ expanded }"
    @mouseenter="$emit('hover-change', true)"
    @mouseleave="$emit('hover-change', false)"
  >
    <div class="column-content">
      <!-- 内部视图切换：列表视图 vs 详情视图 -->
      <Transition name="fade" mode="out-in">
        <!-- 列表视图 -->
        <div v-if="currentView === 'list'" key="list" class="list-view">
          <!-- ===== 上部分：打卡信息（占比30%） ===== -->
          <div class="section top-section" :class="{ expanded }">
            <!-- 收缩状态：精简打卡 -->
            <div v-if="!expanded" class="checkin-compact">
              <div class="checkin-main">
                <div class="progress-ring" :class="{ 'checkin-anim': isCheckinAnim }">
                  <svg class="ring" viewBox="0 0 100 100">
                    <circle class="ring-bg" cx="50" cy="50" r="40" fill="none" stroke="var(--stroke)" stroke-width="8"/>
                    <circle 
                      class="ring-fill" 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      :stroke="progressColor" 
                      stroke-width="8"
                      stroke-linecap="round"
                      :stroke-dasharray="circumference"
                      :stroke-dashoffset="progressOffset"
                    />
                  </svg>
                  <div class="progress-text">
                    <span class="progress-value">{{ checkinStats.streak }}</span>
                    <span class="progress-label">天</span>
                  </div>
                  <!-- 打卡成功特效 -->
                  <div v-if="showCheckinSuccess" class="checkin-success-ring"></div>
                </div>
                <div class="checkin-info">
                  <div class="checkin-label">连续打卡</div>
                  <div class="checkin-streak">{{ checkinStats.streak }} 天</div>
                  <div class="checkin-total">累计 {{ checkinStats.total }} 天</div>
                </div>
              </div>
              <!-- 打卡按钮 -->
              <button 
                v-if="canCheckinToday" 
                class="checkin-btn"
                @click="handleCheckin"
                :class="{ 'checking': isChecking }"
              >
                <span class="btn-icon">✨</span>
                <span class="btn-text">立即打卡</span>
              </button>
              <div v-else class="checkin-done">
                <span class="done-icon">✅</span>
                <span class="done-text">今日已打卡</span>
              </div>
            </div>

            <!-- 展开状态：打卡统计 + 按钮 + 近一周记录 -->
            <div v-else class="checkin-expanded">
              <!-- 打卡统计和按钮 -->
              <div class="checkin-header-expanded">
                <div class="checkin-stats-large">
                  <div class="stat-box">
                    <span class="stat-number">{{ checkinStats.total }}</span>
                    <span class="stat-label">已打卡(天)</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-box">
                    <span class="stat-number">{{ checkinStats.streak }}</span>
                    <span class="stat-label">连续(天)</span>
                  </div>
                </div>
                
                <!-- 打卡按钮 -->
                <button 
                  v-if="canCheckinToday" 
                  class="checkin-btn-expanded"
                  @click="handleCheckin"
                  :class="{ 'checking': isChecking }"
                >
                  <span class="btn-icon">✨</span>
                  <span class="btn-text">立即打卡</span>
                </button>
                <div v-else class="checkin-done-expanded">
                  <span class="done-icon">✅</span>
                  <span class="done-text">今日已打卡</span>
                </div>
              </div>

              <!-- 近一周打卡记录 -->
              <div class="week-calendar">
                <div class="week-header">
                  <span class="week-title">近7天打卡</span>
                  <span class="week-count">{{ weekCheckins }}/7 天</span>
                </div>
                <div class="week-days">
                  <div 
                    v-for="(day, index) in recentWeekDays" 
                    :key="'week-' + index"
                    class="week-day"
                    :class="{
                      'checked': day.checked,
                      'today': day.isToday
                    }"
                  >
                    <span class="day-name">{{ day.weekday }}</span>
                    <div class="day-dot" :class="{ 'active': day.checked }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== 中部分：面试情报 + 天气提醒（各占一半，共占比40%） ===== -->
          <div class="section middle-section" :class="{ expanded }">
            <!-- 收缩状态：每日一题 + 天气 -->
            <div v-if="!expanded" class="compact-weather-reminder">
              <!-- 每日一题 -->
              <div class="compact-daily-question" :class="{ 'has-error': dailyQuestionError }">
                <div class="daily-q-header">
                  <span class="daily-q-icon">📋</span>
                  <span class="daily-q-title">每日一题</span>
                  <span v-if="currentQuestion" class="daily-q-progress">{{ currentQuestionIndex + 1 }}/{{ dailyQuestions.length }}</span>
                </div>
                <div v-if="dailyQuestionLoading" class="daily-q-loading">加载中...</div>
                <div v-else-if="dailyQuestionError" class="daily-q-error" @click="retryDailyQuestion">
                  <span class="error-text">未连接上，请重试</span>
                  <span class="retry-icon">🔄</span>
                </div>
                <div v-else-if="isAllCompleted" class="daily-q-completed">
                  <div class="completed-icon">🎉</div>
                  <div class="completed-text">真棒！已完成今日3题</div>
                  <div class="completed-sub">{{ timeUntilNextRefresh }}</div>
                </div>
                <div v-else-if="currentQuestion" class="daily-q-content">
                  <div class="daily-q-text" @click="showDailyQuestionDetail">{{ currentQuestion.question }}</div>
                  <div class="daily-q-nav">
                    <button class="nav-btn" :disabled="currentQuestionIndex === 0" @click="prevQuestion">◀</button>
                    <button class="nav-btn" :disabled="currentQuestionIndex >= dailyQuestions.length - 1" @click="nextQuestion">▶</button>
                  </div>
                </div>
              </div>
              <!-- 天气卡片 -->
              <div class="compact-weather">
                <div class="weather-icon-large">{{ weatherIcon }}</div>
                <div class="weather-info-compact">
                  <div class="weather-desc-compact">{{ weatherDesc }}</div>
                </div>
              </div>
            </div>

            <!-- 展开状态：左右分栏（每日一题 + 天气提醒） -->
            <div v-else class="middle-expanded">
              <!-- 左侧：每日一题 -->
              <div class="tip-section daily-question-expanded" :class="{ 'has-error': dailyQuestionError, 'is-loading': dailyQuestionLoading }">
                <div class="daily-q-header-expanded">
                  <h4>📋 每日一题</h4>
                  <span v-if="currentQuestion" class="daily-q-badge">{{ currentQuestionIndex + 1 }}/{{ dailyQuestions.length }}</span>
                </div>
                <div v-if="dailyQuestionLoading" class="daily-q-loading-expanded">
                  <div class="loading-spinner"></div>
                  <span>加载中...</span>
                </div>
                <div v-else-if="dailyQuestionError" class="daily-q-error-expanded" @click="retryDailyQuestion">
                  <div class="error-icon">⚠️</div>
                  <div class="error-content">
                    <span class="error-title">连接失败</span>
                    <span class="error-desc">点击重试</span>
                  </div>
                  <div class="retry-btn">🔄</div>
                </div>
                <div v-else-if="isAllCompleted" class="daily-q-completed-expanded">
                  <div class="completed-icon-large">🎉</div>
                  <div class="completed-title">真棒！</div>
                  <div class="completed-text">已完成今日3道题目</div>
                  <div class="completed-time">{{ timeUntilNextRefresh }}</div>
                </div>
                <div v-else-if="currentQuestion" class="daily-q-content-expanded">
                  <div class="daily-q-item-expanded">
                    <span class="tip-badge">Q{{ currentQuestionIndex + 1 }}</span>
                    <span class="tip-text">{{ currentQuestion.question }}</span>
                  </div>
                  <!-- 答案弹窗 - 原地显示 -->
                  <div v-if="showAnswerPopup" class="daily-q-answer-popup">
                    <div class="answer-popup-header">
                      <span class="answer-popup-title">💡 答案</span>
                      <button class="answer-popup-close" @click="showAnswerPopup = false">✕</button>
                    </div>
                    <div class="answer-popup-content">{{ currentQuestion.answer }}</div>
                  </div>
                  <div class="daily-q-nav-expanded">
                    <button class="nav-btn-large" :disabled="currentQuestionIndex === 0" @click="prevQuestion">
                      <span class="nav-icon">◀</span>
                      <span>上一题</span>
                    </button>
                    <button class="nav-btn-large primary" @click="toggleAnswerPopup">
                      <span>{{ showAnswerPopup ? '隐藏答案' : '查看答案' }}</span>
                    </button>
                    <button class="nav-btn-large" :disabled="currentQuestionIndex >= dailyQuestions.length - 1" @click="nextQuestion">
                      <span>下一题</span>
                      <span class="nav-icon">▶</span>
                    </button>
                  </div>
                </div>
                <div v-else class="daily-q-empty">
                  <span>暂无题目</span>
                </div>
              </div>
              
              <!-- 右侧：天气和温馨提醒 -->
              <div class="weather-section">
                <div class="weather-card">
                  <div class="weather-icon">{{ weatherIcon }}</div>
                  <div class="weather-info">
                    <div class="weather-temp">{{ weatherTemp }}°C</div>
                    <div class="weather-desc">{{ weatherDesc }}</div>
                  </div>
                </div>
                
                <div class="reminder-card">
                  <div class="reminder-icon">✨</div>
                  <div class="reminder-content">
                    <div class="reminder-title">今日提醒</div>
                    <div class="reminder-text">{{ dailyReminder }}</div>
                  </div>
                </div>
                
                <div class="motivation-card">
                  <div class="motivation-text">{{ motivationQuote }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== 下部分：个人中心/设置（占比30%） ===== -->
          <div class="section bottom-section" :class="{ expanded }">
            <!-- 收缩状态：图标 -->
            <div v-if="!expanded" class="profile-compact">
              <button class="icon-button" @click="showProfile" title="个人中心">
                <User :size="24" />
              </button>
              <button class="icon-button" @click="showSettings" title="设置">
                <Settings :size="24" />
              </button>
            </div>

            <!-- 展开状态：完整卡片 + 退出按钮 -->
            <div v-else class="profile-expanded">
              <div class="user-card" @click="showProfile">
                <div class="user-avatar">
                  <img v-if="user?.avatar?.src" :src="user.avatar.src" alt="avatar">
                  <div v-else class="avatar-placeholder">
                    {{ user?.username?.charAt(0) || 'U' }}
                  </div>
                </div>
                <div class="user-info">
                  <div class="user-name">{{ user?.username || '未登录' }}</div>
                  <div class="user-email">{{ user?.email || '' }}</div>
                  <div class="user-stats">
                    <span>面试 {{ interviewCount }}次</span>
                    <span>打卡 {{ checkinStats.total }}天</span>
                  </div>
                </div>
              </div>
              
              <div class="settings-menu">
                <button class="menu-item" @click="showSettings">
                  <Settings :size="16" />
                  <span>偏好设置</span>
                </button>
                <button class="menu-item" @click="toggleTheme">
                  <component :is="themeIcon" :size="16" />
                  <span>{{ themeText }}</span>
                </button>
                <button class="menu-item logout-btn" @click="showLogoutConfirm = true">
                  <LogOut :size="16" />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 详情视图 - 个人中心 -->
        <div v-else-if="detailType === 'profile'" key="profile-detail" class="detail-view">
          <button class="back-btn" @click="backToList">
            <span class="back-icon">←</span>
            <span>返回</span>
          </button>
          
          <div class="profile-detail">
            <h3 class="detail-title">个人中心</h3>
            
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="profile-avatar-section">
                <!-- 直接用简单的头像显示 -->
                <div class="user-avatar-large">
                  <img v-if="user?.avatar?.src" :src="user.avatar.src" alt="avatar">
                  <div v-else class="avatar-placeholder-large">
                    {{ user?.username?.charAt(0) || 'U' }}
                  </div>
                </div>
                <div class="avatar-actions">
                  <button class="btn small" @click="setGradientAvatar">渐变头像</button>
                  <label class="btn small">
                    上传图片
                    <input type="file" accept="image/*" style="display:none" @change="onPickFile" />
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                <label>用户名</label>
                <input class="input" v-model.trim="username" placeholder="输入新的用户名" />
              </div>
              
              <div class="form-actions">
                <button class="btn primary" @click="saveProfile">保存资料</button>
              </div>
            </div>
             <!-- 👇 在这里添加提示信息 -->
            <div v-if="okMsg" class="success-message">{{ okMsg }}</div>
            <div v-if="errMsg" class="error-message">{{ errMsg }}</div>
              <!-- 👆 添加到这里 -->
    

            <div class="detail-section">
              <h4>安全设置</h4>
              <div class="form-group">
                <label>旧密码</label>
                <input class="input" type="password" v-model="oldPwd" />
              </div>
              <div class="form-group">
                <label>新密码</label>
                <input class="input" type="password" v-model="newPwd" />
              </div>
              <div class="form-actions">
                <button class="btn" @click="onChangePassword">修改密码</button>
              </div>
            </div>

            <div class="detail-section danger-zone">
              <h4>危险操作</h4>
              <button class="btn danger" @click="onLogout">退出登录</button>
            </div>
          </div>
        </div>

        <!-- 详情视图 - 设置 -->
        <div v-else-if="detailType === 'settings'" key="settings-detail" class="detail-view">
          <button class="back-btn" @click="backToList">
            <span class="back-icon">←</span>
            <span>返回</span>
          </button>
          
          <div class="settings-detail">
            <h3 class="detail-title">个性化设置</h3>
            
            <!-- 主题风格 - 核心功能 -->
            <div class="detail-section">
              <h4>主题风格</h4>
              <div class="theme-grid">
                <button 
                  v-for="theme in themeList" 
                  :key="theme.id"
                  class="theme-card"
                  :class="{ active: currentThemeBaseId === theme.baseId }"
                  @click="changeTheme(theme.id)"
                >
                  <div class="theme-color" :style="{ background: theme.gradient }"></div>
                  <span class="theme-name">{{ theme.name }}</span>
                </button>
              </div>
            </div>

            <!-- 外观模式 - 简洁的切换 -->
            <div class="detail-section">
              <h4>外观模式</h4>
              <div class="mode-selector">
                <button 
                  class="mode-btn"
                  :class="{ active: !isLightMode }"
                  @click="setThemeById(currentThemeBaseId)"
                >
                  <Moon :size="18" />
                  <span>深色</span>
                </button>
                <button 
                  class="mode-btn"
                  :class="{ active: isLightMode }"
                  @click="setThemeById(currentThemeBaseId + 5)"
                >
                  <Sun :size="18" />
                  <span>浅色</span>
                </button>
              </div>
            </div>

            <!-- 材质效果 - 简化选项 -->
            <div class="detail-section">
              <h4>视觉效果</h4>
              <div class="material-toggle">
                <span class="toggle-label">玻璃拟态</span>
                <label class="switch">
                  <input type="checkbox" v-model="isGlassMode" @change="toggleMaterial">
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="detail-section actions-section">
              <div class="form-actions centered">
                <button class="btn primary" @click="saveSettings">保存设置</button>
                <button class="btn text-btn" @click="resetSettings">恢复默认</button>
              </div>
            </div>

            <!-- 提示信息 -->
            <div v-if="okMsg" class="toast-message success">{{ okMsg }}</div>
            <div v-if="errMsg" class="toast-message error">{{ errMsg }}</div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 退出确认弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showLogoutConfirm" class="modal-overlay" @click.self="showLogoutConfirm = false">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <LogOut size="24" class="warning-icon" />
              <h3>确认退出</h3>
            </div>
            <div class="modal-body">
              <p>确定要退出登录吗？</p>
            </div>
            <div class="modal-footer">
              <button class="btn secondary" @click="showLogoutConfirm = false">取消</button>
              <button class="btn danger" @click="logout">确认退出</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
// 在现有导入后面添加这些

import { lsGet, lsSet } from '../../lib/storage'  // 添加这行
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { User, Settings, LogOut, Sun, Moon } from 'lucide-vue-next'
import { currentUser, logout as authLogout, updateProfile } from '../../lib/auth'
import { getCheckinState, getEquippedCosmetics, doCheckIn, canCheckIn } from '../../lib/checkin'
import { getRecords } from '../../lib/records'
import { interviewApi } from '../../api/interview.js'

import dayjs from 'dayjs'


const props = defineProps({
  expanded: Boolean
})
// 添加这些响应式变量
const username = ref('')
const oldPwd = ref('')
const newPwd = ref('')

const pref = ref(lsGet(SETTINGS_KEY, { 
  autoSeed: true, 
  showTips: true, 
  darkMode: false,
  theme: 'tech-cool',
  material: 'glass'  // 默认使用玻璃材质
}))
const okMsg = ref('')
const errMsg = ref('')
const emit = defineEmits(['hover-change'])

const router = useRouter()
const user = computed(() => currentUser())

// ===== 视图切换 =====
const currentView = ref('list')  // 'list' 或 'detail'
const detailType = ref(null)      // 'profile' 或 'settings'

// ===== 主题列表 =====
const themeList = [
  { id: 'tech-cool', baseId: 1, name: '科技冷静', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'warm-luxury', baseId: 2, name: '温暖高端', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'ocean-mermaid', baseId: 3, name: '海洋灵感', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'dopamine-energy', baseId: 4, name: '多巴胺撞色', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'cloud-white', baseId: 5, name: '岩雾白', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }
]

// 获取当前主题的基础ID
const currentThemeBaseId = computed(() => {
  const theme = themeList.find(t => t.id === pref.value.theme)
  return theme ? theme.baseId : 1
})

// ===== 材质切换 =====
const isGlassMode = ref(true)

const toggleMaterial = () => {
  if (isGlassMode.value) {
    document.body.classList.remove('material-minimal')
    const minimalStyle = document.getElementById('minimal-material-style')
    if (minimalStyle) minimalStyle.remove()
  } else {
    document.body.classList.add('material-minimal')
    const style = document.createElement('style')
    style.id = 'minimal-material-style'
    style.textContent = `
      .card, .bento-card, .analysis-card, .sidebar, 
      .right-column, .left-column, .middle-column, 
      .bottom-bar, .btn, .modal {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        background: var(--panel) !important;
      }
    `
    if (!document.getElementById('minimal-material-style')) {
      document.head.appendChild(style)
    }
  }
  pref.value.material = isGlassMode.value ? 'glass' : 'minimal'
  saveSettings()
}

// ========== 主题系统（编号 1-10）==========
// 1-5: 深色主题 (科技冷静、温暖高端、海洋灵感、多巴胺撞色、岩雾白)
// 6-10: 浅色主题 (对应深色主题的浅色版本)

const currentThemeId = ref(1)  // 默认主题1（科技冷静深色）
const isLightMode = computed(() => currentThemeId.value > 5)

// 主题名称映射（编号 -> 名称）
const themeNames = {
  1: '科技冷静',
  2: '温暖高端',
  3: '海洋灵感',
  4: '多巴胺撞色',
  5: '岩雾白',
  6: '科技冷静',
  7: '温暖高端',
  8: '海洋灵感',
  9: '多巴胺撞色',
  10: '岩雾白'
}

// 主题名称到基础编号的映射
const themeNameToBaseId = {
  'tech-cool': 1,
  'warm-luxury': 2,
  'ocean-mermaid': 3,
  'dopamine-energy': 4,
  'cloud-white': 5
}

// 获取当前主题名称
const currentThemeName = computed(() => {
  const mode = isLightMode.value ? '浅色' : '深色'
  return `${themeNames[currentThemeId.value]} (${mode})`
})

// 应用主题（通过设置 body 的 data-theme 属性）
const applyTheme = (themeId) => {
  currentThemeId.value = themeId
  document.body.setAttribute('data-theme', themeId.toString())
  lsSet(THEME_KEY, themeId)
  // 同步更新pref.theme，保持数据一致性
  pref.value.theme = getThemeNameById(themeId)
}

// 根据主题ID获取主题名称
const getThemeNameById = (themeId) => {
  const baseId = themeId <= 5 ? themeId : themeId - 5
  const themeMap = {
    1: 'tech-cool',
    2: 'warm-luxury',
    3: 'ocean-mermaid',
    4: 'dopamine-energy',
    5: 'cloud-white'
  }
  return themeMap[baseId] || 'tech-cool'
}

// 切换主题风格（通过主题名称）
// 保持当前深浅模式，切换主题风格
const changeTheme = (themeName) => {
  const baseId = themeNameToBaseId[themeName]
  if (!baseId) return
  
  // 根据当前深浅模式计算实际主题编号
  // 深色模式: 1-5, 浅色模式: 6-10
  const newThemeId = isLightMode.value ? baseId + 5 : baseId
  applyTheme(newThemeId)
}

// 切换主题（保持当前深浅模式，切换主题风格）- 通过索引
const changeThemeStyle = (styleIndex) => {
  // styleIndex: 0=科技冷静, 1=温暖高端, 2=海洋灵感, 3=多巴胺撞色, 4=岩雾白
  const baseId = isLightMode.value ? 6 : 1
  const newThemeId = baseId + styleIndex
  applyTheme(newThemeId)
}

// 切换深浅模式（核心逻辑：编号 ±5）
const toggleTheme = () => {
  // 关闭自动主题切换
  isAutoTheme.value = false
  localStorage.setItem('manualThemeMode', isDarkMode.value ? 'light' : 'dark')
  
  // 计算新的主题编号
  // 如果当前是深色(1-5)，切换到浅色就+5；如果当前是浅色(6-10)，切换到深色就-5
  const currentId = currentThemeId.value
  let newThemeId
  
  if (currentId <= 5) {
    // 当前是深色，切换到浅色：+5
    newThemeId = currentId + 5
  } else {
    // 当前是浅色，切换到深色：-5
    newThemeId = currentId - 5
  }
  
  applyTheme(newThemeId)
  
  // 更新深色模式状态（用于UI显示）
  isDarkMode.value = newThemeId <= 5
}

// 直接设置主题编号（1-10）
const setThemeById = (themeId) => {
  if (themeId >= 1 && themeId <= 10) {
    applyTheme(themeId)
    // 同步更新深色模式状态
    isDarkMode.value = themeId <= 5
  }
}

// 初始化主题
const initTheme = () => {
  const savedThemeId = lsGet(THEME_KEY, 1)
  applyTheme(savedThemeId)
  // 同步初始化深色模式状态
  isDarkMode.value = savedThemeId <= 5
  // 同步初始化材质状态
  isGlassMode.value = pref.value.material !== 'minimal'
}

// ===== 打卡相关 =====
const checkinStats = ref({ total: 0, streak: 0, today: false, history: [] })
const isChecking = ref(false)
const showCheckinSuccess = ref(false)
const isCheckinAnim = ref(false)

// 计算属性
const canCheckinToday = computed(() => !checkinStats.value.today)
const circumference = 2 * Math.PI * 40 // r=40

const progressOffset = computed(() => {
  const maxStreak = 30 // 假设30天为满环
  const progress = Math.min(checkinStats.value.streak / maxStreak, 1)
  return circumference * (1 - progress)
})

const progressColor = computed(() => {
  const streak = checkinStats.value.streak
  if (streak >= 30) return '#22c55e'
  if (streak >= 14) return '#3b82f6'
  if (streak >= 7) return '#f59e0b'
  return '#ef4444'
})

// 近7天打卡数据
const recentWeekDays = computed(() => {
  const days = []
  const today = dayjs()
  const history = checkinStats.value.history || []
  
  for (let i = 6; i >= 0; i--) {
    const date = today.subtract(i, 'day')
    const dateStr = date.format('YYYY-MM-DD')
    const weekday = date.format('ddd')
    const isToday = i === 0
    const checked = history.includes(dateStr)
    
    days.push({
      date: dateStr,
      weekday: weekday,
      checked,
      isToday
    })
  }
  return days
})

const weekCheckins = computed(() => {
  return recentWeekDays.value.filter(d => d.checked).length
})

// 加载打卡数据
const loadCheckinData = () => {
  checkinStats.value = getCheckinState()
}

// 处理打卡
const handleCheckin = async () => {
  if (isChecking.value) return
  
  isChecking.value = true
  isCheckinAnim.value = true
  
  try {
    const result = doCheckIn()
    if (result.success) {
      showCheckinSuccess.value = true
      loadCheckinData()
      
      // 3秒后隐藏成功特效
      setTimeout(() => {
        showCheckinSuccess.value = false
      }, 3000)
    }
  } finally {
    isChecking.value = false
    setTimeout(() => {
      isCheckinAnim.value = false
    }, 500)
  }
}

// ===== 天气和提醒 =====
const weatherIcon = ref('☀️')
const weatherTemp = ref(25)
const weatherDesc = ref('晴朗')
const dailyReminder = ref('准备好今天的面试了吗？')
const motivationQuote = ref('每一次练习，都是向成功迈进的一步')

// 模拟天气数据
const weatherData = [
  { icon: '☀️', desc: '晴朗', temp: 25 },
  { icon: '⛅', desc: '多云', temp: 22 },
  { icon: '🌧️', desc: '小雨', temp: 19 },
  { icon: '⛈️', desc: '雷阵雨', temp: 18 },
  { icon: '🌤️', desc: '晴间多云', temp: 24 }
]

const reminders = [
  '准备好今天的面试了吗？',
  '记得复习昨天的错题哦',
  '坚持打卡，offer在向你招手',
  '今天也要加油练习呀',
  '相信自己，你是最棒的'
]

const quotes = [
  '每一次练习，都是向成功迈进的一步',
  '机会总是留给有准备的人',
  '今天的努力，是明天的实力',
  '坚持就是胜利',
  '相信自己，你可以的'
]

// 随机选择天气和提醒
const randomizeWeather = () => {
  const weather = weatherData[Math.floor(Math.random() * weatherData.length)]
  weatherIcon.value = weather.icon
  weatherTemp.value = weather.temp
  weatherDesc.value = weather.desc
  
  dailyReminder.value = reminders[Math.floor(Math.random() * reminders.length)]
  motivationQuote.value = quotes[Math.floor(Math.random() * quotes.length)]
}

// ===== 每日一题（新设计：3道题，2小时刷新） =====
const dailyQuestions = ref([]) // 存储3道题
const currentQuestionIndex = ref(0) // 当前显示第几题（0-2）
const dailyQuestionLoading = ref(false)
const dailyQuestionError = ref(false)
const dailyQuestionRetryCount = ref(0)
const showAnswerPopup = ref(false) // 是否显示答案弹窗
const MAX_RETRY_COUNT = 3
const REFRESH_INTERVAL = 2 * 60 * 60 * 1000 // 2小时 = 7200000毫秒

// 计算下次刷新时间
const nextRefreshTime = computed(() => {
  const lastFetch = localStorage.getItem('dailyQuestionsLastFetch')
  if (!lastFetch) return null
  return new Date(parseInt(lastFetch) + REFRESH_INTERVAL)
})

// 距离下次刷新还有多久
const timeUntilNextRefresh = computed(() => {
  if (!nextRefreshTime.value) return ''
  const now = new Date()
  const diff = nextRefreshTime.value - now
  if (diff <= 0) return '即将刷新'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) {
    return `${hours}小时${minutes}分钟后刷新`
  }
  return `${minutes}分钟后刷新`
})

// 当前显示的题目
const currentQuestion = computed(() => {
  if (dailyQuestions.value.length === 0) return null
  return dailyQuestions.value[currentQuestionIndex.value]
})

// 是否已完成所有题目
const isAllCompleted = computed(() => {
  return currentQuestionIndex.value >= dailyQuestions.value.length && dailyQuestions.value.length > 0
})

// 加载每日一题（带重试机制）- 现在返回3道题
const loadDailyQuestion = async () => {
  // 检查是否需要刷新（2小时）
  const lastFetch = localStorage.getItem('dailyQuestionsLastFetch')
  const now = Date.now()
  
  if (lastFetch && (now - parseInt(lastFetch)) < REFRESH_INTERVAL) {
    // 使用缓存的题目
    const cached = localStorage.getItem('dailyQuestionsCache')
    if (cached) {
      try {
        dailyQuestions.value = JSON.parse(cached)
        console.log('使用缓存的每日一题:', dailyQuestions.value)
        return
      } catch (e) {
        console.error('解析缓存失败:', e)
      }
    }
  }
  
  dailyQuestionLoading.value = true
  dailyQuestionError.value = false

  while (dailyQuestionRetryCount.value < MAX_RETRY_COUNT) {
    try {
      const result = await interviewApi.getDailyQuestion()
      console.log('每日一题返回数据:', result)

      // 后端返回 List<TestQuestionEntity>
      const questions = result?.data || result

      if (Array.isArray(questions) && questions.length > 0) {
        // 转换数据格式
        dailyQuestions.value = questions.map((q, index) => ({
          id: q.id || index,
          question: q.content || q.question || q.questionText || '暂无问题',
          answer: q.ans || q.answer || q.answerText || '暂无答案',
          index: index + 1
        }))
        currentQuestionIndex.value = 0 // 重置到第一题
        dailyQuestionRetryCount.value = 0 // 重置重试计数
        
        // 缓存到 localStorage
        localStorage.setItem('dailyQuestionsCache', JSON.stringify(dailyQuestions.value))
        localStorage.setItem('dailyQuestionsLastFetch', String(now))
        localStorage.setItem('dailyQuestionCurrentIndex', '0')
        
        break // 成功获取，退出循环
      } else {
        throw new Error('返回数据为空或格式错误')
      }
    } catch (err) {
      console.error(`获取每日一题失败 (尝试 ${dailyQuestionRetryCount.value + 1}/${MAX_RETRY_COUNT}):`, err)
      dailyQuestionRetryCount.value++

      if (dailyQuestionRetryCount.value >= MAX_RETRY_COUNT) {
        // 达到最大重试次数
        dailyQuestionError.value = true
        dailyQuestions.value = []
      } else {
        // 等待 500ms 后重试
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }

  dailyQuestionLoading.value = false
}

// 手动重试
const retryDailyQuestion = () => {
  dailyQuestionRetryCount.value = 0
  loadDailyQuestion()
}

// 下一题
const nextQuestion = () => {
  if (currentQuestionIndex.value < dailyQuestions.value.length - 1) {
    currentQuestionIndex.value++
    showAnswerPopup.value = false // 切换题目时关闭答案弹窗
    localStorage.setItem('dailyQuestionCurrentIndex', String(currentQuestionIndex.value))
  }
}

// 上一题
const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    showAnswerPopup.value = false // 切换题目时关闭答案弹窗
    localStorage.setItem('dailyQuestionCurrentIndex', String(currentQuestionIndex.value))
  }
}

// 切换答案弹窗显示/隐藏
const toggleAnswerPopup = () => {
  showAnswerPopup.value = !showAnswerPopup.value
}

// 检查并刷新题目（定时调用）
const checkAndRefreshQuestions = () => {
  const lastFetch = localStorage.getItem('dailyQuestionsLastFetch')
  const now = Date.now()
  
  if (!lastFetch || (now - parseInt(lastFetch)) >= REFRESH_INTERVAL) {
    console.log('超过2小时，刷新每日一题')
    loadDailyQuestion()
  }
}

// 面试情报（展开状态使用）
const interviewTips = ref([
  { text: '自我介绍控制在1-2分钟' },
  { text: 'STAR法则回答行为面试题' },
  { text: '准备3-5个具体项目案例' },
  { text: '提前了解公司业务和文化' },
  { text: '准备3-5个反问问题' },
  { text: '注意语速和肢体语言' }
])

// ===== 面试统计 =====
const interviewCount = ref(0)

const loadInterviewCount = () => {
  const records = getRecords()
  interviewCount.value = records.length
}

// ===== 视图切换方法 =====
const showProfile = () => {
  currentView.value = 'detail'
  detailType.value = 'profile'
  username.value = user.value?.username || ''
}

const showSettings = () => {
  currentView.value = 'detail'
  detailType.value = 'settings'
}

// 显示每日一题详情
const showDailyQuestionDetail = () => {
  if (currentQuestion.value) {
    const q = currentQuestion.value
    alert(`【每日一题 - 第${q.index}题/共${dailyQuestions.value.length}题】\n\n问题：${q.question}\n\n答案：${q.answer || '暂无答案'}`)
  }
}

const backToList = () => {
  currentView.value = 'list'
  detailType.value = null
}

// ===== 个人中心方法 =====
const setGradientAvatar = async () => {
  // 生成随机渐变色头像
  const colors = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#30cfd0', '#330867']
  ]
  const [c1, c2] = colors[Math.floor(Math.random() * colors.length)]
  
  // 创建 canvas 生成渐变图片
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 200
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 200, 200)
  gradient.addColorStop(0, c1)
  gradient.addColorStop(1, c2)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 200, 200)
  
  // 添加文字
  ctx.fillStyle = 'white'
  ctx.font = 'bold 80px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText((user.value?.username?.charAt(0) || 'U').toUpperCase(), 100, 100)
  
  const dataUrl = canvas.toDataURL('image/png')
  
  try {
    await updateProfile({ avatar: { type: 'image', src: dataUrl } })
    okMsg.value = '头像已更新'
    setTimeout(() => okMsg.value = '', 2000)
  } catch (err) {
    errMsg.value = err.message || '更新失败'
    setTimeout(() => errMsg.value = '', 2000)
  }
}

const onPickFile = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  
  // 转换为 base64
  const reader = new FileReader()
  reader.onload = async (event) => {
    try {
      await updateProfile({ avatar: { type: 'image', src: event.target.result } })
      okMsg.value = '头像已更新'
      setTimeout(() => okMsg.value = '', 2000)
    } catch (err) {
      errMsg.value = err.message || '更新失败'
      setTimeout(() => errMsg.value = '', 2000)
    }
  }
  reader.readAsDataURL(file)
}

const saveProfile = async () => {
  if (!username.value.trim()) {
    errMsg.value = '用户名不能为空'
    setTimeout(() => errMsg.value = '', 2000)
    return
  }
  
  try {
    await updateProfile({ username: username.value.trim() })
    okMsg.value = '资料已保存'
    setTimeout(() => okMsg.value = '', 2000)
  } catch (err) {
    errMsg.value = err.message || '保存失败'
    setTimeout(() => errMsg.value = '', 2000)
  }
}

const onChangePassword = async () => {
  if (!oldPwd.value || !newPwd.value) {
    errMsg.value = '请填写完整密码信息'
    return
  }
  if (newPwd.value.length < 6) {
    errMsg.value = '新密码至少6位'
    return
  }
  
  try {
    const { changePassword } = await import('../../lib/auth')
    await changePassword({ oldPassword: oldPwd.value, newPassword: newPwd.value })
    okMsg.value = '密码已修改'
    oldPwd.value = ''
    newPwd.value = ''
    setTimeout(() => okMsg.value = '', 2000)
  } catch (err) {
    errMsg.value = err.message || '修改失败'
    setTimeout(() => errMsg.value = '', 2000)
  }
}

const onLogout = () => {
  showLogoutConfirm.value = true
}

// ===== 设置方法 =====
const SETTINGS_KEY = 'app_preferences'
const THEME_KEY = 'app_theme_id'

const saveSettings = () => {
  lsSet(SETTINGS_KEY, pref.value)
  okMsg.value = '设置已保存'
  setTimeout(() => okMsg.value = '', 2000)
}

const resetSettings = () => {
  pref.value = { 
    autoSeed: true, 
    showTips: true, 
    darkMode: false,
    theme: 'tech-cool',
    material: 'glass'
  }
  lsSet(SETTINGS_KEY, pref.value)
  applyTheme(1)
  isGlassMode.value = true
  toggleMaterial()
  okMsg.value = '已恢复默认设置'
  setTimeout(() => okMsg.value = '', 2000)
}

// ===== 退出登录 =====
const showLogoutConfirm = ref(false)

const logout = () => {
  authLogout()
  showLogoutConfirm.value = false
  router.push('/login')
}

// 定时器引用
let refreshTimer = null

// ===== 生命周期 =====
onMounted(() => {
  loadCheckinData()
  loadInterviewCount()
  randomizeWeather()
  initTheme()
  loadDailyQuestion()
  
  // 恢复当前题目索引
  const savedIndex = localStorage.getItem('dailyQuestionCurrentIndex')
  if (savedIndex) {
    currentQuestionIndex.value = parseInt(savedIndex) || 0
  }
  
  // 设置定时检查刷新（每分钟检查一次）
  refreshTimer = setInterval(() => {
    checkAndRefreshQuestions()
  }, 60000) // 60000ms = 1分钟
})

onUnmounted(() => {
  // 清理定时器
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

// 主题图标和文字
const isDarkMode = ref(false)
const isAutoTheme = ref(true)

const themeIcon = computed(() => isDarkMode.value ? Sun : Moon)
const themeText = computed(() => isDarkMode.value ? '切换浅色' : '切换深色')
</script>

<style scoped>
.right-column {
  width: 100%;
  height: 100%;
  background: var(--panel);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
}

.column-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
}

/* 列表视图 */
.list-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.section {
  background: var(--panel2);
  border-radius: 16px;
  border: 1px solid var(--stroke);
  transition: all 0.3s ease;
}

/* 打卡区域 */
.top-section {
  flex: 0 0 30%;
  min-height: 140px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.checkin-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  padding: 8px 4px;
}

.checkin-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.progress-ring {
  position: relative;
  width: 60px;
  height: 60px;
}

.ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-fill {
  transition: stroke-dashoffset 0.5s ease;
}

.progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.progress-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.progress-label {
  font-size: 11px;
  color: var(--muted);
}

.checkin-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.checkin-label {
  font-size: 12px;
  color: var(--muted);
}

.checkin-streak {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.checkin-total {
  font-size: 11px;
  color: var(--muted);
}

.checkin-btn, .checkin-done {
  width: 100%;
  padding: 8px 6px;
  border-radius: 10px;
  border: none;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 2px;
  transition: all 0.2s;
}

.checkin-btn {
  background: linear-gradient(135deg, var(--brand) 0%, var(--good) 100%);
  color: white;
  cursor: pointer;
}

.checkin-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.4);
}

.checkin-done {
  background: var(--panel);
  color: var(--muted);
}

/* 展开状态的打卡 */
.checkin-expanded {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.checkin-header-expanded {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.checkin-stats-large {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
}

.stat-label {
  font-size: 11px;
  color: var(--muted);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--stroke);
}

.checkin-btn-expanded, .checkin-done-expanded {
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.checkin-btn-expanded {
  background: linear-gradient(135deg, var(--brand) 0%, var(--good) 100%);
  color: white;
  cursor: pointer;
}

.checkin-done-expanded {
  background: var(--panel);
  color: var(--good);
}

/* 周历 */
.week-calendar {
  margin-top: auto;
}

.week-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.week-title {
  font-size: 12px;
  color: var(--muted);
}

.week-count {
  font-size: 11px;
  color: var(--brand);
  font-weight: 500;
}

.week-days {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}

.week-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 6px 4px;
  border-radius: 8px;
  transition: all 0.2s;
}

.week-day.today {
  background: rgba(100, 108, 255, 0.1);
}

.day-name {
  font-size: 11px;
  color: var(--muted);
}

.day-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--stroke);
  transition: all 0.2s;
}

.day-dot.active {
  background: var(--good);
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

/* 中间区域 */
.middle-section {
  flex: 0 0 40%;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.compact-weather-reminder {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  padding: 8px 4px;
  justify-content: center;
}

/* 每日一题 - 收缩状态 */
.compact-daily-question {
  padding: 8px 6px;
  background: var(--panel);
  border-radius: 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

.daily-q-header {
  display: flex;
  align-items: center;
  gap: 4px;
}

.daily-q-icon {
  font-size: 18px;
}

.daily-q-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--brand);
}

.daily-q-text {
  font-size: 12px;
  color: var(--text);
  line-height: 1.4;
  text-align: center;
}

.daily-q-loading {
  font-size: 11px;
  color: var(--muted);
  text-align: center;
  font-style: italic;
}

.daily-q-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #ef4444;
  text-align: center;
}

.daily-q-error .error-text {
  font-weight: 500;
}

.daily-q-error .retry-icon {
  font-size: 14px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.95); }
}

.compact-daily-question {
  cursor: pointer;
  transition: all 0.2s ease;
}

.compact-daily-question:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.compact-daily-question.has-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.compact-daily-question.has-error:hover {
  background: rgba(239, 68, 68, 0.15);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

.compact-weather {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 6px;
  background: var(--panel);
  border-radius: 10px;
}

.weather-icon-large {
  font-size: 28px;
}

.weather-info-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.weather-temp-compact {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.weather-desc-compact {
  font-size: 11px;
  color: var(--muted);
}

.compact-reminder {
  padding: 6px 4px;
  background: var(--panel);
  border-radius: 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.reminder-header {
  display: flex;
  align-items: center;
  gap: 2px;
}

.reminder-icon-small {
  font-size: 12px;
}

.reminder-title-small {
  font-size: 11px;
  color: var(--muted);
}

.reminder-text-compact {
  font-size: 12px;
  color: var(--text);
  line-height: 1.4;
  text-align: center;
}

/* 展开状态的中间区域 */
.middle-expanded {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  height: 100%;
}

.tip-section h4 {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 10px;
}

.tip-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: var(--panel);
  border-radius: 10px;
}

.tip-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--brand);
  color: white;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tip-text {
  font-size: 12px;
  color: var(--text);
  line-height: 1.4;
}

/* 每日一题展开状态 */
.daily-question-expanded {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.daily-q-loading-expanded {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: var(--muted);
  font-size: 13px;
}

.daily-q-loading-expanded .loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--stroke);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.daily-q-error-expanded {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.daily-q-error-expanded:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
}

.daily-q-error-expanded .error-icon {
  font-size: 24px;
}

.daily-q-error-expanded .error-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 2px;
}

.daily-q-error-expanded .error-title {
  font-size: 14px;
  font-weight: 600;
  color: #ef4444;
}

.daily-q-error-expanded .error-desc {
  font-size: 12px;
  color: #f87171;
}

.daily-q-error-expanded .retry-btn {
  font-size: 18px;
  animation: pulse 1.5s infinite;
}

.daily-q-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: var(--panel);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.daily-q-content:hover {
  background: var(--panel2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.daily-q-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.daily-q-answer-preview {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 8px;
  background: var(--bg1);
  border-radius: 8px;
  font-size: 12px;
}

.daily-q-answer-preview .answer-label {
  color: var(--muted);
  flex-shrink: 0;
}

.daily-q-answer-preview .answer-text {
  color: var(--text);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.daily-q-hint {
  font-size: 11px;
  color: var(--muted);
  text-align: center;
  padding-top: 4px;
  border-top: 1px dashed var(--stroke);
}

.daily-q-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: var(--muted);
  font-size: 13px;
}

/* 新增：答案弹窗 */
.daily-q-answer-popup {
  margin: 10px 0;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  overflow: hidden;
  animation: slideDown 0.3s ease;
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

.answer-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(34, 197, 94, 0.15);
  border-bottom: 1px solid rgba(34, 197, 94, 0.2);
}

.answer-popup-title {
  font-size: 13px;
  font-weight: 600;
  color: #22c55e;
}

.answer-popup-close {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  border-radius: 6px;
  color: #22c55e;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.answer-popup-close:hover {
  background: rgba(34, 197, 94, 0.2);
}

.answer-popup-content {
  padding: 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  max-height: 200px;
  overflow-y: auto;
}

/* 新增：每日一题进度指示器 */
.daily-q-progress {
  font-size: 10px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  padding: 2px 6px;
  border-radius: 8px;
  margin-left: auto;
}

/* 新增：完成状态 */
.daily-q-completed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
}

.daily-q-completed .completed-icon {
  font-size: 24px;
}

.daily-q-completed .completed-text {
  font-size: 12px;
  font-weight: 600;
  color: #22c55e;
}

.daily-q-completed .completed-sub {
  font-size: 10px;
  color: var(--muted);
}

/* 新增：题目导航 */
.daily-q-nav {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.daily-q-nav .nav-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--panel2);
  border: 1px solid var(--stroke);
  border-radius: 8px;
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.daily-q-nav .nav-btn:hover:not(:disabled) {
  background: var(--brand);
  color: white;
  border-color: var(--brand);
}

.daily-q-nav .nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 新增：展开状态头部 */
.daily-q-header-expanded {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.daily-q-header-expanded h4 {
  margin: 0;
}

.daily-q-badge {
  font-size: 12px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  padding: 4px 10px;
  border-radius: 10px;
}

/* 新增：完成状态（展开） */
.daily-q-completed-expanded {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 16px;
  text-align: center;
}

.daily-q-completed-expanded .completed-icon-large {
  font-size: 48px;
}

.daily-q-completed-expanded .completed-title {
  font-size: 18px;
  font-weight: 700;
  color: #22c55e;
}

.daily-q-completed-expanded .completed-text {
  font-size: 14px;
  color: var(--text);
}

.daily-q-completed-expanded .completed-time {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

/* 新增：内容区（展开） */
.daily-q-content-expanded {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.daily-q-item-expanded {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: var(--panel);
  border-radius: 12px;
}

.daily-q-answer-preview-expanded {
  padding: 10px 12px;
  background: var(--panel2);
  border-radius: 10px;
  font-size: 13px;
}

.daily-q-answer-preview-expanded .answer-label {
  font-weight: 600;
  color: var(--brand);
}

.daily-q-answer-preview-expanded .answer-text {
  color: var(--muted);
}

/* 新增：导航按钮（展开） */
.daily-q-nav-expanded {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.daily-q-nav-expanded .nav-btn-large {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 10px;
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  justify-content: center;
}

.daily-q-nav-expanded .nav-btn-large:hover:not(:disabled) {
  background: var(--brand);
  color: white;
  border-color: var(--brand);
}

.daily-q-nav-expanded .nav-btn-large:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.daily-q-nav-expanded .nav-btn-large.primary {
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  color: white;
  border-color: transparent;
}

.daily-q-nav-expanded .nav-btn-large.primary:hover {
  filter: brightness(1.1);
}

.daily-q-nav-expanded .nav-icon {
  font-size: 10px;
}

.weather-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.weather-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--panel);
  border-radius: 12px;
}

.weather-icon {
  font-size: 36px;
}

.weather-info {
  display: flex;
  flex-direction: column;
}

.weather-temp {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
}

.weather-desc {
  font-size: 12px;
  color: var(--muted);
}

.reminder-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: var(--panel);
  border-radius: 12px;
}

.reminder-icon {
  font-size: 20px;
}

.reminder-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reminder-title {
  font-size: 12px;
  color: var(--muted);
}

.reminder-text {
  font-size: 13px;
  color: var(--text);
  line-height: 1.4;
}

.motivation-card {
  padding: 12px;
  background: linear-gradient(135deg, rgba(100, 108, 255, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 12px;
  border: 1px solid rgba(100, 108, 255, 0.2);
}

.motivation-text {
  font-size: 12px;
  color: var(--text);
  font-style: italic;
  line-height: 1.5;
}

/* 底部区域 */
.bottom-section {
  flex: 0 0 30%;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.profile-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  height: 100%;
  justify-content: center;
}

.icon-button {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--stroke);
  background: var(--panel);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-button:hover {
  background: var(--brand);
  color: white;
  border-color: var(--brand);
}

/* 展开状态的个人资料 */
.profile-expanded {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--panel);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-card:hover {
  background: var(--panel2);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, var(--brand) 0%, var(--good) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 11px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-stats {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 11px;
  color: var(--muted);
}

.settings-menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: none;
  background: var(--panel);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover {
  background: var(--brand);
  color: white;
}

.menu-item.logout-btn:hover {
  background: var(--bad);
}

/* 详情视图通用样式 */
.detail-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  margin-bottom: 12px;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
}

.back-btn:hover {
  color: var(--brand);
  transform: translateX(-2px);
}

.back-icon {
  font-size: 16px;
}

/* 个人中心详情 */
.profile-detail,
.settings-detail {
  flex: 1;
  overflow-y: auto;
}

.detail-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 20px;
}

.detail-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--stroke);
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  margin: 0 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-section.danger-zone {
  background: rgba(239, 68, 68, 0.05);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-bottom: 1px solid rgba(239, 68, 68, 0.2);
}

/* 头像区域 */
.profile-avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.user-avatar-large {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, var(--brand) 0%, var(--good) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--panel);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-large {
  font-size: 28px;
  font-weight: 600;
  color: white;
}

.avatar-actions {
  display: flex;
  gap: 8px;
}

.btn.small {
  padding: 8px 14px;
  font-size: 12px;
  border-radius: 8px;
  border: 1px solid var(--stroke);
  background: var(--panel);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
}

.btn.small:hover {
  background: var(--brand);
  color: white;
  border-color: var(--brand);
}

/* 表单组 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 6px;
}

.input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--stroke);
  border-radius: 10px;
  font-size: 14px;
  background: var(--panel);
  color: var(--text);
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.form-actions.centered {
  justify-content: center;
}

.btn {
  padding: 10px 20px;
  border: 1px solid var(--stroke);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--panel);
  color: var(--text);
}

.btn:hover {
  background: var(--panel2);
}

.btn.primary {
  background: var(--brand);
  border-color: var(--brand);
  color: white;
}

.btn.primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.4);
}

.btn.danger {
  background: var(--bad);
  border-color: var(--bad);
  color: white;
}

.btn.danger:hover {
  filter: brightness(1.1);
}

.btn.text-btn {
  border: none;
  background: transparent;
  color: var(--muted);
}

.btn.text-btn:hover {
  color: var(--text);
  background: var(--panel);
}

/* 设置页面新样式 */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 6px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: var(--panel);
  cursor: pointer;
  transition: all 0.2s;
}

.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.theme-card.active {
  border-color: var(--brand);
  background: rgba(100, 108, 255, 0.1);
}

.theme-color {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.theme-card .theme-name {
  font-size: 11px;
  color: var(--text);
  text-align: center;
}

/* 外观模式选择器 */
.mode-selector {
  display: flex;
  gap: 12px;
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border-radius: 12px;
  border: 2px solid var(--stroke);
  background: var(--panel);
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  border-color: var(--brand);
}

.mode-btn.active {
  border-color: var(--brand);
  background: rgba(100, 108, 255, 0.1);
  color: var(--brand);
}

/* 材质切换 */
.material-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--panel);
  border-radius: 12px;
}

.toggle-label {
  font-size: 14px;
  color: var(--text);
}

/* Switch 开关 */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--stroke);
  transition: 0.3s;
  border-radius: 26px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: var(--brand);
}

input:checked + .slider:before {
  transform: translateX(22px);
}

/* Toast 提示 */
.toast-message {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  animation: slideUp 0.3s ease;
  z-index: 1000;
}

.toast-message.success {
  background: var(--good);
  color: white;
}

.toast-message.error {
  background: var(--bad);
  color: white;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 操作区域 */
.actions-section {
  border-bottom: none;
  margin-top: 8px;
}

/* 成功/错误消息 */
.success-message, .error-message {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 12px;
}

.success-message {
  background: rgba(34, 197, 94, 0.1);
  color: var(--good);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: var(--bad);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* 退出确认弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--panel);
  border-radius: 16px;
  padding: 24px;
  min-width: 300px;
  max-width: 90vw;
  border: 1px solid var(--stroke);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.warning-icon {
  color: var(--warn);
}

.modal-body {
  margin-bottom: 20px;
}

.modal-body p {
  font-size: 14px;
  color: var(--text);
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn.secondary {
  background: var(--panel2);
  border-color: var(--stroke);
}

.btn.secondary:hover {
  background: var(--panel);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 打卡成功特效 */
.checkin-success-ring {
  position: absolute;
  inset: -4px;
  border: 3px solid var(--good);
  border-radius: 50%;
  animation: successPulse 0.6s ease-out forwards;
  pointer-events: none;
}

@keyframes successPulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

/* 打卡动画 */
.checkin-anim .ring-fill {
  animation: checkinPulse 0.5s ease;
}

@keyframes checkinPulse {
  0%, 100% {
    stroke-width: 8;
  }
  50% {
    stroke-width: 12;
  }
}

/* 滚动条样式 */
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
  background: var(--muted);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .right-column.expanded {
    width: 100%;
    min-width: 100%;
    position: fixed;
    inset: 0;
    z-index: 100;
  }
  
  .theme-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
