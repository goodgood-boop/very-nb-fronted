<template>
  <div class="interview-room">
    <!-- 右上角：暂停/设置（极简） -->
    <div class="room-corner">
      <button class="icon-btn" @click="togglePause" :title="paused ? '继续' : '暂停'">
        {{ paused ? '▶' : '⏸' }}
      </button>
      <button class="icon-btn" @click="openSettings=true" title="设置">⚙</button>
    </div>

    <!-- 中间：Live2D面试官 -->
    <div class="avatar-section">
      <div class="live2d-stage" :class="speaking ? 'speaking' : ''">
        <Live2DAvatar ref="avatar" @subtitle="subtitle=$event" @speaking="speaking=$event" />
      </div>
      <!-- 当前状态提示 -->
      <div class="phase-indicator" :style="phaseColor">
        {{ phaseLabel }}
      </div>
    </div>

    <!-- 聊天区域：问题在左，回答在右 -->
    <div class="chat-area">
      <div class="chat-messages" ref="chatScroll">
        <div 
          v-for="m in allMessages" 
          :key="m.id" 
          class="message-row"
          :class="m.role === 'interviewer' ? 'left' : 'right'"
        >
          <div class="message-bubble" :class="m.role">
            {{ m.text }}
          </div>
        </div>
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="input-section">
      <!-- 手动输入 -->
      <div v-if="inputMode==='text'" class="text-input-bar">
        <button class="input-icon" @click="inputMode='voice'" title="切换语音">🎙</button>
        <textarea
          v-model="draft"
          class="input-field"
          rows="1"
          :disabled="!canAnswer"
          placeholder="输入你的回答…"
          @keydown.enter.exact.prevent="commitText"
        ></textarea>
        <button class="send-btn" :disabled="!canAnswer || !draft.trim()" @click="commitText">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" fill="currentColor"/>
          </svg>
        </button>
      </div>

      <!-- 语音输入 -->
      <div v-else class="voice-input-bar">
        <button class="input-icon" @click="inputMode='text'" title="切换文字">⌨</button>
        <button
          class="voice-btn"
          :class="listening ? 'recording' : ''"
          :disabled="!canAnswer"
          @click="toggleVoice"
        >
          <span v-if="listening">
            <span class="recording-wave"></span>
            点击结束
          </span>
          <span v-else>按住说话</span>
        </button>
      </div>
    </div>

    <!-- 设置弹窗 -->
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Modal from '../components/ui/Modal.vue'
import Live2DAvatar from '../components/Live2DAvatar.vue'
import { QUESTION_BANK } from '../lib/mockQuestions'
import { addRecord, labelType } from '../lib/records'

// 沿用原项目的后端地址
const API_BASE = 'http://127.0.0.1:8000'

const router = useRouter()
const route = useRoute()

// Live2D 实例（组件 ref），用于调用 speak/unlockAudio
const avatar = ref(null)

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

// 从 localStorage 读取面试配置
const savedConfig = JSON.parse(localStorage.getItem('interviewConfig') || '{}')

// 面试配置
const cfg = reactive({
  difficulty: savedConfig.difficulty || 'normal',     // easy | normal | hard
  type: savedConfig.type || 'frontend',               // frontend | backend | algo | pm
  voice: savedConfig.voice || 'zh-CN-XiaoxiaoNeural',
  rate: savedConfig.rate || '+0%',
  showSubtitles: savedConfig.showSubtitles !== undefined ? savedConfig.showSubtitles : true,
  thinkSeconds: savedConfig.thinkSeconds || 20,
  avatarPos: savedConfig.avatarPos || 'left',         // left | right | float
  jobId: savedConfig.jobId !== undefined ? savedConfig.jobId : 0,  // 0: 前端, 1: 后端, 2: 测试
  resumeText: savedConfig.resumeText || '简历文本',    // 简历文本
  resumeId: savedConfig.resumeId || 1,                // 简历ID
  questionCount: savedConfig.questionCount || 4       // 题目数量(3-20)
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

// 运行时状态
const subtitle = ref('')
const speaking = ref(false)

// 面试题与对话
const transcript = ref([]) // { id, role:'interviewer'|'candidate', text }

// 合并所有消息用于显示
const allMessages = computed(() => {
  return [...transcript.value].sort((a, b) => {
    // 从id中提取时间戳进行比较
    const timeA = parseFloat(a.id.split('-')[0])
    const timeB = parseFloat(b.id.split('-')[0])
    return timeA - timeB
  })
})

const draft = ref('')

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

// 输入模式：语音/文本
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

// 聊天滚动区域
const chatScroll = ref(null)

// 自动滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (chatScroll.value) {
      chatScroll.value.scrollTop = chatScroll.value.scrollHeight
    }
  })
}

const canAnswer = computed(() => !paused.value && phase.value==='answering')

const phaseLabel = computed(() => {
  if (paused.value) return '已暂停'
  if (phase.value === 'asking') return '提问中'
  if (phase.value === 'thinking') return `思考中 ${thinkLeft.value}s`
  return '回答中'
})

const phaseColor = computed(() => {
  if (paused.value) return 'color:var(--muted)'
  if (phase.value === 'asking') return 'color:var(--brand)'
  if (phase.value === 'thinking') return 'color:var(--warn)'
  return 'color:var(--ok)'
})

function fmt(sec){
  const s = Math.max(0, Math.floor(sec || 0))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
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

// 初始化面试
async function initInterview() {
  transcript.value = []
  draft.value = ''
  listening.value = false
  subtitle.value = ''
  speaking.value = false

  // 调用接口1创建面试会话
  await createInterviewSession()
  
  paused.value = false

  // 先问第一题
  await ask(currentQuestion.value)
}

// ask():
// 1) 把面试官问题推进 transcript
// 2) 尝试调用 Live2D 播报（如果后端已连接）
// 3) 进入 thinking 倒计时
async function ask(text){
  phase.value = 'asking'
  transcript.value.push({ id: `${Date.now()}-${Math.random()}`, role: 'interviewer', text })
  scrollToBottom()

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
  scrollToBottom()
  
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
    
    // 把记录写入"历史记录"
    try {
      addRecord({
        type: cfg.type,
        title: `${labelType(cfg.type)} · ${labelDifficulty(cfg.difficulty)} 面试`,
        overall: evaluationResult.overall,
        dimensions: evaluationResult.dimensions.map(d => ({ k: d.name, v: d.score })),
        transcript: transcript.value.slice(),
        startedAt: Date.now() - 60 * 1000,
        endedAt: Date.now(),
        notes: evaluationResult.summary,
      })
    } catch {}
    
    // 跳转到报告页
    router.push('/app/interview?stage=report&result=' + encodeURIComponent(JSON.stringify(evaluationResult)))
  } catch (error) {
    console.error('获取评价失败:', error)
    // 降级到本地模拟评分
    const mockReport = generateMockReport()
    
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
    
    // 跳转到报告页
    router.push('/app/interview?stage=report&result=' + encodeURIComponent(JSON.stringify(mockReport)))
  }
}

// 初始化
onMounted(async () => {
  // 检测后端连接
  await checkServer()
  
  // 初始化面试
  await initInterview()
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
.interview-room {
  min-height: 100vh;
  background: var(--bg0);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 背景光晕效果 */
.interview-room::before {
  content: '';
  position: fixed;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background:
    radial-gradient(ellipse at 20% 20%, rgba(100, 108, 255, 0.08) 0%, transparent 40%),
    radial-gradient(ellipse at 80% 80%, rgba(54, 211, 153, 0.05) 0%, transparent 40%),
    radial-gradient(ellipse at 50% 50%, rgba(255, 90, 90, 0.03) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* 右上角控制按钮 */
.room-corner {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 100;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--stroke);
  border-radius: 10px;
  background: var(--panel);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  color: var(--text);
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--panel2);
  border-color: var(--stroke2);
}

/* 中间Live2D区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 60px;
  padding-bottom: 20px;
  position: relative;
  z-index: 1;
}

.live2d-stage {
  width: 200px;
  height: 260px;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(100, 108, 255, 0.1) 0%, rgba(54, 211, 153, 0.05) 100%);
  border: 1px solid var(--stroke);
}

.phase-indicator {
  margin-top: 16px;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 16px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 20px;
}

/* 聊天区域 */
.chat-area {
  flex: 1;
  padding: 0 20px;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.chat-messages {
  height: 100%;
  overflow-y: auto;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-row {
  display: flex;
  width: 100%;
}

.message-row.left {
  justify-content: flex-start;
}

.message-row.right {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-bubble.interviewer {
  background: var(--panel);
  border: 1px solid var(--stroke);
  color: var(--text);
  border-bottom-left-radius: 4px;
}

.message-bubble.candidate {
  background: var(--brand);
  color: white;
  border-bottom-right-radius: 4px;
}

/* 底部输入区域 */
.input-section {
  padding: 12px 16px 24px;
  position: relative;
  z-index: 1;
}

.text-input-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 24px;
  padding: 6px 6px 6px 12px;
}

.input-icon {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.input-icon:hover {
  color: var(--text);
}

.input-field {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 15px;
  resize: none;
  outline: none;
  padding: 8px 0;
  min-height: 20px;
  max-height: 100px;
}

.input-field::placeholder {
  color: var(--muted2);
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: var(--brand);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(100, 108, 255, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 语音输入 */
.voice-input-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px;
}

.voice-btn {
  flex: 1;
  height: 48px;
  border: 1px solid var(--stroke);
  border-radius: 24px;
  background: var(--panel);
  color: var(--text);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.voice-btn:hover:not(:disabled) {
  background: var(--panel2);
}

.voice-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-btn.recording {
  background: rgba(255, 90, 90, 0.2);
  border-color: rgba(255, 90, 90, 0.5);
  color: var(--bad);
}

.recording-wave {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: var(--bad);
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

/* 设置弹窗样式 */
.row {
  display: flex;
  align-items: center;
}

.row.space {
  justify-content: space-between;
}

.row.gap10 {
  gap: 10px;
}

.row.wrap {
  flex-wrap: wrap;
}

.seg {
  display: inline-flex;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 999px;
  padding: 3px;
}

.seg-btn {
  padding: 6px 14px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.seg-btn.on {
  background: var(--brand);
  color: white;
}

.select {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--stroke);
  background: var(--panel);
  color: var(--text);
  font-size: 14px;
  outline: none;
}

.btn {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--stroke);
  background: var(--panel);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: var(--panel2);
}

.btn.primary {
  background: var(--brand);
  border-color: var(--brand);
  color: white;
}

.btn.danger {
  background: rgba(255, 90, 90, 0.2);
  border-color: rgba(255, 90, 90, 0.3);
  color: var(--bad);
}

.btn.ghost {
  background: transparent;
}

.muted2 {
  color: var(--muted2);
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--stroke);
  border-radius: 2px;
}

/* 响应式 */
@media (max-width: 600px) {
  .live2d-stage {
    width: 160px;
    height: 200px;
  }
  
  .message-bubble {
    max-width: 85%;
    padding: 10px 14px;
    font-size: 13px;
  }
}
</style>
