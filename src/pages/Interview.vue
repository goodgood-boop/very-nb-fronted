<template>
  <div>
    <!--
      顶部栏：保持"开始面试"入口不变，但内容根据当前 stage（步骤）动态变化。
      stage = setup | loading | room | report
    -->
    <Topbar v-if="stage!=='room'"
      title="开始面试"
      :subtitle="topSubtitle"
    >
      <span
        class="badge"
        :style="serverOk ? 'border-color:rgba(54,211,153,.25);' : 'border-color:rgba(255,198,88,.25);'"
      >
        {{ serverOk ? '后端已连接' : '未连接（UI Demo）' }}
      </span>
    </Topbar>

    <div class="container">
      <!-- =====================================================
        1) SETUP：面试配置页
        - 你要求：进入"面试"后，先让用户选择难度、类型、人声、字幕、等设置
        - 注意：这里是 UI Shell，所以不会真的开始语音识别/评分；但交互流程完整。
      ====================================================== -->
      <div v-if="stage==='setup'" class="grid2" style="grid-template-columns: 1.2fr 0.8fr;">
        <div class="card" style="overflow:hidden;">
          <div style="padding:16px 16px 10px; border-bottom:1px solid var(--stroke);">
            <div style="font-weight:950; font-size:16px;">面试配置</div>
            <div class="muted" style="margin-top:6px; font-size:12px;">
              选择你的面试参数。点击「开始」后会进入一个动态加载页，再进入真实面试界面。
            </div>
          </div>

          <div style="padding:16px;">
            <!-- 这个布局是"Bento"风格：更像产品而不是 demo -->
            <div class="bento">
              <div class="bento-card">
                <div class="muted2" style="font-size:12px;">面试难度</div>
                <div style="margin-top:10px;" class="seg">
                  <button class="seg-btn" :class="cfg.difficulty==='easy'?'on':''" @click="cfg.difficulty='easy'">简单</button>
                  <button class="seg-btn" :class="cfg.difficulty==='normal'?'on':''" @click="cfg.difficulty='normal'">标准</button>
                  <button class="seg-btn" :class="cfg.difficulty==='hard'?'on':''" @click="cfg.difficulty='hard'">高压</button>
                </div>
                <div class="muted" style="margin-top:10px; font-size:12px;">
                  影响题目数量、思考/回答时间、报告评价力度（UI 侧模拟）。
                </div>
              </div>

              <div class="bento-card">
                <div class="muted2" style="font-size:12px;">面试类型</div>
                <select class="select" v-model="cfg.type" style="margin-top:10px; width:100%;">
                  <option value="frontend">前端</option>
                  <option value="backend">后端</option>
                  <option value="algo">算法</option>
                  <option value="pm">产品</option>
                </select>
                <div class="muted" style="margin-top:10px; font-size:12px;">题库来源：本地 mockQuestions（后续可换成后端题库）。</div>
              </div>

              <div class="bento-card">
                <div class="row space center">
                  <div>
                    <div class="muted2" style="font-size:12px;">字幕显示</div>
                    <div style="font-weight:950; margin-top:6px;">在面试中显示面试官问题</div>
                  </div>
                  <label class="switch">
                    <input type="checkbox" v-model="cfg.showSubtitles" />
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="muted" style="margin-top:10px; font-size:12px;">
                  开启后：问题会固定显示在左侧，同时显示思考倒计时。
                </div>
              </div>

              <div class="bento-card">
                <div class="muted2" style="font-size:12px;">思考时间</div>
                <div class="row gap10 wrap" style="margin-top:10px;">
                  <button class="pill" :class="cfg.thinkSeconds===10?'on':''" @click="cfg.thinkSeconds=10">10s</button>
                  <button class="pill" :class="cfg.thinkSeconds===20?'on':''" @click="cfg.thinkSeconds=20">20s</button>
                  <button class="pill" :class="cfg.thinkSeconds===30?'on':''" @click="cfg.thinkSeconds=30">30s</button>
                  <button class="pill" :class="cfg.thinkSeconds===45?'on':''" @click="cfg.thinkSeconds=45">45s</button>
                </div>
                <div class="muted" style="margin-top:10px; font-size:12px;">时间到会自动开始"回答阶段"。</div>
              </div>

              <div class="bento-card">
                <div class="muted2" style="font-size:12px;">人声（TTS）</div>
                <select class="select" v-model="cfg.voice" style="margin-top:10px; width:100%;">
                  <option value="zh-CN-XiaoxiaoNeural">中文女声 Xiaoxiao</option>
                  <option value="zh-CN-YunxiNeural">中文男声 Yunxi</option>
                  <option value="zh-CN-XiaoyiNeural">中文女声 Xiaoyi</option>
                </select>
                <div style="margin-top:10px;">
                  <div class="muted2" style="font-size:12px;">语速：{{ cfg.rate }}</div>
                  <input type="range" min="-20" max="20" step="5" v-model.number="ttsRateNum" style="width:100%;" />
                </div>
              </div>

              <div class="bento-card">
                <div class="row space center">
                  <div>
                    <div class="muted2" style="font-size:12px;">Live2D 位置</div>
                    <div style="font-weight:950; margin-top:6px;">{{ cfg.avatarPos==='left'?'左侧':cfg.avatarPos==='right'?'右侧':'浮窗' }}</div>
                  </div>
                  <div class="seg">
                    <button class="seg-btn" :class="cfg.avatarPos==='left'?'on':''" @click="cfg.avatarPos='left'">左</button>
                    <button class="seg-btn" :class="cfg.avatarPos==='float'?'on':''" @click="cfg.avatarPos='float'">浮</button>
                    <button class="seg-btn" :class="cfg.avatarPos==='right'?'on':''" @click="cfg.avatarPos='right'">右</button>
                  </div>
                </div>
                <div class="muted" style="margin-top:10px; font-size:12px;">
                  浮窗可拖拽；若 Live2D 不张嘴，优先检查「动作是否覆盖嘴巴参数」与「音频是否已解锁」。
                </div>
              </div>
            </div>

            <div class="row gap10" style="margin-top:14px;">
              <button class="btn ghost" @click="checkServer">检测后端</button>
              <button class="btn" @click="unlock">解锁音频</button>
              <div style="flex:1;"></div>
              <button class="btn primary" @click="startWithLoading">开始面试</button>
            </div>
          </div>
        </div>

        <!-- 右侧：预览/提示 -->
        <div class="card" style="overflow:hidden;">
          <div style="padding:16px 16px 10px; border-bottom:1px solid var(--stroke);">
            <div style="font-weight:950; font-size:16px;">预览与提示</div>
            <div class="muted" style="margin-top:6px; font-size:12px;">面试流程预览</div>
          </div>
          <div style="padding:16px;">
            <div style="background:var(--card-2); border:1px solid var(--stroke); border-radius:12px; padding:14px;">
              <div style="font-weight:950; margin-bottom:8px;">面试流程</div>
              <div class="muted" style="font-size:12px; line-height:1.7;">
                1. 配置面试参数<br/>
                2. 进入加载页，创建面试会话<br/>
                3. 面试官播报问题（TTS）<br/>
                4. 思考倒计时<br/>
                5. 语音/文本回答<br/>
                6. 追问问题（每个主问题2个追问）<br/>
                7. 所有问题完成后生成报告
              </div>
            </div>
            <div class="muted" style="margin-top:12px; font-size:12px;">
              提示：首次使用建议先「检测后端」确保服务可用。
            </div>
          </div>
        </div>
      </div>

      <!-- =====================================================
        2) LOADING：简洁大气的加载界面
      ====================================================== -->
      <div v-else-if="stage==='loading'" class="loading-screen">
        <div class="loading-content">
          <!-- 中央加载动画 -->
          <div class="loading-center">
            <div class="loading-ring">
              <div class="ring-ring"></div>
              <div class="ring-ring"></div>
              <div class="ring-ring"></div>
            </div>
            <div class="loading-text">{{ loadingText }}</div>
          </div>
          
          <!-- 底部进度信息 -->
          <div class="loading-footer">
            <div class="loading-meta">
              <span class="meta-item">{{ labelType(cfg.type) }}</span>
              <span class="meta-dot">·</span>
              <span class="meta-item">{{ labelDifficulty(cfg.difficulty) }}</span>
              <span class="meta-dot">·</span>
              <span class="meta-item">{{ questionCount }}题</span>
            </div>
            <div class="loading-progress">
              <div class="progress-track">
                <div class="progress-fill" :style="`width:${loadingProgress}%`"></div>
              </div>
              <span class="progress-text">{{ loadingProgress }}%</span>
            </div>
          </div>
        </div>
        
        <!-- 取消按钮 -->
        <button class="loading-cancel" @click="cancelLoading">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>

      <!-- =====================================================
        3) ROOM：真实面试界面
        - 左：字幕/问题/思考倒计时（可关闭）
        - 中/右：你的回答区域（语音壳子 + 手写板 + 文本）
        - Live2D：左/右/浮窗，可在设置里切换。
        - 支持暂停并打开设置。
      ====================================================== -->
      <div v-else-if="stage==='room'" class="room-min-wrap">
        <div class="room-min">
          <!-- 右上角：暂停/设置（极简） -->
          <div class="room-corner">
            <button class="icon-btn" @click="togglePause" :title="paused ? '继续' : '暂停'">
              {{ paused ? '▶' : '⏸' }}
            </button>
            <button class="icon-btn" @click="openSettings=true" title="设置">⚙</button>
          </div>

          <!-- 三列：左问题 / 中Live2D / 右回答 -->
          <div class="room-cols">
            <div class="room-col">
              <div class="col-title">问题</div>
              <transition-group name="qmsg" tag="div" class="chat-stack">
                <div v-for="m in qMsgs" :key="m.id" class="qbubble">
                  <div class="chat-bubble q">{{ m.text }}</div>
                </div>
              </transition-group>
            </div>

            <div class="room-center">
              <div class="live2d-stage" :class="speaking ? 'speaking' : ''">
                <Live2DAvatar ref="avatar" @subtitle="subtitle=$event" @speaking="speaking=$event" />
              </div>
            </div>

            <div class="room-col right">
              <div class="col-title" style="text-align:right;">回答</div>
              <div class="chat-stack right">
                <div v-for="m in aMsgs" :key="m.id" class="abubble">
                  <div class="chat-bubble a">{{ m.text }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 手动输入：底部像 QQ 聊天一样简洁 -->
          <div v-if="inputMode==='text'" class="qq-input">
            <textarea
              v-model="draft"
              class="qq-text"
              rows="1"
              :disabled="!canAnswer"
              placeholder="像聊天一样输入你的回答…（Enter 发送，Shift+Enter 换行）"
              @keydown.enter.exact.prevent="commitText"
            ></textarea>
            <button class="qq-send" :disabled="!canAnswer" @click="commitText">发送</button>
          </div>

          <!-- 语音输入：不显示具体内容，回答结束后右侧只显示"已回答完毕，时长…" -->
          <button
            v-else
            class="voice-fab"
            :class="listening ? 'on' : ''"
            :disabled="!canAnswer"
            @click="toggleVoice"
            :title="listening ? '结束并提交' : '开始语音回答'"
          >
            {{ listening ? '✓' : '🎙' }}
          </button>
        </div>

        <!-- 浮窗 Live2D -->
        <div
          v-if="cfg.avatarPos==='float'"
          class="live2d-float"
          :style="`left:${floatPos.x}px; top:${floatPos.y}px;`"
          @mousedown="startFloatDrag"
        >
          <Live2DAvatar ref="avatarFloat" @subtitle="subtitle=$event" @speaking="speaking=$event" />
        </div>
      </div>

      <!-- =====================================================
        4) REPORT：面试报告页
        - 可视化：雷达图 + 柱状图
        - 建议 + 缺点
        - 返回首页 / 再来一次
      ====================================================== -->
      <div v-else-if="stage==='report'" class="report-wrap">
        <div class="report-header">
          <div style="font-weight:950; font-size:20px;">面试报告</div>
          <div class="muted" style="margin-top:6px; font-size:12px;">
            {{ labelType(cfg.type) }} · {{ labelDifficulty(cfg.difficulty) }} · {{ fmtTime(reportMeta.usedSec) }}
          </div>
        </div>

        <div class="report-grid">
          <!-- 左侧：综合评分 -->
          <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px;">
            <div class="score-ring" :style="`--score:${report.overall};`">
              <div class="score-inner">
                <div class="score-num">{{ report.overall }}</div>
                <div class="score-label">综合评分</div>
              </div>
            </div>
            <div style="margin-top:14px; font-weight:950;">{{ report.summary }}</div>
          </div>

          <!-- 中间：雷达图 -->
          <div class="card" style="padding:16px;">
            <div class="muted2" style="font-size:12px;">能力画像</div>
            <div style="margin-top:10px; height:220px;">
              <RadarChart
                :labels="report.dimLabels"
                :data="report.dimData"
              />
            </div>
          </div>

          <!-- 右侧：建议与缺点 -->
          <div class="card" style="padding:16px;">
            <div class="muted2" style="font-size:12px;">建议</div>
            <div style="margin-top:10px; line-height:1.6;">
              {{ report.summary }}
            </div>
            <div class="muted2" style="margin-top:14px; font-size:12px;">待改进</div>
            <ul style="margin-top:8px; padding-left:18px; line-height:1.7;">
              <li v-for="(w, i) in report.weakness" :key="i">{{ w }}</li>
            </ul>
          </div>

          <!-- 底部：每题得分 -->
          <div class="card" style="grid-column:1 / -1; padding:16px;">
            <div class="muted2" style="font-size:12px;">每题得分</div>
            <div style="margin-top:10px; height:160px;">
              <BarChart
                :labels="report.qLabels"
                :data="report.qScores"
              />
            </div>
          </div>
        </div>

        <div class="row gap10" style="margin-top:14px;">
          <button class="btn ghost" @click="goHome">返回首页</button>
          <div style="flex:1;"></div>
          <button class="btn" @click="restart">再来一次</button>
          <button class="btn primary" @click="goRecords">查看历史</button>
        </div>
      </div>
    </div>

    <!-- 设置弹窗：点设置才出现，出现即暂停 -->
    <Modal
      :open="openSettings"
      title="设置"
      subtitle="修改设置会自动暂停面试。"
      @close="openSettings=false"
    >
      <div class="card soft" style="padding:12px 14px;">
        <div class="row space center">
          <div>
            <div class="muted2" style="font-size:12px;">输入方式</div>
            <div style="font-weight:950; margin-top:6px;">{{ inputMode==='text' ? '手动输入' : '语音输入' }}</div>
          </div>
          <div class="seg">
            <button class="seg-btn" :class="inputMode==='voice'?'on':''" @click="inputMode='voice'">语音</button>
            <button class="seg-btn" :class="inputMode==='text'?'on':''" @click="inputMode='text'">手动</button>
          </div>
        </div>

        <div class="row space center" style="margin-top:12px;">
          <div>
            <div class="muted2" style="font-size:12px;">思考时间</div>
            <div style="font-weight:950; margin-top:6px;">{{ cfg.thinkSeconds }} 秒</div>
          </div>
          <input type="range" min="5" max="60" step="5" v-model.number="cfg.thinkSeconds" style="width:260px;" />
        </div>

        <div style="margin-top:12px;">
          <div class="muted2" style="font-size:12px;">人声（TTS）</div>
          <div class="row gap10 wrap" style="margin-top:10px;">
            <select class="select" v-model="cfg.voice" style="min-width:260px;">
              <option value="zh-CN-XiaoxiaoNeural">中文女声 Xiaoxiao</option>
              <option value="zh-CN-YunxiNeural">中文男声 Yunxi</option>
              <option value="zh-CN-XiaoyiNeural">中文女声 Xiaoyi</option>
            </select>
            <div style="min-width:240px;">
              <div class="muted2" style="font-size:12px;">语速：{{ cfg.rate }}</div>
              <input type="range" min="-20" max="20" step="5" v-model.number="ttsRateNum" style="width:100%;" />
            </div>
          </div>

          <div class="row gap10 wrap" style="margin-top:12px;">
            <button class="btn ghost" @click="unlock">解锁音频</button>
            <button class="btn" @click="testSpeak">试播</button>
            <div style="flex:1;"></div>
            <button class="btn danger" @click="finishInterview">结束面试</button>
            <button class="btn primary" @click="applySettings">保存并继续</button>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Topbar from '../components/ui/Topbar.vue'
import Modal from '../components/ui/Modal.vue'
import CustomLoader from '../components/ui/CustomLoader.vue'
import Live2DAvatar from '../components/Live2DAvatar.vue'
import RadarChart from '../components/charts/RadarChart.vue'
import BarChart from '../components/charts/BarChart.vue'
import { QUESTION_BANK } from '../lib/mockQuestions'
import { addRecord, labelType } from '../lib/records'

// 沿用原项目的后端地址
const API_BASE = 'http://127.0.0.1:8000'

const router = useRouter()

// Live2D 实例（组件 ref），用于调用 speak/unlockAudio
const avatar = ref(null)
const avatarFloat = ref(null)

// 后端连通性：仅用于"是否尝试播报"，不影响 UI 演示。
const serverOk = ref(false)

// 面试会话信息
const interviewSession = ref({
  sessionId: '',
  jobId: 0, // 0: 前端, 1: 后端, 2: 测试
  questions: [],
  currentQuestionIndex: 0,
  currentFollowupIndex: 0 // 0-1，每个主问题有两个追问
})

// 辅助函数
function rand(a,b){ return Math.round(a + Math.random()*(b-a)) }
function clamp(x){ return Math.max(45, Math.min(96, x)) }

// 面试配置
const cfg = reactive({
  difficulty: 'normal',     // easy | normal | hard
  type: 'frontend',         // frontend | backend | algo | pm
  voice: 'zh-CN-XiaoxiaoNeural',
  rate: '+0%',
  showSubtitles: true,
  thinkSeconds: 20,
  avatarPos: 'left',        // left | right | float
  jobId: 0,                 // 0: 前端, 1: 后端, 2: 测试
  resumeText: '简历文本',    // 简历文本
  resumeId: 1,              // 简历ID
  questionCount: 4           // 题目数量(3-20)
})

// 语速 range slider 的数字值（-20~20），我们把它转成 +x% 或 -x%
const ttsRateNum = ref(0)
watch(ttsRateNum, (v) => {
  const n = Number(v || 0)
  cfg.rate = `${n >= 0 ? '+' : ''}${n}%`
})

// 根据难度给一个"建议回答时长"（UI 展示用）
const answerLimit = computed(() => {
  if (cfg.difficulty === 'easy') return 60
  if (cfg.difficulty === 'hard') return 120
  return 90
})

function labelDifficulty(d){
  return d === 'easy' ? '简单' : d === 'hard' ? '高压' : '标准'
}

// =========================
// 2) 运行时状态（loading/room/report）
// =========================
const stage = ref('setup') // setup | loading | room | report

const subtitle = ref('')
const speaking = ref(false)

// 面试题与对话
const transcript = ref([]) // { id, role:'interviewer'|'candidate', text }
const qMsgs = computed(() => transcript.value.filter(m => m.role === 'interviewer'))
const aMsgs = computed(() => transcript.value.filter(m => m.role === 'candidate'))

const draft = ref('')

// room 阶段：分成 3 个相位
// asking：面试官在说（播报）
// thinking：思考倒计时
// answering：回答计时
const phase = ref('asking')
const paused = ref(false)

const thinkLeft = ref(0)
const answerSec = ref(0)
let thinkTimer = null
let answerTimer = null

// 输入模式：语音壳/手写壳/文本
const inputMode = ref('text')
const listening = ref(false)
const voiceStartedAt = ref(0)

// 设置弹窗
const openSettings = ref(false)
watch(openSettings, (v) => {
  if (v) {
    paused.value = true
    // 打开设置时停止语音采集（避免误触）
    listening.value = false
  }
})

// 浮窗拖拽位置
const floatPos = reactive({ x: 18, y: 120 })
let floatDragging = false
let floatDx = 0
let floatDy = 0

const canAnswer = computed(() => stage.value==='room' && !paused.value && phase.value==='answering')

const topSubtitle = computed(() => {
  if (stage.value === 'setup') return '先选择面试参数，再进入动态加载与真实面试界面。'
  if (stage.value === 'loading') return '正在创建面试房间…'
  if (stage.value === 'room') return '思考倒计时 → 回答输入 → 下一题 → 报告。'
  return '报告页：可视化评分 + 建议 + 缺点。'
})

function fmt(sec){
  const s = Math.max(0, Math.floor(sec || 0))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

function fmtTime(sec){
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}分${s}秒`
}

// =========================
// 3) 报告页数据
// =========================
const report = ref({
  overall: 78,
  summary: '整体表现不错：建议回答更结构化（STAR/PREP），并在关键点补充量化结果。',
  weakness: ['回答偶尔缺少量化指标', '部分问题没有先给结论'],
  dimLabels: ['沟通表达', '技术深度', '结构化思维', '项目经验', '加分项'],
  dimData: [82, 76, 80, 78, 74],
  qLabels: ['Q1', 'Q2', 'Q3', 'Q4'],
  qScores: [80, 78, 82, 76]
})

const reportMeta = ref({ usedSec: 0 })

// =========================
// 4) 面试开始流程：setup -> loading -> room
// =========================
// loading 阶段
const loadingProgress = ref(0)
const loadingText = ref('初始化…')
const currentStep = ref(0)
const loadingSteps = ['初始化', '创建会话', '加载题目', '准备就绪']
let loadingTimer = null

function startWithLoading(){
  stage.value = 'loading'
  loadingProgress.value = 0
  const steps = [
    '加载题库…',
    '初始化面试官…',
    '连接语音服务…',
    '创建面试会话…',
    '准备题目…',
    '就绪，马上开始…'
  ]
  let i = 0
  loadingText.value = steps[0]
  loadingTimer = setInterval(async () => {
    i++
    if (i < steps.length) {
      loadingText.value = steps[i]
      loadingProgress.value = Math.min(95, Math.round((i / (steps.length - 1)) * 100))
    }
    if (i === steps.length - 1) {
      clearInterval(loadingTimer)
      loadingProgress.value = 100
      // 保存配置到 localStorage，供 InterviewRoom 使用
      localStorage.setItem('interviewConfig', JSON.stringify({
        difficulty: cfg.difficulty,
        type: cfg.type,
        voice: cfg.voice,
        rate: cfg.rate,
        showSubtitles: cfg.showSubtitles,
        thinkSeconds: cfg.thinkSeconds,
        avatarPos: cfg.avatarPos,
        jobId: cfg.jobId,
        resumeText: cfg.resumeText,
        resumeId: cfg.resumeId,
        questionCount: cfg.questionCount
      }))
      // 跳转到独立的面试房间页面
      setTimeout(() => {
        router.push('/interview-room')
      }, 500)
    }
  }, 400)
}

function cancelLoading(){
  if (loadingTimer) { clearInterval(loadingTimer); loadingTimer = null }
  stage.value = 'setup'
}

// =========================
// 5) room 阶段：面试流程
// =========================
function initRoom(){
  transcript.value = []
  draft.value = ''
  paused.value = false
  // 先问第一题
  ask(currentQuestion.value)
}

const currentQuestion = computed(() => {
  const session = interviewSession.value
  if (session.currentFollowupIndex === 0) {
    // 主问题
    return session.questions[session.currentQuestionIndex]?.text || '请做一个自我介绍。'
  } else {
    // 追问问题（从追问列表中获取）
    const mainQ = session.questions[session.currentQuestionIndex]
    return mainQ?.followupQuestions?.[session.currentFollowupIndex - 1] || ''
  }
})

// ask():
// 1) 把面试官问题推进 transcript
// 2) 尝试调用 Live2D 播报（如果后端已连接）
// 3) 进入 thinking 倒计时
async function ask(text){
  phase.value = 'asking'
  transcript.value.push({ id: `${Date.now()}-${Math.random()}`, role: 'interviewer', text })

  // 如果后端连通（serverOk），并且 Live2DAvatar 提供 speak()，才尝试播报。
  // 这样在"UI-only"情况下不会报错。
  if (serverOk.value && avatar.value?.speak) {
    try { await avatar.value.speak(text, cfg.voice, cfg.rate) } catch {}
  }

  // 进入思考阶段
  startThinking()
}

function startThinking(){
  stopTimers()
  phase.value = 'thinking'
  thinkLeft.value = cfg.thinkSeconds
  if (paused.value) return
  thinkTimer = setInterval(() => {
    if (paused.value) return
    thinkLeft.value -= 1
    if (thinkLeft.value <= 0) {
      clearInterval(thinkTimer)
      thinkTimer = null
      startAnswer()
    }
  }, 1000)
}

function startAnswer(){
  stopTimers()
  phase.value = 'answering'
  answerSec.value = 0
  if (paused.value) return
  answerTimer = setInterval(() => {
    if (paused.value) return
    answerSec.value += 1

    // 超过建议时长就提示（不强制结束，避免打断演示）
    if (answerSec.value === answerLimit.value) {
      // 这里不弹窗，避免打扰；你可以改成 toast。
      subtitle.value = '提示：已达到建议回答时长，可以收尾给结论。'
    }
  }, 1000)
}

function stopTimers(){
  if (thinkTimer) { clearInterval(thinkTimer); thinkTimer = null }
  if (answerTimer) { clearInterval(answerTimer); answerTimer = null }
}

function togglePause(){
  paused.value = !paused.value
  // 暂停时：不销毁计时器，只让计时器 tick 时 "return"，保持 UI 稳定。
}

function applySettings(){
  openSettings.value = false
  paused.value = false
}

async function testSpeak(){
  // 设置页里"试播一句"：用于验证 Live2D + TTS 链路是否工作。
  const text = '你好，我是今天的面试官。我们开始吧。'
  if (serverOk.value && avatar.value?.speak) {
    try { await avatar.value.speak(text, cfg.voice, cfg.rate) } catch {}
  }
}

// 语音识别：调用STT接口
async function transcribeAudio(audioBlob) {
  try {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')
    
    const response = await fetch(`${API_BASE}/api/stt`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`语音识别失败: ${response.status}`)
    }
    
    const result = await response.json()
    const data = result.data || result
    return data.text || data.content || data.transcript
  } catch (error) {
    console.error('语音识别失败:', error)
    // 降级到显示时长
    return null
  }
}

// 录音相关变量
let mediaRecorder = null
let audioChunks = []

function toggleVoice(){
  if (!canAnswer.value) return
  if (!listening.value) {
    // 开始录音
    startRecording()
    return
  }
  // 结束录音
  stopRecording()
}

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream)
      audioChunks = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.start()
      listening.value = true
      voiceStartedAt.value = Date.now()
    })
    .catch(error => {
      console.error('获取麦克风失败:', error)
      subtitle.value = '无法访问麦克风，请检查权限'
    })
}

async function stopRecording() {
  if (!mediaRecorder) return
  
  return new Promise((resolve) => {
    mediaRecorder.onstop = async () => {
      listening.value = false
      
      // 创建音频Blob
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      
      // 调用STT接口
      const recognizedText = await transcribeAudio(audioBlob)
      
      if (recognizedText) {
        // 识别成功，使用识别文本
        pushAnswerAndNext(recognizedText)
      } else {
        // 识别失败，使用时长占位
        const dur = Math.max(1, Math.round((Date.now() - voiceStartedAt.value) / 1000))
        pushAnswerAndNext(`已回答完毕，时长 ${dur}s`)
      }
      
      resolve()
    }
    
    mediaRecorder.stop()
  })
}

function commitText(){
  const t = String(draft.value || '').trim() || '（未填写回答）'
  draft.value = ''
  pushAnswerAndNext(t)
}

// 提交回答并进入下一个问题
async function pushAnswerAndNext(answerText) {
  transcript.value.push({ id: `${Date.now()}-${Math.random()}`, role: 'candidate', text: answerText })
  
  // 停止计时器
  stopTimers()
  
  // 检查是否需要追问
  const session = interviewSession.value
  if (session.currentFollowupIndex < 2) {
    // 获取追问问题
    const followupQuestion = await getFollowupQuestion(answerText)
    
    // 保存追问问题
    session.questions[session.currentQuestionIndex].followupQuestions.push(followupQuestion)
    
    // 增加追问索引
    session.currentFollowupIndex += 1
    
    // 问追问问题
    await ask(followupQuestion)
  } else {
    // 所有追问都问完了，进入下一个主问题
    session.currentQuestionIndex += 1
    session.currentFollowupIndex = 0
    
    if (session.currentQuestionIndex < session.questions.length) {
      // 还有主问题，继续问
      await ask(currentQuestion.value)
    } else {
      // 所有问题都问完了，结束面试
      await finishInterview()
    }
  }
}

// 结束面试
async function finishInterview() {
  stopTimers()
  paused.value = false

  try {
    // 调用评价接口
    const evaluationResult = await getInterviewEvaluation()
    
    // 更新报告数据
    report.value = {
      overall: evaluationResult.overall,
      summary: evaluationResult.summary,
      weakness: evaluationResult.weakness,
      dimLabels: evaluationResult.dimLabels,
      dimData: evaluationResult.dimData,
      qLabels: evaluationResult.qLabels,
      qScores: evaluationResult.qScores
    }
    
    // 把记录写入"历史记录"
    try {
      addRecord({
        type: cfg.type,
        title: `${labelType(cfg.type)} · ${labelDifficulty(cfg.difficulty)} 面试`,
        overall: evaluationResult.overall,
        dimensions: evaluationResult.dimLabels.map((k, i) => ({ k, v: evaluationResult.dimData[i] })),
        transcript: transcript.value.slice(),
        startedAt: Date.now() - 60 * 1000,
        endedAt: Date.now(),
        notes: evaluationResult.summary,
      })
    } catch {}
    
    // 计算用时
    reportMeta.value.usedSec = answerSec.value + (cfg.thinkSeconds * interviewSession.value.questions.length)
    
    // 进入报告页
    stage.value = 'report'
  } catch (error) {
    console.error('获取评价失败:', error)
    // 降级到本地模拟评分
    const mockReport = generateMockReport()
    
    report.value = mockReport
    
    // 把记录写入"历史记录"
    try {
      addRecord({
        type: cfg.type,
        title: `${labelType(cfg.type)} · ${labelDifficulty(cfg.difficulty)} 面试`,
        overall: mockReport.overall,
        dimensions: mockReport.dimLabels.map((k, i) => ({ k, v: mockReport.dimData[i] })),
        transcript: transcript.value.slice(),
        startedAt: Date.now() - 60 * 1000,
        endedAt: Date.now(),
        notes: mockReport.summary,
      })
    } catch {}
    
    // 计算用时
    reportMeta.value.usedSec = answerSec.value + (cfg.thinkSeconds * interviewSession.value.questions.length)
    
    // 进入报告页
    stage.value = 'report'
  }
}

// 接口1：创建面试会话（获取主问题列表）
async function createInterviewSession() {
  try {
    const response = await fetch(`${API_BASE}/api/interview/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeText: cfg.resumeText,
        questionCount: cfg.questionCount,
        resumeId: cfg.resumeId,
        jobId: cfg.jobId // 0:前端, 1:后端, 2:测试
      })
    })

    if (!response.ok) {
      throw new Error(`创建面试会话失败: ${response.status}`)
    }

    const result = await response.json()
    const data = result.data || result
    
    // 保存会话信息
    interviewSession.value = {
      sessionId: data.sessionId,
      jobId: data.jobId,
      questions: data.questions.map(q => ({
        text: q.content || q.text || q.question,
        followupQuestions: [] // 预留追问问题数组
      })),
      currentQuestionIndex: 0,
      currentFollowupIndex: 0
    }

    return data
  } catch (error) {
    console.error('创建面试会话失败:', error)
    // 降级到本地题库
    return fallbackToLocalQuestions()
  }
}

// 降级到本地题库
function fallbackToLocalQuestions() {
  const bank = QUESTION_BANK[cfg.type] || []
  const shuffled = bank.slice().sort(() => Math.random() - 0.5)
  const localQuestions = shuffled.slice(0, cfg.questionCount).map(text => ({
    text,
    followupQuestions: []
  }))

  interviewSession.value = {
    sessionId: `local_${Date.now()}`,
    jobId: cfg.jobId,
    questions: localQuestions,
    currentQuestionIndex: 0,
    currentFollowupIndex: 0
  }

  return {
    sessionId: interviewSession.value.sessionId,
    jobId: cfg.jobId,
    questions: localQuestions
  }
}

// 接口2：获取追问问题
async function getFollowupQuestion(answerText) {
  try {
    const session = interviewSession.value
    const response = await fetch(`${API_BASE}/api/interview/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.sessionId,
        answer: answerText
      })
    })

    if (!response.ok) {
      throw new Error(`获取追问问题失败: ${response.status}`)
    }

    const result = await response.json()
    const data = result.data || result
    return data.question || data.content || data.text
  } catch (error) {
    console.error('获取追问问题失败:', error)
    // 降级到默认追问
    return getDefaultFollowupQuestion()
  }
}

// 默认追问问题
function getDefaultFollowupQuestion() {
  const followups = [
    '能详细展开说明一下吗？',
    '你在这个项目中具体负责了哪些工作？',
    '遇到了什么挑战，是如何解决的？',
    '有什么可以改进的地方吗？',
    '这个方案的优缺点是什么？'
  ]
  return followups[Math.floor(Math.random() * followups.length)]
}

// 接口3：调用评价接口
async function getInterviewEvaluation() {
  try {
    const session = interviewSession.value
    const response = await fetch(`${API_BASE}/api/interview/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.sessionId
      })
    })

    if (!response.ok) {
      throw new Error(`获取评价失败: ${response.status}`)
    }

    const result = await response.json()
    const data = result.data || result
    
    // 适配后端返回的评价数据格式
    return {
      overall: data.overallScore || data.score || data.overall,
      summary: data.summary || data.feedback || data.comment,
      weakness: data.weaknesses || data.weakness || [],
      dimLabels: data.dimensionLabels || data.dimensions?.map(d => d.name) || ['沟通表达', '技术深度', '结构化思维', '项目经验', '加分项'],
      dimData: data.dimensionScores || data.dimensions?.map(d => d.score) || [75, 80, 78, 82, 76],
      qLabels: data.questionLabels || data.questions?.map((_, i) => `Q${i+1}`) || [],
      qScores: data.questionScores || data.questions?.map(q => q.score) || [],
      questions: data.questions || []
    }
  } catch (error) {
    throw error
  }
}

// 降级到本地模拟评分
function generateMockReport() {
  // 评分是 Demo：按难度稍微调整基准分，让"高压模式更难拿高分"
  const base = cfg.difficulty === 'hard'
    ? 64 + Math.round(Math.random() * 16)
    : cfg.difficulty === 'easy'
      ? 74 + Math.round(Math.random() * 16)
      : 68 + Math.round(Math.random() * 16)

  const dims = [
    { k: '沟通表达', v: clamp(base + rand(-6, 8)) },
    { k: '技术深度', v: clamp(base + rand(-10, 10)) },
    { k: '结构化思维', v: clamp(base + rand(-10, 8)) },
    { k: '项目经验', v: clamp(base + rand(-8, 9)) },
    { k: '加分项', v: clamp(base + rand(-9, 7)) },
  ]
  const overall = Math.round(dims.reduce((s,d)=>s+d.v,0)/dims.length)

  // 每题评分（模拟）：并给一句建议
  const qScores = interviewSession.value.questions.map(() => clamp(base + rand(-12, 10)))
  const qAdvicePool = [
    '先给结论，再用 1~2 个证据支撑，最后补充权衡。',
    '补充量化指标：性能、成本、延迟、准确率或转化率。',
    '用 STAR/PREP 结构：背景→任务→行动→结果→复盘。',
    '明确边界条件：输入、约束、失败场景与降级策略。',
    '强调 trade-off：为什么选 A 而不是 B，以及风险与验证。'
  ]
  const qDetails = interviewSession.value.questions.map((q, i) => ({
    title: q.text,
    score: qScores[i],
    advice: qAdvicePool[i % qAdvicePool.length],
  }))

  return {
    overall,
    summary: overall >= 85
      ? '整体表现很强：表达清晰、论点结构完整。建议继续补足更硬的指标与对比实验。'
      : overall >= 75
        ? '整体表现不错：建议回答更结构化（STAR/PREP），并在关键点补充量化结果。'
        : '建议优先准备：项目复盘（讲清楚你做了什么）+ 基础知识（讲清楚为什么）。',
    weakness: overall >= 85
      ? ['技术细节可以再补充"权衡依据"', '表达可以再更简洁（先结论后细节）']
      : overall >= 75
        ? ['回答偶尔缺少量化指标', '部分问题没有先给结论']
        : ['结构化不足，容易铺叙', '项目亮点与结果不够具体', '对 trade-off 的思考偏少'],
    dimLabels: dims.map(d=>d.k),
    dimData: dims.map(d=>d.v),
    qLabels: qScores.map((_,i)=>`Q${i+1}`),
    qScores,
    questions: qDetails
  }
}

// 后端检测 / 音频解锁
async function checkServer(){
  try {
    const r = await fetch(`${API_BASE}/ping`, { cache: 'no-store' })
    serverOk.value = r.ok
  } catch {
    serverOk.value = false
  }
}

function unlock(){
  // Live2DAvatar 里会创建 AudioContext，浏览器需要用户手势才能播放。
  // 所以我们提供一个"解锁音频"按钮。
  try { avatar.value?.unlockAudio?.() } catch {}
}

// 浮窗拖拽
function startFloatDrag(e){
  if (cfg.avatarPos !== 'float') return
  floatDragging = true
  floatDx = e.clientX - floatPos.x
  floatDy = e.clientY - floatPos.y
  const onMove = (ev) => {
    if (!floatDragging) return
    floatPos.x = ev.clientX - floatDx
    floatPos.y = ev.clientY - floatDy
  }
  const onUp = () => {
    floatDragging = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// =========================
// 6) 报告页操作
// =========================
function goHome(){
  router.push('/app/home')
}

function goRecords(){
  router.push('/app/records')
}

function restart(){
  stage.value = 'setup'
  transcript.value = []
  draft.value = ''
  paused.value = false
  stopTimers()
}

// 初始化
onMounted(async () => {
  // 检测后端连接
  await checkServer()
})

// 清理
onBeforeUnmount(() => {
  stopTimers()
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop()
  }
})
</script>

<style scoped>
/* =========================
   布局与通用
   ========================= */
.container {
  padding: 16px;
}

.grid2 {
  display: grid;
  gap: 16px;
}

/* =========================
   Bento 卡片
   ========================= */
.bento {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.bento-card {
  background: var(--card-2);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  padding: 14px;
}

@media (max-width: 900px) {
  .bento {
    grid-template-columns: 1fr;
  }
  .grid2 {
    grid-template-columns: 1fr !important;
  }
}

/* =========================
   控件
   ========================= */
.seg {
  display: inline-flex;
  background: var(--card-2);
  border: 1px solid var(--stroke);
  border-radius: 999px;
  padding: 4px;
}

.seg-btn {
  padding: 6px 12px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
}

.seg-btn.on {
  background: var(--brand);
  color: white;
}

.pill {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--stroke);
  background: var(--card);
  cursor: pointer;
  font-size: 13px;
}

.pill.on {
  background: var(--brand);
  color: white;
  border-color: var(--brand);
}

.select {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--stroke);
  background: var(--card);
  color: var(--text);
  font-size: 14px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
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
  background-color: var(--card-2);
  border: 1px solid var(--stroke);
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}

input:checked + .slider {
  background-color: var(--brand);
  border-color: var(--brand);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* =========================
   Loading 界面 - 简洁大气
   ========================= */
.loading-screen {
  position: fixed;
  inset: 0;
  background: var(--bg0);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 60px;
  margin-top: 80px;
}

.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

/* 三环旋转动画 */
.loading-ring {
  position: relative;
  width: 120px;
  height: 120px;
}

.ring-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 2px solid transparent;
}

.ring-ring:nth-child(1) {
  width: 120px;
  height: 120px;
  border-top-color: var(--brand);
  border-right-color: rgba(100, 108, 255, 0.3);
  animation: ringSpin 2s linear infinite;
}

.ring-ring:nth-child(2) {
  width: 90px;
  height: 90px;
  border-top-color: rgba(100, 108, 255, 0.7);
  border-left-color: rgba(100, 108, 255, 0.2);
  animation: ringSpin 1.5s linear infinite reverse;
}

.ring-ring:nth-child(3) {
  width: 60px;
  height: 60px;
  border-top-color: rgba(100, 108, 255, 0.5);
  border-bottom-color: rgba(100, 108, 255, 0.15);
  animation: ringSpin 1s linear infinite;
}

@keyframes ringSpin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 2px;
  animation: textFade 2s ease-in-out infinite;
}

@keyframes textFade {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* 底部信息 */
.loading-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--muted2);
}

.meta-item {
  padding: 6px 14px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 20px;
}

.meta-dot {
  color: var(--stroke2);
}

.loading-progress {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-track {
  width: 200px;
  height: 3px;
  background: var(--stroke);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand), rgba(100, 108, 255, 0.5));
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--brand);
  min-width: 36px;
}

/* 取消按钮 */
.loading-cancel {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 12px;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.loading-cancel:hover {
  background: rgba(255, 90, 90, 0.1);
  border-color: rgba(255, 90, 90, 0.3);
  color: var(--bad);
}

/* =========================
   Room 界面
   ========================= */
.room-min-wrap {
  position: relative;
  min-height: calc(100vh - 80px);
}

.room-min {
  padding: 16px;
}

.room-corner {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  z-index: 100;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--stroke);
  background: var(--card);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--hover);
  transform: translateY(-2px);
}

.room-cols {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 16px;
  margin-top: 60px;
}

.room-col {
  min-height: 400px;
}

.room-col.right {
  text-align: right;
}

.col-title {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 12px;
  font-weight: 600;
}

.chat-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-stack.right {
  align-items: flex-end;
}

.chat-bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
}

.chat-bubble.q {
  background: var(--card-2);
  border: 1px solid var(--stroke);
  border-bottom-left-radius: 4px;
}

.chat-bubble.a {
  background: var(--brand);
  color: white;
  border-bottom-right-radius: 4px;
}

.room-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.live2d-stage {
  width: 280px;
  height: 280px;
  border-radius: 20px;
  overflow: hidden;
  background: var(--card-2);
  border: 1px solid var(--stroke);
  transition: all 0.3s ease;
}

.live2d-stage.speaking {
  box-shadow: 0 0 30px rgba(91, 124, 250, 0.3);
  border-color: var(--brand);
}

.live2d-float {
  position: fixed;
  width: 200px;
  height: 200px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--card-2);
  border: 1px solid var(--stroke);
  cursor: move;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0,0,0,.15);
}

/* QQ 风格输入框 */
.qq-input {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  align-items: flex-end;
  width: 90%;
  max-width: 600px;
  background: var(--card);
  border: 1px solid var(--stroke);
  border-radius: 24px;
  padding: 8px 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,.1);
}

.qq-text {
  flex: 1;
  border: none;
  background: transparent;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  max-height: 120px;
  padding: 8px 0;
  color: var(--text);
}

.qq-text:focus {
  outline: none;
}

.qq-text::placeholder {
  color: var(--muted);
}

.qq-send {
  padding: 8px 20px;
  border-radius: 16px;
  border: none;
  background: var(--brand);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.qq-send:hover:not(:disabled) {
  background: #4a6be8;
  transform: translateY(-1px);
}

.qq-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 语音按钮 */
.voice-fab {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: var(--brand);
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(91, 124, 250, 0.4);
  transition: all 0.3s ease;
}

.voice-fab:hover:not(:disabled) {
  transform: translateX(-50%) scale(1.05);
  box-shadow: 0 6px 24px rgba(91, 124, 250, 0.5);
}

.voice-fab.on {
  background: var(--ok);
  animation: voicePulse 1.5s ease-in-out infinite;
}

.voice-fab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes voicePulse {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(54, 211, 153, 0.4);
  }
  50% {
    box-shadow: 0 4px 30px rgba(54, 211, 153, 0.6);
  }
}

/* =========================
   Report 界面
   ========================= */
.report-wrap {
  padding: 16px;
}

.report-header {
  margin-bottom: 16px;
}

.report-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .report-grid {
    grid-template-columns: 1fr;
  }
  .room-cols {
    grid-template-columns: 1fr;
  }
}

.score-ring {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: conic-gradient(
    var(--brand) calc(var(--score) * 3.6deg),
    var(--stroke) calc(var(--score) * 3.6deg)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.score-inner {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: var(--card);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-num {
  font-size: 36px;
  font-weight: 950;
  color: var(--brand);
}

.score-label {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

/* =========================
   动画
   ========================= */
.qmsg-enter-active,
.qmsg-leave-active {
  transition: all 0.3s ease;
}

.qmsg-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.qmsg-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>