<template>
  <div>
    <Topbar
      title="设置"
      subtitle="主题/偏好/快捷键/关于等（示例）。"
    />

    <div class="container">
      <div class="grid2">
        <div class="card" style="padding:12px 14px;">
          <div style="font-weight:950;">偏好设置（示例）</div>
          <div class="muted2" style="font-size:12px; margin-top:4px;">仅保存在本地</div>

          <label class="row gap10 center" style="margin-top:12px;">
            <input type="checkbox" v-model="pref.autoSeed" />
            <span>自动生成示例面试记录</span>
          </label>

          <label class="row gap10 center" style="margin-top:10px;">
            <input type="checkbox" v-model="pref.showTips" />
            <span>显示引导提示</span>
          </label>

          <div class="row gap10 wrap" style="margin-top:12px;">
            <button class="btn primary" @click="save">保存</button>
            <button class="btn" @click="reset">恢复默认</button>
          </div>

          <div class="muted2" style="margin-top:10px;" v-if="msg">{{ msg }}</div>
        </div>

        <div class="card" style="padding:12px 14px;">
          <div style="font-weight:950;">关于</div>
          <div class="muted2" style="font-size:12px; margin-top:4px;">AI 面试官 UI 壳子</div>

          <div class="muted" style="margin-top:10px;">
            页面包含：登录/注册、工作台、面试、记录、统计、题库、个人中心、设置。
            后端接入时，把 localStorage 替换成真实 API 即可。
          </div>

          <div class="card soft" style="margin-top:14px; padding:12px 14px;">
            <div class="muted2 mono">localStorage key: ai_prefs</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import Topbar from '../components/ui/Topbar.vue'
import { lsGet, lsSet } from '../lib/storage'

const KEY = 'ai_prefs'
const pref = ref(lsGet(KEY, { autoSeed: true, showTips: true }))
const msg = ref('')

function save(){
  lsSet(KEY, pref.value)
  msg.value = '已保存'
  setTimeout(()=>msg.value='', 1800)
}

function reset(){
  pref.value = { autoSeed: true, showTips: true }
  save()
}
</script>
