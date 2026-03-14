<template>
  <div class="interview-room page-with-bg">
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

    <!-- 问题进度提醒 - 完全按照 EchoMind-feature- 样式 -->
    <div v-if="interviewSession.questions.length > 0 && currentQuestionObj.question" class="question-progress-panel">
      <div class="progress-header">
        <span class="progress-title">
          题目 {{ currentQuestionObj.questionIndex + 1 }} / {{ interviewSession.questions.length }}
        </span>
        <span class="progress-percent">{{ Math.round(progressPercent) }}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <!-- 聊天区域：QQ/微信风格 - 单列表，新消息从底部添加 -->
    <div class="chat-area">
      <div class="chat-messages" ref="chatMessagesRef">
        <!-- 消息列表 -->
        <div class="messages-container">
          <div 
            v-for="(m, index) in allMessages" 
            :key="m.id" 
            class="message-row"
            :class="m.role"
          >
            <div class="message-bubble" :class="m.role">
              <div class="message-sender">{{ m.role === 'interviewer' ? '面试官' : '我' }}</div>
              <div class="message-text">{{ m.text }}</div>
            </div>
          </div>
          <div v-if="allMessages.length === 0" class="chat-placeholder">
            <div class="placeholder-icon">💬</div>
            <div>面试即将开始，请做好准备...</div>
          </div>
        </div>
        <!-- 滚动锚点 -->
        <div ref="scrollAnchor" class="scroll-anchor"></div>
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
              <option value="alex">alex</option>
              <option value="anna">anna</option>
              <option value="bella">bella</option>
              <option value="benjamin">benjamin</option>
              <option value="charles">charles</option>
              <option value="claire">claire</option>
              <option value="david">david</option>
              <option value="diana">diana</option>
            </select>
            <div style="min-width:240px;">
              <div class="muted2" style="font-size:12px;">倍速：{{ cfg.rate }}</div>
              <input type="range" min="0.5" max="2.0" step="0.1" v-model.number="ttsRateNum" style="width:100%;" />
            </div>
          </div>

          <div class="row gap10 wrap" style="margin-top:12px;">
            <button class="btn ghost btn-glow" @click="unlock">解锁音频</button>
            <button class="btn btn-glow" @click="testSpeak">试播</button>
            <div style="flex:1;"></div>
            <button class="btn danger btn-glow" @click="showCompleteConfirm=true">结束面试</button>
            <button class="btn primary btn-glow" @click="applySettings">保存并继续</button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- 提前交卷确认对话框 -->
    <Modal
      :open="showCompleteConfirm"
      title="提前交卷"
      subtitle="确定要提前交卷吗？未回答的问题将按0分计算。"
      @close="showCompleteConfirm=false"
    >
      <div class="card soft" style="padding:20px;">
        <div class="row gap10" style="justify-content: flex-end;">
          <button 
            class="btn ghost" 
            @click="showCompleteConfirm=false"
            :disabled="isSubmitting"
          >
            取消
          </button>
          <button 
            class="btn danger" 
            @click="finishInterview"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? '提交中...' : '确定交卷' }}
          </button>
        </div>
      </div>
    </Modal>

    <!-- 未完成面试提示对话框 -->
    <Modal
      :open="showUnfinishedDialog"
      title="发现未完成的面试"
      :subtitle="unfinishedSession ? `您有一个进行中的面试（题目 ${unfinishedSession.currentQuestionIndex + 1}/${unfinishedSession.questions.length}），是否继续？` : ''"
      @close="handleStartNew"
    >
      <div class="card soft" style="padding:20px;">
        <p style="margin-bottom: 16px; color: #64748b;">
          您可以选择继续之前的面试进度，或者开始一场新的面试。
        </p>
        <div class="row gap10" style="justify-content: flex-end;">
          <button 
            class="btn ghost" 
            @click="handleStartNew"
          >
            开始新面试
          </button>
          <button 
            class="btn primary" 
            @click="handleContinueUnfinished"
          >
            继续面试
          </button>
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
import { interviewApi } from '../api/interview.js'

// EchoMind-37a 后端地址
// 后端已配置 CORS，直接使用完整 URL
const API_BASE = 'http://113.54.240.73:8080'

const router = useRouter()
const route = useRoute()

// Live2D 实例（组件 ref），用于调用 speak/unlockAudio
const avatar = ref(null)

// 后端连通性：仅用于"是否尝试播报"，不影响 UI 演示。
const serverOk = ref(false)

// 面试会话信息 - 完全照抄 EchoMind-feature- 的结构
const interviewSession = ref({
  sessionId: '',
  jobId: 0, // 0: 前端, 1: 后端, 2: 测试
  questions: [],
  currentQuestionIndex: 0,
  currentFollowupIndex: 0 // 0-1，每个主问题有两个追问
})

// 当前问题（完全照抄 EchoMind-feature- 的 currentQuestion 结构）
const currentQuestionObj = ref({
  questionIndex: 0,
  question: '',
  type: '',
  category: '',
  addQuestionIndex: 0
})

// 辅助函数
function rand(a,b){ return Math.round(a + Math.random()*(b-a)) }
function clamp(x){ return Math.max(45, Math.min(96, x)) }

// 从 URL 查询参数读取配置（从简历分析页面传入）
const routeQuery = route.query

// 从 localStorage 读取面试配置（作为后备）
const savedConfig = JSON.parse(localStorage.getItem('interviewConfig') || '{}')

// 面试配置 - 优先使用 URL 参数，其次是 localStorage，最后是默认值
const cfg = reactive({
  type: routeQuery.type || savedConfig.type || 'frontend',               // frontend | backend | algo | pm
  voice: routeQuery.voice || savedConfig.voice || 'alex',
  rate: routeQuery.rate ? parseFloat(routeQuery.rate) : (savedConfig.rate || 1.0),
  showSubtitles: routeQuery.showSubtitles !== undefined 
    ? routeQuery.showSubtitles === 'true' 
    : (savedConfig.showSubtitles !== undefined ? savedConfig.showSubtitles : true),
  thinkSeconds: routeQuery.thinkSeconds ? parseInt(routeQuery.thinkSeconds) : (savedConfig.thinkSeconds || 20),
  avatarPos: routeQuery.avatarPos || savedConfig.avatarPos || 'left',         // left | right | float
  jobId: routeQuery.jobId !== undefined ? parseInt(routeQuery.jobId) : (savedConfig.jobId !== undefined ? savedConfig.jobId : 0),  // 0: 前端, 1: 后端, 2: 测试
  resumeText: routeQuery.resumeText || savedConfig.resumeText || '简历文本',    // 简历文本
  resumeId: routeQuery.resumeId ? parseInt(routeQuery.resumeId) : (savedConfig.resumeId || 1),                // 简历ID
  questionCount: routeQuery.questionCount ? parseInt(routeQuery.questionCount) : (savedConfig.questionCount || 8)       // 题目数量(4-20)
})

// 倍速 range slider 的值（0.5~2.0）
const ttsRateNum = ref(1.0)
watch(ttsRateNum, (v) => {
  cfg.rate = Number(v || 1.0)
})

// 运行时状态
const subtitle = ref('')
const speaking = ref(false)

// 面试题与对话
const transcript = ref([]) // { id, role:'interviewer'|'candidate', text }

// QQ风格：左右分列的消息
const qMsgs = computed(() => transcript.value.filter(m => m.role === 'interviewer'))
const aMsgs = computed(() => transcript.value.filter(m => m.role === 'candidate'))

// 合并所有消息用于显示（兼容旧代码）
const allMessages = computed(() => {
  return [...transcript.value].sort((a, b) => {
    // 从id中提取时间戳进行比较
    const timeA = parseFloat(a.id.split('-')[0])
    const timeB = parseFloat(b.id.split('-')[0])
    return timeA - timeB
  })
})

const draft = ref('')

// 当前问题显示文本
const currentQuestion = computed(() => {
  return currentQuestionObj.value.question || '请做一个自我介绍。'
})

// 进度百分比 - 完全按照 EchoMind-feature- 计算
const progressPercent = computed(() => {
  if (!interviewSession.value.questions.length || !currentQuestionObj.value.question) return 0
  return ((currentQuestionObj.value.questionIndex + 1) / interviewSession.value.questions.length) * 100
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

// 提前交卷确认对话框
const showCompleteConfirm = ref(false)
const isSubmitting = ref(false)

// 未完成面试相关
const showUnfinishedDialog = ref(false)
const unfinishedSession = ref(null)
const forceCreateNew = ref(false)

// 聊天滚动区域
const chatMessagesRef = ref(null)
const scrollAnchor = ref(null)
const chatScroll = ref(null)

// 自动滚动到底部（使用滚动锚点）
function scrollToBottom() {
  nextTick(() => {
    // 使用滚动锚点自动滚动到底部
    if (scrollAnchor.value) {
      scrollAnchor.value.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
    // 兼容旧代码
    if (chatScroll.value) {
      chatScroll.value.scrollTop = chatScroll.value.scrollHeight
    }
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动
watch(() => transcript.value.length, () => {
  scrollToBottom()
}, { flush: 'post' })

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

// 使用新的API模块获取面试报告
async function getInterviewEvaluation() {
  try {
    const session = interviewSession.value
    // 使用新的API模块
    const data = await interviewApi.getReport(session.sessionId)
    
    // 适配后端InterviewReportDTO格式
    return {
      overall: data.overallScore,
      summary: data.overallFeedback,
      weakness: data.improvements || [],
      strengths: data.strengths || [],
      dimLabels: data.categoryScores?.map(d => d.category) || [],
      dimData: data.categoryScores?.map(d => d.score) || [],
      qLabels: data.questionDetails?.map((_, i) => `Q${i+1}`) || [],
      qScores: data.questionDetails?.map(q => q.score) || [],
      questionDetails: data.questionDetails || [],
      referenceAnswers: data.referenceAnswers || []
    }
  } catch (error) {
    throw error
  }
}

// 降级到本地模拟评分
function generateMockReport() {
  // 评分是 Demo：固定基准分
  const base = 70 + Math.round(Math.random() * 16)

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
    const r = await fetch(`${API_BASE}/api/resumes/health`, { cache: 'no-store' })
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

// 使用新的API模块创建面试会话
async function createInterviewSession() {
  try {
    // 使用新的API模块 - 完全照抄 EchoMind-feature-
    const data = await interviewApi.createSession({
      resumeText: cfg.resumeText,
      questionCount: cfg.questionCount,
      resumeId: cfg.resumeId,
      jobId: cfg.jobId,
      forceCreate: true
    })
    
    // 保存会话信息
    interviewSession.value = {
      sessionId: data.sessionId,
      jobId: data.jobId,
      questions: data.questions.map(q => ({
        text: q.question,
        category: q.category,
        type: q.type,
        questionIndex: q.questionIndex,
        followupQuestions: []
      })),
      currentQuestionIndex: data.currentQuestionIndex || 0,
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

// 使用新的API模块提交答案并获取下一题 - 完全照抄 EchoMind-feature-
async function submitAnswerAndGetNext(answerText) {
  try {
    const session = interviewSession.value
    const currentQ = currentQuestionObj.value
    
    // 使用新的API模块 - 完全照抄 EchoMind-feature-
    const response = await interviewApi.submitAnswer({
      sessionId: session.sessionId,
      questionIndex: currentQ.questionIndex,
      answer: answerText,
      addQuestionIndex: currentQ.addQuestionIndex || 0
    })
    
    // 完全照抄 EchoMind-feature- 的处理逻辑
    if (response.hasNextQuestion && response.nextQuestion) {
      // 后端返回了下一题（可能是追问或新的主问题）
      // 为了让下一次提交能正确传递 addQuestionIndex，写回 currentQuestionObj
      // 注意：后端追问次数字段在 response 上叫 addQuestionIndex
      const normalizedNextQuestion = {
        ...response.nextQuestion,
        isFollowUp: response.addQuestionIndex === 0 ? false : true,
        addQuestionIndex: response.addQuestionIndex ?? response.nextQuestion.addQuestionIndex ?? 0,
      }
      currentQuestionObj.value = normalizedNextQuestion
      return response.nextQuestion.question
    } else {
      // 面试已完成
      return null
    }
  } catch (error) {
    console.error('提交答案失败:', error)
    // 降级到本地追问
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

// 检查是否有未完成的面试 - 完全照抄 EchoMind-feature-
async function checkUnfinishedSession() {
  if (!cfg.resumeId) return
  
  try {
    const foundSession = await interviewApi.findUnfinishedSession(cfg.resumeId)
    if (foundSession && !forceCreateNew.value) {
      unfinishedSession.value = foundSession
      showUnfinishedDialog.value = true
    }
  } catch (err) {
    console.error('检查未完成面试失败', err)
  }
}

// 继续未完成的面试 - 完全照抄 EchoMind-feature-
function handleContinueUnfinished() {
  if (!unfinishedSession.value) return
  
  forceCreateNew.value = false
  restoreSession(unfinishedSession.value)
  unfinishedSession.value = null
  showUnfinishedDialog.value = false
}

// 开始新面试（放弃未完成的）- 完全照抄 EchoMind-feature-
async function handleStartNew() {
  unfinishedSession.value = null
  showUnfinishedDialog.value = false
  forceCreateNew.value = true
  
  // 清除localStorage中的旧会话
  localStorage.removeItem('interviewConfig')
  
  // 创建新会话
  await createNewSession()
}

// 恢复会话 - 完全照抄 EchoMind-feature-
function restoreSession(sessionToRestore) {
  interviewSession.value = {
    sessionId: sessionToRestore.sessionId,
    jobId: sessionToRestore.jobId,
    questions: sessionToRestore.questions,
    currentQuestionIndex: sessionToRestore.currentQuestionIndex || 0,
    currentFollowupIndex: 0
  }
  
  // 恢复当前问题
  const currentQ = sessionToRestore.questions[sessionToRestore.currentQuestionIndex]
  if (currentQ) {
    currentQuestionObj.value = {
      questionIndex: currentQ.questionIndex || sessionToRestore.currentQuestionIndex,
      question: currentQ.question || '',
      type: currentQ.type || '',
      category: currentQ.category || '',
      addQuestionIndex: currentQ.addQuestionIndex || 0
    }
    
    // 恢复消息历史
    transcript.value = []
    for (let i = 0; i <= sessionToRestore.currentQuestionIndex; i++) {
      const q = sessionToRestore.questions[i]
      if (q) {
        transcript.value.push({
          id: `${Date.now()}-${i}-q`,
          role: 'interviewer',
          text: q.question,
          category: q.category
        })
        if (q.userAnswer) {
          transcript.value.push({
            id: `${Date.now()}-${i}-a`,
            role: 'candidate',
            text: q.userAnswer
          })
        }
      }
    }
    
    // 保存到localStorage
    localStorage.setItem('interviewConfig', JSON.stringify({
      sessionId: sessionToRestore.sessionId,
      questions: sessionToRestore.questions,
      currentQuestionIndex: sessionToRestore.currentQuestionIndex,
      ...cfg
    }))
  }
  
  paused.value = false
  
  // 继续面试，问当前问题
  ask(currentQuestionObj.value.question)
}

// 创建新会话
async function createNewSession() {
  transcript.value = []
  draft.value = ''
  listening.value = false
  subtitle.value = ''
  speaking.value = false
  
  const data = await createInterviewSession()
  
  // 初始化 currentQuestionObj 为第一题
  if (data.questions && data.questions.length > 0) {
    const firstQuestion = data.questions[0]
    currentQuestionObj.value = {
      questionIndex: firstQuestion.questionIndex || 0,
      question: firstQuestion.question || '',
      type: firstQuestion.type || '',
      category: firstQuestion.category || '',
      addQuestionIndex: 0
    }
  }
  
  paused.value = false
  
  // 先问第一题
  await ask(currentQuestion.value)
}

// 初始化面试 - 完全照抄 EchoMind-feature-
async function initInterview() {
  // 首先检查是否有未完成的面试
  if (!forceCreateNew.value) {
    await checkUnfinishedSession()
    if (unfinishedSession.value) {
      // 有未完成面试，显示对话框让用户选择
      return
    }
  }
  
  // 从localStorage读取sessionId和问题列表
  const savedConfig = JSON.parse(localStorage.getItem('interviewConfig') || '{}')
  if (savedConfig.sessionId && savedConfig.questions && !forceCreateNew.value) {
    interviewSession.value.sessionId = savedConfig.sessionId
    interviewSession.value.questions = savedConfig.questions
    interviewSession.value.currentQuestionIndex = savedConfig.currentQuestionIndex || 0
    
    // 初始化 currentQuestionObj 为当前题
    const currentQ = savedConfig.questions[savedConfig.currentQuestionIndex || 0]
    if (currentQ) {
      currentQuestionObj.value = {
        questionIndex: currentQ.questionIndex || savedConfig.currentQuestionIndex || 0,
        question: currentQ.question || currentQ.text || '',
        type: currentQ.type || '',
        category: currentQ.category || '',
        addQuestionIndex: 0
      }
    }
    
    paused.value = false
    await ask(currentQuestion.value)
  } else {
    // 创建新会话
    await createNewSession()
  }
}

// ask():
// 1) 把面试官问题推进 transcript
// 2) 尝试调用 Live2D 播报（如果后端已连接）
// 3) 进入 thinking 倒计时
async function ask(text){
  phase.value = 'asking'
  const currentQ = currentQuestionObj.value
  transcript.value.push({ 
    id: `${Date.now()}-${Math.random()}`, 
    role: 'interviewer', 
    text, 
    category: currentQ.isFollowUp ? `追问(${currentQ.addQuestionIndex || 0})` : currentQ.category 
  })
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

    // 超过建议时长(90秒)就提示（不强制结束，避免打断演示）
    if (answerSec.value === 90) {
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
  
  // 如果当前正在思考阶段，立即应用新的思考时间
  if (phase.value === 'thinking' && thinkLeft.value > cfg.thinkSeconds) {
    thinkLeft.value = cfg.thinkSeconds
  }
}

async function testSpeak(){
  // 设置页里"试播一句"：用于验证 Live2D + TTS 链路是否工作。
  const text = '你好，我是今天的面试官。我们开始吧。'
  if (serverOk.value && avatar.value?.speak) {
    try { await avatar.value.speak(text, cfg.voice, cfg.rate) } catch {}
  }
}

// 语音识别：调用ASR接口
async function transcribeAudio(audioBlob) {
  try {
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.wav')
    
    const response = await fetch(`${API_BASE}/api/interview/sessions/asr`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`语音识别失败: ${response.status}`)
    }
    
    const result = await response.json()
    if (result.success && result.result) {
      return result.result
    } else {
      throw new Error(`语音识别失败: ${result.msg}`)
    }
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
  handleSubmitAnswer(t)
}

// 统一的答案提交处理 - 完全照抄 EchoMind-feature-
async function handleSubmitAnswer(answerText) {
  // 添加用户消息到聊天记录
  transcript.value.push({ id: `${Date.now()}-${Math.random()}`, role: 'candidate', text: answerText })
  scrollToBottom()
  
  // 停止计时器
  stopTimers()
  
  // 使用新的API模块提交答案并获取下一题
  const nextQuestionText = await submitAnswerAndGetNext(answerText)
  
  if (nextQuestionText) {
    // 还有下一题，继续问
    await ask(nextQuestionText)
  } else {
    // 面试已完成（正常结束，所有题目已回答完）
    // 与 EchoMind-feature- 一致：正常结束不调用 completeInterview，直接跳转
    onInterviewComplete()
  }
}

// 保留旧函数名以兼容现有代码，但实际调用新的处理逻辑
async function pushAnswerAndNext(answerText) {
  await handleSubmitAnswer(answerText)
}

// 提前交卷 - 完全照抄 EchoMind-feature- 前端实现
// 调用 completeInterview 后跳转到面试记录页，评估在后台异步进行
async function finishInterview() {
  if (!interviewSession.value.sessionId) return

  isSubmitting.value = true
  try {
    // 调用提前交卷接口
    await interviewApi.completeInterview(interviewSession.value.sessionId)
    showCompleteConfirm.value = false
    
    // 面试已完成，评估将在后台进行，跳转到面试记录页
    onInterviewComplete()
  } catch (err) {
    subtitle.value = '提前交卷失败，请重试'
    console.error('[finishInterview] 提前交卷失败:', err)
  } finally {
    isSubmitting.value = false
  }
}

// 面试完成回调 - 跳转到面试记录页（与 EchoMind-feature- 完全一致）
function onInterviewComplete() {
  // 面试已完成，评估将在后台进行，跳转到面试记录页
  // 清除当前面试会话数据
  localStorage.removeItem('interviewConfig')
  
  // 跳转到面试记录列表页
  router.push('/app/records')
}

// 初始化
onMounted(async () => {
  // 检测后端连接
  await checkServer()
  
  // 初始化面试
  await initInterview()
  
  // 添加按钮鼠标跟随效果
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

/* 问题进度面板 - 完全按照 EchoMind-feature- 样式 */
.question-progress-panel {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  padding: 16px 20px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 16px;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.progress-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.progress-percent {
  font-size: 14px;
  color: var(--muted);
}

.progress-track {
  width: 100%;
  height: 8px;
  background: var(--bg1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 问题分类标签 - 完全按照 EchoMind-feature- 样式 */
.question-category-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  font-size: 12px;
  font-weight: 500;
  border-radius: 20px;
  margin-left: 8px;
}

/* 中间Live2D区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 80px;
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

/* 聊天区域 - QQ/微信风格：单列表 */
.chat-area {
  flex: 1;
  padding: 0 20px;
  overflow: hidden;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  border-radius: 16px 16px 0 0;
  margin: 0 20px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
}

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: auto;
}

/* 滚动锚点 */
.scroll-anchor {
  height: 1px;
  flex-shrink: 0;
}

/* 隐藏滚动条但保留功能 */
.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}

/* 消息行 - QQ/微信风格 */
.message-row {
  display: flex;
  width: 100%;
  animation: messageSlideIn 0.3s ease-out;
}

.message-row.interviewer {
  justify-content: flex-start;
}

.message-row.candidate {
  justify-content: flex-end;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 消息气泡 */
.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
}

/* 面试官消息 - 白色气泡，左对齐 */
.message-bubble.interviewer {
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
  border-top-left-radius: 4px;
}

/* 用户消息 - 绿色气泡，右对齐 */
.message-bubble.candidate {
  background: #95ec69;
  color: #333;
  border: none;
  border-top-right-radius: 4px;
}

.message-sender {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  font-weight: 500;
}

.message-bubble.candidate .message-sender {
  text-align: right;
  color: #5a9c3a;
}

.message-text {
  white-space: pre-wrap;
}

/* 占位符样式 */
.chat-placeholder {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.placeholder-icon {
  font-size: 48px;
  opacity: 0.5;
}

/* 兼容旧代码的消息行样式 */
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
