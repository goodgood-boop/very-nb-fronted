<template>
  <div class="bottom-bar">
    <!-- 左侧：面试时间轴 -->
    <div class="bottom-left">
      <div class="timeline">
        <div class="timeline-items">
          <div 
            v-for="(item, index) in timelineItems" 
            :key="item.id"
            class="timeline-item"
            :class="{ active: item.active }"
          >
            <span class="timeline-dot" :class="{ pulse: item.active }"></span>
            <span class="timeline-text">{{ item.text }}</span>
            <span v-if="item.countdown" class="timeline-countdown">{{ item.countdown }}</span>
          </div>
        </div>
        
        <div v-if="timelineItems.length === 0" class="timeline-placeholder">
          <span>暂无 upcoming 面试</span>
        </div>
      </div>
    </div>

    <!-- 右侧：最简单的时间显示 -->
    <div class="bottom-right">
      <div class="current-time">{{ currentTime }}</div>
      <div class="weather">☀️ 18°</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getRecords } from '../../lib/records'

// ===== 最简单的时间显示 =====
const currentTime = ref('')
let timeTimer = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// ===== 面试时间轴 =====
const timelineItems = ref([])

const updateTimeline = () => {
  const records = getRecords()
  const now = new Date()
  const items = []
  
  if (records.length > 0) {
    records.slice(0, 3).forEach((record, index) => {
      const futureDate = new Date(now)
      futureDate.setDate(now.getDate() + index + 1)
      futureDate.setHours(10 + index * 2, 0, 0)
      
      const timeStr = futureDate.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
      
      items.push({
        id: `future-${record.id}`,
        text: `${timeStr} ${record.title?.replace('面试', '') || '面试'}`,
        active: index === 0,
        countdown: index === 0 ? getCountdown(futureDate) : null
      })
    })
  } else {
    items.push(
      {
        id: 'example-1',
        text: '今天 14:00 字节跳动',
        active: true,
        countdown: '2h'
      },
      {
        id: 'example-2',
        text: '明天 10:00 腾讯',
        active: false
      },
      {
        id: 'example-3',
        text: '后天 15:00 阿里',
        active: false
      }
    )
  }
  
  timelineItems.value = items
}

const getCountdown = (futureDate) => {
  const now = new Date()
  const diffMs = futureDate - now
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
  
  if (diffHrs < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60))
    return `${diffMins}分钟`
  } else if (diffHrs < 24) {
    return `${diffHrs}小时`
  } else {
    const diffDays = Math.floor(diffHrs / 24)
    return `${diffDays}天`
  }
}

let timelineTimer = null

// ===== 生命周期 =====
onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
  
  updateTimeline()
  timelineTimer = setInterval(updateTimeline, 5 * 60 * 1000)
})

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer)
  if (timelineTimer) clearInterval(timelineTimer)
})
</script>

<style scoped>
.bottom-bar {
  height: 48px;
  background: var(--panel);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid var(--stroke);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  font-size: 13px;
  color: var(--text);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

/* 左侧时间轴 */
.bottom-left {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.timeline-items {
  display: flex;
  align-items: center;
  gap: 24px;
  overflow-x: auto;
  padding: 4px 0;
  scrollbar-width: none;
}

.timeline-items::-webkit-scrollbar {
  display: none;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  white-space: nowrap;
}

.timeline-item.active {
  color: var(--brand);
  font-weight: 500;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--muted2);
}

.timeline-item.active .timeline-dot {
  background: var(--brand);
}

.timeline-dot.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.timeline-countdown {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--panel2);
  color: var(--brand);
  border-radius: 12px;
  margin-left: 4px;
}

.timeline-placeholder {
  color: var(--muted2);
  font-style: italic;
  padding: 4px 0;
}

/* 右侧 - 最简单的时间显示 */
.bottom-right {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-left: 24px;
  padding-left: 24px;
  border-left: 1px solid var(--stroke);
}

.current-time {
  font-family: monospace;
  background: var(--panel2);
  padding: 4px 12px;
  border-radius: 20px;
  color: var(--text);
}

.weather {
  color: var(--muted);
}

/* 响应式 */
@media (max-width: 768px) {
  .bottom-bar {
    padding: 0 16px;
  }
  
  .timeline-items {
    gap: 16px;
  }
  
  .timeline-text {
    font-size: 12px;
  }
  
  .timeline-countdown {
    display: none;
  }
  
  .bottom-right {
    gap: 12px;
    margin-left: 12px;
    padding-left: 12px;
  }
}

@media (max-width: 480px) {
  .timeline-text {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .current-time {
    display: none;  /* 小屏幕隐藏时间 */
  }
}
</style>