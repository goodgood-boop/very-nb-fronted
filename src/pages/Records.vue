<template>
  <div>
    <Topbar
      title="面试记录"
      subtitle="浏览历史面试，查看对话与维度评分（示例数据）。"
    >
      <button class="btn" @click="seed">生成示例数据</button>
    </Topbar>

    <div class="container">
      <div class="card" style="overflow:hidden;">
        <div style="padding:12px 14px; border-bottom:1px solid var(--stroke);">
          <div class="row space center">
            <div class="muted2">共 {{ list.length }} 条</div>
            <div class="row gap10 center">
              <select class="select" v-model="filter">
                <option value="all">全部方向</option>
                <option value="frontend">前端</option>
                <option value="backend">后端</option>
                <option value="algo">算法</option>
                <option value="pm">产品</option>
              </select>
              <input class="input" style="width:260px;" v-model.trim="q" placeholder="搜索标题/备注…" />
            </div>
          </div>
        </div>

        <div style="padding:12px 14px 14px;">
          <div class="list">
            <div v-for="r in filtered" :key="r.id" class="item" style="cursor:pointer;" @click="open(r)">
              <div class="row space center">
                <div style="font-weight:950;">{{ r.title }}</div>
                <div class="badge">总分 {{ r.overall }}</div>
              </div>
              <div class="row space center" style="margin-top:6px;">
                <div class="muted2" style="font-size:12px;">
                  {{ fmt(r.startedAt) }} · {{ labelType(r.type) }}
                </div>
                <div class="muted2" style="font-size:12px;">{{ dur(r) }}</div>
              </div>
              <div class="muted" style="font-size:12px; margin-top:8px;">{{ r.notes }}</div>
            </div>

            <div v-if="filtered.length===0" class="muted">没有匹配的记录</div>
          </div>
        </div>
      </div>
    </div>

    <Modal :open="!!selected" title="面试详情" :subtitle="selected ? selected.title : ''" @close="selected=null">
      <div v-if="selected">
        <div class="grid2">
          <div class="card soft" style="padding:12px 14px;">
            <div class="muted2" style="font-size:12px;">总体</div>
            <div style="font-size:22px; font-weight:950; margin-top:6px;">{{ selected.overall }}</div>
            <div class="muted" style="font-size:12px; margin-top:8px;">{{ fmt(selected.startedAt) }}</div>
          </div>

          <div class="card soft" style="padding:12px 14px;">
            <div class="muted2" style="font-size:12px;">维度评分</div>
            <div class="list" style="margin-top:10px;">
              <div v-for="d in selected.dimensions" :key="d.k" class="kv">
                <div class="k">{{ d.k }}</div>
                <div class="v">{{ d.v }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card soft" style="margin-top:14px; padding:12px 14px;">
          <div class="muted2" style="font-size:12px;">对话摘录</div>
          <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
            <div v-for="(m,i) in selected.transcript" :key="i"
                 class="item"
                 :style="m.role==='candidate' ? 'margin-left:auto; max-width:80%;' : 'max-width:80%;'">
              <div class="muted2" style="font-size:12px;">{{ m.role==='candidate' ? '你' : '面试官' }}</div>
              <div style="margin-top:6px; font-weight:800; line-height:1.45;">{{ m.text }}</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import Topbar from '../components/ui/Topbar.vue'
import Modal from '../components/ui/Modal.vue'
import { getRecords, seedRecordsIfEmpty, labelType } from '../lib/records'

const filter = ref('all')
const q = ref('')
const selected = ref(null)

const list = computed(() => getRecords())

const filtered = computed(() => {
  const qq = q.value.toLowerCase()
  return list.value.filter(r => {
    if (filter.value !== 'all' && r.type !== filter.value) return false
    const hay = `${r.title} ${r.notes}`.toLowerCase()
    if (qq && !hay.includes(qq)) return false
    return true
  })
})

function fmt(ts){ return dayjs(ts).format('YYYY-MM-DD HH:mm') }
function dur(r){
  const m = Math.max(1, Math.round(((r.endedAt||r.startedAt)-r.startedAt)/60000))
  return `${m} 分钟`
}
function seed(){ seedRecordsIfEmpty() }
function open(r){ selected.value = r }
</script>
