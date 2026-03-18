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
              <div class="progress-ring">
                <svg class="ring" viewBox="0 0 100 100">
                  <circle class="ring-bg" cx="50" cy="50" r="40" fill="none" stroke="#eef2f6" stroke-width="8"/>
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
              </div>
              <div class="checkin-info">
                <div class="checkin-label">连续打卡</div>
                <div class="checkin-streak">{{ checkinStats.streak }} 天</div>
                <div class="checkin-total">累计 {{ checkinStats.total }} 天</div>
              </div>
            </div>

            <!-- 展开状态：近两周打卡记录 -->
            <div v-else class="checkin-expanded">
              <div class="calendar-header">
                <h4>📅 近两周打卡</h4>
              </div>
              <div class="calendar-grid">
                <div class="weekdays">
                  <span v-for="day in weekdays" :key="day">{{ day }}</span>
                </div>
                <div class="days-grid two-weeks">
                  <!-- 近两周日期 -->
                  <div 
                    v-for="(day, index) in recentTwoWeeksDays" 
                    :key="'recent-' + index"
                    class="calendar-day"
                    :class="{
                      'checked': day.checked,
                      'today': day.isToday,
                      'future': day.isFuture
                    }"
                  >
                    {{ day.date }}
                  </div>
                </div>
              </div>
              <div class="calendar-stats">
                <div class="stat-item">
                  <span class="stat-label">本周</span>
                  <span class="stat-value">{{ weekCheckins }}天</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">连续</span>
                  <span class="stat-value">{{ checkinStats.streak }}天</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">累计</span>
                  <span class="stat-value">{{ checkinStats.total }}天</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== 中部分：面试情报 + 天气提醒（各占一半，共占比40%） ===== -->
          <div class="section middle-section" :class="{ expanded }">
            <!-- 收缩状态：天气 + 温馨提醒 -->
            <div v-if="!expanded" class="compact-weather-reminder">
              <!-- 天气卡片 -->
              <div class="compact-weather">
                <div class="weather-icon-large">{{ weatherIcon }}</div>
                <div class="weather-info-compact">
                  <div class="weather-temp-compact">{{ weatherTemp }}°</div>
                  <div class="weather-desc-compact">{{ weatherDesc }}</div>
                </div>
              </div>
              <!-- 温馨提醒 -->
              <div class="compact-reminder">
                <div class="reminder-header">
                  <span class="reminder-icon-small">✨</span>
                  <span class="reminder-title-small">今日提醒</span>
                </div>
                <div class="reminder-text-compact">{{ dailyReminder }}</div>
              </div>
            </div>

            <!-- 展开状态：左右分栏（情报 + 天气提醒） -->
            <div v-else class="middle-expanded">
              <!-- 左侧：面试情报 -->
              <div class="tip-section">
                <h4>📋 面试情报</h4>
                <div class="tip-list">
                  <div v-for="(tip, index) in interviewTips.slice(0, 4)" :key="index" class="tip-item">
                    <span class="tip-badge">{{ index + 1 }}</span>
                    <span class="tip-text">{{ tip.text }}</span>
                  </div>
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
            <h3 class="detail-title">设置</h3>
            
            <div class="detail-section">
              <h4>偏好设置</h4>
              
              <label class="setting-item">
                <input type="checkbox" v-model="pref.autoSeed" />
                <span>自动生成示例面试记录</span>
              </label>

              <label class="setting-item">
                <input type="checkbox" v-model="pref.showTips" />
                <span>显示引导提示</span>
              </label>
                      <!-- 添加配色方案选择 -->
              <div class="theme-section">
                <label class="setting-label">配色方案</label>
                <div class="theme-options">
                  <button 
                    class="theme-btn"
                    :class="{ active: pref.theme === 'tech-cool' }"
                    @click="changeTheme('tech-cool')"
                  >
                    <span class="theme-preview tech-cool"></span>
                    <span class="theme-name">科技冷静</span>
                  </button>
                  <button 
                    class="theme-btn"
                    :class="{ active: pref.theme === 'warm-luxury' }"
                    @click="changeTheme('warm-luxury')"
                  >
                    <span class="theme-preview warm-luxury"></span>
                    <span class="theme-name">温暖高端</span>
                  </button>
                  <button 
                    class="theme-btn"
                    :class="{ active: pref.theme === 'ocean-mermaid' }"
                    @click="changeTheme('ocean-mermaid')"
                  >
                    <span class="theme-preview ocean-mermaid"></span>
                    <span class="theme-name">海洋灵感</span>
                  </button>
                </div>
              </div>
              <!-- 在配色方案选择后面添加材质选择 -->
              <div class="material-section">
                <label class="setting-label">材质效果</label>
                <div class="material-options">
                  <button 
                    class="material-btn"
                    :class="{ active: pref.material === 'glass' }"
                    @click="changeMaterial('glass')"
                  >
                    <span class="material-preview glass"></span>
                    <span class="material-name">玻璃拟态</span>
                  </button>
                  <button 
                    class="material-btn"
                    :class="{ active: pref.material === 'minimal' }"
                    @click="changeMaterial('minimal')"
                  >
                    <span class="material-preview minimal"></span>
                    <span class="material-name">简约平面</span>
                  </button>
                </div>
                <p class="material-hint">玻璃材质有更好的视觉效果，简约平面更省性能</p>
              </div>


              <label class="setting-item">
                <input type="checkbox" v-model="pref.darkMode" @change="toggleTheme" />
                <span>深色模式</span>
              </label>

              <div class="form-actions">
                <button class="btn primary" @click="saveSettings">保存</button>
                <button class="btn" @click="resetSettings">恢复默认</button>
              </div>
            </div>
             <!-- 👇 在这里添加提示信息 -->
            <div v-if="okMsg" class="success-message">{{ okMsg }}</div>
            <div v-if="errMsg" class="error-message">{{ errMsg }}</div>
              <!-- 👆 添加到这里 -->


            <div class="detail-section">
              <h4>关于</h4>
              <p class="about-text">AI 面试官 UI 壳子</p>
              <p class="about-text muted">版本 1.0.0</p>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 退出确认弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showLogoutConfirm" class="modal-overlay" @click="showLogoutConfirm = false">
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
import { getCheckinState, getEquippedCosmetics } from '../../lib/checkin'
import { getRecords } from '../../lib/records'

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
// ===== 材质切换 =====
const changeMaterial = (material) => {
  if (material === 'minimal') {
    // 移除所有玻璃效果类，回退到基础样式
    document.body.classList.add('material-minimal');
    // 移除玻璃效果（通过覆盖样式）
    const style = document.createElement('style');
    style.id = 'minimal-material-style';
    style.textContent = `
      .card, .bento-card, .analysis-card, .sidebar, 
      .right-column, .left-column, .middle-column, 
      .bottom-bar, .btn, .modal {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        background: var(--panel) !important;
      }
    `;
    if (!document.getElementById('minimal-material-style')) {
      document.head.appendChild(style);
    }
  } else {
    // 移除简约模式样式
    const minimalStyle = document.getElementById('minimal-material-style');
    if (minimalStyle) minimalStyle.remove();
    document.body.classList.remove('material-minimal');
  }
  
  pref.value.material = material;
  saveSettings();
}
// ===== 主题切换 =====
const changeTheme = (theme) => {
  // 移除所有主题类
  document.body.classList.remove('theme-warm', 'theme-ocean')
  
  // 添加新主题类
  if (theme === 'warm-luxury') {
    document.body.classList.add('theme-warm')
  } else if (theme === 'ocean-mermaid') {
    document.body.classList.add('theme-ocean')
  }
  // tech-cool 是默认主题，不需要添加类
  
  pref.value.theme = theme
  saveSettings()  // 自动保存
}

// 初始化主题
const initTheme = () => {
  const savedTheme = pref.value.theme
  if (savedTheme === 'warm-luxury') {
    document.body.classList.add('theme-warm')
  } else if (savedTheme === 'ocean-mermaid') {
    document.body.classList.add('theme-ocean')
  }
}

// 初始化材质
const initMaterial = () => {
  const savedMaterial = pref.value.material
  if (savedMaterial === 'minimal') {
    changeMaterial('minimal')
  }
}
const showProfile = () => {
  currentView.value = 'detail'
  detailType.value = 'profile'
  // 加载个人资料数据
  loadProfileData()
}

const showSettings = () => {
  currentView.value = 'detail'
  detailType.value = 'settings'
  // 加载设置数据
  loadSettingsData()
}

const backToList = () => {
  currentView.value = 'list'
  detailType.value = null
}

// ===== 个人资料数据 =====


const loadProfileData = () => {
  username.value = user.value?.username || ''
}

const saveProfile = () => {
  try {
    updateProfile({ username: username.value })
    // 显示成功提示（可选）
  } catch (e) {
    // 显示错误提示（可选）
  }
}

const onChangePassword = () => {
  // 实现密码修改逻辑
}

const setGradientAvatar = () => {
  try {
    updateProfile({ avatar: { kind: 'gradient', seed: user.value?.email || 'user' } })
  } catch (e) {}
}

const onPickFile = (ev) => {
  const f = ev.target.files?.[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      updateProfile({ avatar: { kind: 'image', src: String(reader.result) } })
    } catch (e) {}
  }
  reader.readAsDataURL(f)
}

// ===== 设置数据 =====
const SETTINGS_KEY = 'ai_prefs'


const loadSettingsData = () => {
  pref.value = lsGet(SETTINGS_KEY, { 
    autoSeed: true, 
    showTips: true, 
    darkMode: false,
    theme: 'tech-cool',
    material: 'glass'
  })
}

const saveSettings = () => {
  lsSet(SETTINGS_KEY, pref.value)
  okMsg.value = '已保存'
  setTimeout(() => okMsg.value = '', 2000)
  // 显示成功提示
}

const resetSettings = () => {
  pref.value = { autoSeed: true, showTips: true, darkMode: false }
  saveSettings()
}

// ===== 退出登录 =====
const showLogoutConfirm = ref(false)

const logout = () => {
  authLogout()
  router.push('/login')
}

// ===== 打卡相关 =====
const checkinStats = ref({ streak: 0, total: 0, days: [] })
const weekdays = ['一', '二', '三', '四', '五', '六', '日']

// 近两周日期（14天，从上周一开始）
const recentTwoWeeksDays = computed(() => {
  const days = []
  const today = dayjs()
  const todayStr = today.format('YYYY-MM-DD')
  
  // 从上周一开始（今天往前推最多13天，找到最近的周一）
  const startOfThisWeek = today.startOf('week').add(1, 'day') // 本周一
  const startDate = startOfThisWeek.subtract(7, 'day') // 上周一
  
  for (let i = 0; i < 14; i++) {
    const currentDate = startDate.add(i, 'day')
    const dateStr = currentDate.format('YYYY-MM-DD')
    days.push({
      date: currentDate.date(),
      checked: checkinStats.value.days?.includes(dateStr) || false,
      isToday: dateStr === todayStr,
      isFuture: currentDate.isAfter(today, 'day')
    })
  }
  
  return days
})

// 本周打卡天数
const weekCheckins = computed(() => {
  const today = dayjs()
  const startOfWeek = today.startOf('week').add(1, 'day') // 本周一
  const endOfWeek = startOfWeek.add(6, 'day') // 本周日
  
  return checkinStats.value.days?.filter(d => {
    const date = dayjs(d)
    return date.isAfter(startOfWeek.subtract(1, 'day')) && date.isBefore(endOfWeek.add(1, 'day'))
  }).length || 0
})

const circumference = 2 * Math.PI * 40
const progressOffset = computed(() => {
  const progress = (checkinStats.value.streak % 30) / 30
  return circumference * (1 - Math.min(progress, 1))
})

const progressColor = computed(() => {
  const streak = checkinStats.value.streak
  if (streak >= 30) return '#8b5cf6'
  if (streak >= 10) return '#3b82f6'
  if (streak >= 3) return '#10b981'
  return '#94a3b8'
})

// ===== 面试情报 =====
const interviewTips = [
  { text: '回答问题时先用STAR原则概括' },
  { text: 'JVM内存模型：堆、栈、方法区' },
  { text: 'HTTP和HTTPS的区别是什么？' },
  { text: 'Vue3的响应式原理是什么？' },
  { text: 'MySQL索引为什么用B+树？' },
  { text: '如何优化前端性能？' },
  { text: 'Redis的持久化方式有哪些？' },
  { text: '线程池的核心参数有哪些？' }
]

const currentTipIndex = ref(0)
let tipTimer = null

const currentTip = computed(() => interviewTips[currentTipIndex.value])

const nextTip = () => {
  currentTipIndex.value = (currentTipIndex.value + 1) % interviewTips.length
}

// ===== 天气和提醒 =====
const weatherIcon = ref('☀️')
const weatherTemp = ref(22)
const weatherDesc = ref('晴朗')
const dailyReminder = ref('今天有 2 场面试待准备')
const motivationQuote = ref('每一个认真准备的面试，都是离 offer 更近一步')

// ===== 统计数据 =====
const interviewCount = computed(() => {
  return getRecords().length
})

// ===== 主题切换 =====
const isDarkMode = ref(false)
const themeIcon = computed(() => isDarkMode.value ? Moon : Sun)
const themeText = computed(() => isDarkMode.value ? '浅色模式' : '深色模式')

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  document.body.classList.toggle('night-theme', isDarkMode.value)
}

// ===== 初始化数据 =====
const loadCheckinData = () => {
  if (user.value?.email) {
    const state = getCheckinState(user.value.email)
    checkinStats.value = {
      streak: state.streak || 0,
      total: state.total || 0,
      days: state.days || []
    }
  }
}

// 自动轮播
const startTipRotation = () => {
  tipTimer = setInterval(() => {
    currentTipIndex.value = (currentTipIndex.value + 1) % interviewTips.length
  }, 5000)
}

const updateWeather = () => {
  const hour = new Date().getHours()
  if (hour < 6 || hour > 18) {
    weatherIcon.value = '🌙'
    weatherDesc.value = '夜间'
    weatherTemp.value = 18
  } else {
    const weathers = ['☀️', '⛅', '☁️', '🌧️']
    const idx = Math.floor(Math.random() * weathers.length)
    weatherIcon.value = weathers[idx]
    weatherDesc.value = ['晴朗', '多云', '阴天', '小雨'][idx]
    weatherTemp.value = 20 + Math.floor(Math.random() * 8)
  }
}

const updateReminder = () => {
  const records = getRecords()
  const today = dayjs().format('YYYY-MM-DD')
  const todayInterviews = records.filter(r => 
    dayjs(r.startedAt).format('YYYY-MM-DD') === today
  ).length
  
  if (todayInterviews > 0) {
    dailyReminder.value = `今天有 ${todayInterviews} 场面试待准备`
  } else {
    dailyReminder.value = '今天暂无面试安排，可以继续学习'
  }
  
  const quotes = [
    '每一个认真准备的面试，都是离 offer 更近一步',
    '面试是双向选择，也是展示自己的机会',
    '今天的努力，是明天的底气',
    '保持学习，保持进步',
    '相信自己，你可以的'
  ]
  motivationQuote.value = quotes[Math.floor(Math.random() * quotes.length)]
}

const cosmetics = ref({ frame: null, badge: null })

function refreshCheckin() {
  const email = user.value?.email
  if (!email) return
  const s = getCheckinState(email)
  checkinStats.value = {
    streak: Number(s?.streak || 0),
    total: Number(s?.total || 0),
    days: s?.days || []
  }
  cosmetics.value = getEquippedCosmetics(email)
}

function onCheckinUpdated(ev) {
  const email = ev?.detail?.email
  if (email && email === user.value?.email) refreshCheckin()
}

onMounted(() => {
  refreshCheckin()
  startTipRotation()
  updateWeather()
  updateReminder()
  initTheme()
  initMaterial()
  
  window.addEventListener('ai-checkin-updated', onCheckinUpdated)
})

onUnmounted(() => {
  if (tipTimer) clearInterval(tipTimer)
  window.removeEventListener('ai-checkin-updated', onCheckinUpdated)
})

</script>

<style scoped>

/* 材质选项 */
.material-section {
  margin: 16px 0;
  padding: 12px;
  background: var(--card-bg);
  border-radius: 12px;
}

.material-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.material-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  background: var(--card-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.material-btn:hover {
  transform: translateY(-2px);
  border-color: var(--accent-primary);
}

.material-btn.active {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--glow-color);
}

.material-preview {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.material-preview.glass {
  background: linear-gradient(135deg, rgba(100, 108, 255, 0.2), rgba(100, 108, 255, 0.05));
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.material-preview.minimal {
  background: var(--panel);
  border: 1px solid var(--stroke);
}

.material-name {
  font-size: 12px;
  color: var(--text-primary);
}

.material-hint {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 8px;
}
/* 配色方案选择 */
.theme-section {
  margin: 16px 0;
  padding: 12px;
  background: var(--panel2);
  border: 1px solid var(--stroke);
  border-radius: 12px;
}

.setting-label {
  display: block;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 12px;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.theme-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-btn:hover {
  transform: translateY(-2px);
  border-color: var(--brand);
}

.theme-btn.active {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand);
}

.theme-preview {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.theme-preview.tech-cool {
  background: linear-gradient(135deg, #0A0C14 0%, #646CFF 100%);
}

.theme-preview.warm-luxury {
  background: linear-gradient(135deg, #110F0B 0%, #C8A96E 100%);
}

.theme-preview.ocean-mermaid {
  background: linear-gradient(135deg, #0D9488 0%, #6B21A5 100%);
}

.theme-name {
  font-size: 12px;
  color: var(--text);
}
.user-avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-large {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
}
.success-message {
  margin-top: 10px;
  padding: 8px 12px;
  background: #dcfce7;
  color: #16a34a;
  border-radius: 8px;
  font-size: 13px;
}

.error-message {
  margin-top: 10px;
  padding: 8px 12px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 13px;
}
.right-column {
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
  gap: 16px;
}

/* 通用section样式 */
.section {
  background: var(--panel2);
  border: 1px solid var(--stroke);
  border-radius: 16px;
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 调整各部分的占比 */
.section.top-section {
  flex: 3;  /* 30% */
  min-height: 0;
}

.section.middle-section {
  flex: 4;  /* 40% */
  min-height: 0;
}

.section.bottom-section {
  flex: 3;  /* 30% */
  min-height: 0;
}

/* ===== 打卡部分 - 收缩状态 ===== */
.checkin-compact {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
}

.progress-ring {
  position: relative;
  width: 70px;
  height: 70px;
  flex-shrink: 0;
}

.ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  stroke: var(--stroke);
}

.ring-fill {
  transition: stroke-dashoffset 0.5s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.progress-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}

.progress-label {
  font-size: 10px;
  color: var(--muted);
  display: block;
}

.checkin-info {
  flex: 1;
  min-width: 0;
}

.checkin-label {
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 2px;
}

.checkin-streak {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}

.checkin-total {
  font-size: 11px;
  color: var(--muted2);
  margin-top: 2px;
}

/* ===== 打卡部分 - 展开状态 ===== */
.checkin-expanded {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: linear-gradient(180deg, var(--panel) 0%, rgba(100, 108, 255, 0.05) 100%);
  border-radius: 16px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  padding: 0 4px;
}

.calendar-header h4 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.month-nav {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 8px;
  color: var(--muted);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.month-nav:hover {
  background: var(--brand);
  color: white;
  border-color: var(--brand);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.3);
}

.month-nav:active {
  transform: scale(0.95);
}

.calendar-month {
  font-size: 12px;
  color: var(--muted);
}

.calendar-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 4px;
  flex-shrink: 0;
  padding: 8px 0;
  background: rgba(100, 108, 255, 0.08);
  border-radius: 10px;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  flex: 1;
  padding: 4px;
}

.days-grid.two-weeks {
  grid-template-rows: repeat(2, 1fr);
}

.calendar-day {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  border-radius: 10px;
  background: rgba(30, 35, 48, 0.5);
  color: var(--text);
  min-height: 32px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
}

.calendar-day:hover:not(.empty) {
  background: rgba(100, 108, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.calendar-day.checked {
  background: linear-gradient(135deg, var(--brand) 0%, rgba(100, 108, 255, 0.8) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.4);
  animation: pulse-check 2s ease-in-out infinite;
}

@keyframes pulse-check {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(100, 108, 255, 0.4);
  }
  50% {
    box-shadow: 0 6px 20px rgba(100, 108, 255, 0.6);
  }
}

.calendar-day.checked::after {
  content: '✓';
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 8px;
  opacity: 0.8;
}

.calendar-day.today {
  border: 2px solid var(--brand);
  font-weight: 700;
  background: rgba(100, 108, 255, 0.1);
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.calendar-day.today::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 4px;
  height: 4px;
  background: var(--ok);
  border-radius: 50%;
}

.calendar-day.empty {
  background: transparent;
}

.calendar-day.other-month {
  color: var(--muted2);
  opacity: 0.4;
  background: rgba(30, 35, 48, 0.2);
}

.calendar-day.other-month.checked {
  opacity: 0.7;
  background: linear-gradient(135deg, rgba(100, 108, 255, 0.5) 0%, rgba(100, 108, 255, 0.3) 100%);
}

.calendar-day.future {
  opacity: 0.3;
  background: transparent;
  cursor: default;
}

.calendar-day.future:hover {
  transform: none;
  box-shadow: none;
  background: transparent;
}

.calendar-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 8px;
  background: rgba(100, 108, 255, 0.08);
  border-radius: 12px;
  flex-shrink: 0;
  gap: 8px;
}

.stat-item {
  text-align: center;
  flex: 1;
  padding: 8px 4px;
  background: var(--panel);
  border-radius: 10px;
  border: 1px solid var(--stroke);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  border-color: var(--brand);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.2);
}

.stat-label {
  display: block;
  font-size: 10px;
  color: var(--muted);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--text) 0%, var(--brand) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== 收缩状态：天气 + 温馨提醒 ===== */
.compact-weather-reminder {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 10px;
}

.compact-weather {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 12px;
}

.weather-icon-large {
  font-size: 32px;
  line-height: 1;
}

.weather-info-compact {
  flex: 1;
}

.weather-temp-compact {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}

.weather-desc-compact {
  font-size: 11px;
  color: var(--muted);
}

.compact-reminder {
  flex: 1;
  padding: 10px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reminder-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.reminder-icon-small {
  font-size: 14px;
}

.reminder-title-small {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}

.reminder-text-compact {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ===== 情报部分 - 收缩状态（已废弃） ===== */
.tip-compact {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  cursor: pointer;
}

.tip-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.tip-icon {
  font-size: 24px;
}

.tip-text {
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
}

.tip-nav {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
}

.tip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--stroke);
  cursor: pointer;
  transition: all 0.2s;
}

.tip-dot.active {
  width: 20px;
  background: var(--brand);
  border-radius: 3px;
}

/* ===== 情报部分 - 展开状态（左右分栏） ===== */
.middle-expanded {
  height: 100%;
  display: flex;
  gap: 12px;
  padding: 16px;
}

.tip-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.tip-section h4,
.weather-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.tip-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text);
}

.tip-badge {
  width: 20px;
  height: 20px;
  background: var(--panel2);
  color: var(--brand);
  border: 1px solid var(--stroke);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

/* 天气和提醒区域 */
.weather-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.weather-card {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
}

.weather-icon {
  font-size: 40px;
}

.weather-temp {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.weather-desc {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.reminder-card {
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
}

.reminder-icon {
  font-size: 24px;
}

.reminder-content {
  flex: 1;
}

.reminder-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.reminder-text {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.4;
}

.motivation-card {
  background: var(--panel2);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.motivation-text {
  font-size: 13px;
  color: var(--muted);
  font-style: italic;
  line-height: 1.5;
}

/* ===== 个人部分 - 收缩状态 ===== */
.profile-compact {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.icon-button {
  width: 44px;
  height: 44px;
  border: 1px solid var(--stroke);
  background: var(--panel);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s;
}

.icon-button:hover {
  background: var(--panel2);
  color: var(--brand);
  transform: translateY(-2px);
}

/* ===== 个人部分 - 展开状态 ===== */
.profile-expanded {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-card:hover {
  background: var(--panel2);
  transform: translateY(-2px);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-stats {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--muted2);
}

.settings-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--stroke);
  background: var(--panel);
  border-radius: 10px;
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
}

.menu-item:hover {
  background: var(--panel2);
  color: var(--brand);
  transform: translateX(4px);
}

.menu-item.logout-btn {
  color: var(--bad);
}

.menu-item.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--bad);
}

/* ===== 详情视图 ===== */
.detail-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
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

/* 个人中心详情 */
.profile-detail,
.settings-detail {
  flex: 1;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 16px;
}

.detail-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--stroke);
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  margin: 0 0 12px;
}

.detail-section.danger-zone {
  background: rgba(239, 68, 68, 0.1);
  padding: 16px;
  border-radius: 12px;
  border-bottom: none;
}

/* 头像区域 */
.profile-avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.avatar-actions {
  display: flex;
  gap: 8px;
}

.btn.small {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 8px;
}

/* 表单组 */
.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 4px;
}

.input {
  width: 100%;
  padding: 10px 12px;
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
  gap: 10px;
  margin-top: 12px;
}

.btn {
  padding: 10px 20px;
  border: 1px solid var(--stroke);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn.primary {
  background: var(--brand);
  border-color: var(--brand);
  color: white;
}

.btn.primary:hover {
  filter: brightness(1.1);
}

.btn.danger {
  background: var(--bad);
  border-color: var(--bad);
  color: white;
}

.btn.danger:hover {
  filter: brightness(1.1);
}

/* 设置项 */
.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  cursor: pointer;
}

.setting-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--brand);
}

.about-text {
  font-size: 13px;
  color: var(--text);
  margin: 4px 0;
}

.about-text.muted {
  color: var(--muted);
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
  padding: 20px;
}

.modal-content {
  background: var(--panel);
  border: 1px solid var(--stroke);
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
  border-bottom: 1px solid var(--stroke);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.warning-icon {
  color: var(--bad);
}

.modal-body {
  padding: 20px 24px;
}

.modal-body p {
  margin: 0;
  color: var(--muted);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--stroke);
}

.btn.secondary {
  background: var(--panel2);
  border-color: var(--stroke);
  color: var(--muted);
}

.btn.secondary:hover {
  background: var(--panel);
  color: var(--text);
}

.btn.danger {
  background: var(--bad);
  border-color: var(--bad);
  color: white;
}

.btn.danger:hover {
  filter: brightness(1.1);
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

/* 列表视图和详情视图的容器 */
.list-view,
.detail-view {
  height: 100%;
  overflow-y: auto;
}

/* 确保内容可滚动 */
.list-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 响应式 */
@media (max-width: 768px) {
  .right-column {
    border-radius: 16px;
  }
  
  .middle-expanded {
    flex-direction: column;
  }
}
</style>