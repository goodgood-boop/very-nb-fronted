<template>
  <div class="page-with-bg">
    <Topbar
      title="面试统计"
      subtitle="用可视化观察分数走势与能力画像（来自本地记录）。"
    />

    <div class="container page-content">
      <div class="grid2">
        <div class="card" style="padding:12px 14px;">
          <div class="row space center">
            <div>
              <div style="font-weight:950;">总分走势</div>
              <div class="muted2" style="font-size:12px; margin-top:4px;">折线：原始分数；平滑线：3 次滑动平均</div>
            </div>
            <button class="btn btn-glow" @click="seed">生成示例数据</button>
          </div>
          <div style="margin-top:12px;">
            <LineChart :labels="labels" :data="scores" title="Score" />
          </div>
          <div style="margin-top:14px;">
            <LineChart :labels="labels" :data="trend" title="Trend" />
          </div>
        </div>

        <div class="card" style="padding:12px 14px;">
          <div style="font-weight:950;">能力维度平均分</div>
          <div class="muted2" style="font-size:12px; margin-top:4px;">柱状图：各能力维度平均分（越高越好）</div>
          <div style="margin-top:12px;">
            <BarChart :labels="dimLabels" :data="dimValues" title="Average" />
          </div>

          <div class="card soft" style="margin-top:14px; padding:12px 14px;">
            <div class="muted2" style="font-size:12px;">解读建议</div>
            <div class="muted" style="margin-top:8px; font-size:12px;">
              如果“结构化思维”偏低：回答时用 <span class="mono">STAR</span> 或 <span class="mono">PREP</span>；<br/>
              如果“技术深度”偏低：准备 2 个项目的关键设计权衡与指标。
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:14px; padding:12px 14px;" v-if="last">
        <div class="row space center">
          <div>
            <div style="font-weight:950;">最近一次能力画像</div>
            <div class="muted2" style="font-size:12px; margin-top:4px;">雷达图：最近一次的各维度分数</div>
          </div>
          <div class="badge">{{ last.title }} · 总分 {{ last.overall }}</div>
        </div>
        <div style="margin-top:12px;">
          <RadarChart :labels="lastDimLabels" :data="lastDimValues" title="Last Interview" />
        </div>
      </div>

      <div class="card soft" style="margin-top:14px; padding:12px 14px;" v-if="!labels.length">
        <div class="muted">暂无记录。请先生成示例数据或完成一次面试。</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import Topbar from '../components/ui/Topbar.vue'
import LineChart from '../components/charts/LineChart.vue'
import BarChart from '../components/charts/BarChart.vue'
import RadarChart from '../components/charts/RadarChart.vue'
import { seedRecordsIfEmpty } from '../lib/records'
import { buildAnalytics } from '../lib/analytics'

const a = computed(() => buildAnalytics())

const labels = computed(() => a.value.points.map(p=>p.x))
const scores = computed(() => a.value.points.map(p=>p.y))
const trend = computed(() => a.value.trend.map(p=>p.y))

const dimLabels = computed(() => a.value.dimAvg.map(d=>d.k))
const dimValues = computed(() => a.value.dimAvg.map(d=>d.v))

const last = computed(() => a.value.last)
const lastDimLabels = computed(() => last.value?.dimensions?.map(d=>d.k) || [])
const lastDimValues = computed(() => last.value?.dimensions?.map(d=>d.v) || [])

function seed(){ seedRecordsIfEmpty() }

onMounted(() => {
  document.querySelectorAll('.btn-glow').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      btn.style.setProperty('--mouse-x', `${x}px`)
      btn.style.setProperty('--mouse-y', `${y}px`)
    })
  })
})
</script>
