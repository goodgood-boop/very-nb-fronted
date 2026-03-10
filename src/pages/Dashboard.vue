<template>
  <div class="dashboard-container">
    <Topbar
      title="工作台"
      subtitle="快速入口 + 最近表现概览（UI-only，本地 mock 数据）。"
    >
      <RouterLink class="btn primary" to="/app/interview">开始面试</RouterLink>
    </Topbar>

    <div class="container">
      <!--
        这里把原来的 2 列改成 3 列（更像真实产品的“工作台/仪表盘”）
        - 保持原有数据含义不变
        - 只调整布局并新增“打卡”卡片
      -->
      <div class="grid3">
        <StatCard label="最近一次评分" :value="lastScore" :badge="lastTypeLabel" hint="来自最近一次面试记录" />
        <StatCard label="近 7 次平均分" :value="avg7" badge="趋势参考" hint="你可以用它观察阶段性进步" />

        <!-- 新增：打卡卡片（快速入口 + 连续天数） -->
        <StatCard
          label="连续打卡"
          :value="streak"
          :badge="canToday ? '待打卡' : '已完成'"
          hint="每天一次，连续天数可解锁头像挂件/勋章"
        >
          <div class="row gap10" style="margin-top:10px;">
            <RouterLink class="btn primary" to="/app/checkin" style="flex:1; text-align:center;">
              {{ canToday ? '去打卡' : '查看奖励' }}
            </RouterLink>
          </div>
        </StatCard>
      </div>

      <div class="grid2" style="margin-top:14px;">
        <div class="card" style="padding:12px 14px;">
          <div class="row space center">
            <div>
              <div style="font-weight:950;">快捷功能</div>
              <div class="muted2" style="font-size:12px; margin-top:4px;">建议先体验“开始面试”</div>
            </div>
          </div>

          <div class="row gap10 wrap" style="margin-top:12px;">
            <RouterLink class="btn" to="/app/records">查看面试记录</RouterLink>
            <RouterLink class="btn" to="/app/analytics">查看面试统计</RouterLink>
            <RouterLink class="btn" to="/app/bank">题库练习</RouterLink>
            <RouterLink class="btn" to="/app/checkin">打卡中心</RouterLink>
            <RouterLink class="btn" to="/app/profile">个人中心</RouterLink>
          </div>

          <div class="card soft" style="margin-top:14px; padding:12px 14px;">
            <div class="muted2">建议你们后端接入时做这些接口：</div>
            <div class="muted" style="margin-top:8px;">
              <span class="mono">/auth/login</span> · <span class="mono">/interview/start</span> ·
              <span class="mono">/interview/submit</span> · <span class="mono">/records</span> · <span class="mono">/analytics</span>
            </div>
          </div>
        </div>

        <div class="card" style="overflow:hidden;">
          <div style="padding:12px 14px; border-bottom:1px solid var(--stroke);">
            <div style="font-weight:950;">最近记录</div>
            <div class="muted2" style="font-size:12px; margin-top:4px;">点击可进入“面试记录”查看详情</div>
          </div>
          <div style="padding:12px 14px 14px;">
            <div class="list">
              <div v-for="r in recent" :key="r.id" class="item">
                <div class="row space center">
                  <div style="font-weight:900;">{{ r.title }}</div>
                  <div class="badge">总分 {{ r.overall }}</div>
                </div>
                <div class="muted2" style="font-size:12px; margin-top:6px;">
                  {{ fmt(r.startedAt) }} · {{ labelType(r.type) }}
                </div>
                <div class="muted" style="font-size:12px; margin-top:6px;">
                  {{ r.notes }}
                </div>
              </div>

              <div v-if="recent.length===0" class="muted">暂无记录（会自动生成示例数据）</div>
            </div>

            <div class="row gap10" style="margin-top:12px;">
              <button class="btn" @click="seed">生成示例数据</button>
              <RouterLink class="btn primary" to="/app/records">去查看全部</RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  /* Matching the WindmillHome background style */
  background: linear-gradient(to bottom, #E0F7FA 0%, #f5f7ff 100%); 
}

/* Override cards to match the lighter theme */
:deep(.card) {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  color: #333;
}

:deep(.muted) {
  color: #666;
}

:deep(.muted2) {
  color: #888;
}

:deep(.btn) {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: 1px solid #ddd;
}

:deep(.btn:hover) {
  background: #fff;
  border-color: #bbb;
}

:deep(.btn.primary) {
  background: #4caf50; /* Greenish to match nature theme */
  color: white;
  border: none;
}

:deep(.btn.primary:hover) {
  background: #43a047;
}

:deep(.badge) {
  background: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
  border: 1px solid rgba(76, 175, 80, 0.2);
}
</style>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import dayjs from 'dayjs'
import Topbar from '../components/ui/Topbar.vue'
import StatCard from '../components/ui/StatCard.vue'
import { getRecords, seedRecordsIfEmpty, labelType } from '../lib/records'
import { currentUser } from '../lib/auth'
import { canCheckIn, getCheckinState } from '../lib/checkin'

const records = computed(() => getRecords())
const recent = computed(() => records.value.slice(0, 3))

const lastScore = computed(() => records.value[0]?.overall ?? '--')
const lastTypeLabel = computed(() => records.value[0] ? labelType(records.value[0].type) : '暂无')
const avg7 = computed(() => {
  const xs = records.value.slice(0,7)
  if (!xs.length) return '--'
  const v = xs.reduce((s,r)=>s+r.overall,0)/xs.length
  return Math.round(v)
})

// ======= 打卡状态（在工作台展示一个小入口） =======
const me = computed(() => currentUser())
const streak = ref(0)
const canToday = ref(true)

function refreshCheckin() {
  const email = me.value?.email
  if (!email) return
  const s = getCheckinState(email)
  streak.value = Number(s?.streak || 0)
  canToday.value = canCheckIn(email)
}

function fmt(ts){
  return dayjs(ts).format('YYYY-MM-DD HH:mm')
}

function seed(){
  seedRecordsIfEmpty()
}

onMounted(() => seedRecordsIfEmpty())

function onCheckinUpdated(ev){
  const email = ev?.detail?.email
  if (email && email === me.value?.email) refreshCheckin()
}

onMounted(() => {
  refreshCheckin()
  window.addEventListener('ai-checkin-updated', onCheckinUpdated)
})

onBeforeUnmount(() => {
  window.removeEventListener('ai-checkin-updated', onCheckinUpdated)
})
</script>
