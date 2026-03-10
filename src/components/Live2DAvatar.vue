<template>
  <div ref="wrap" class="avatar-wrap"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineExpose } from 'vue'
import { Application } from 'pixi.js'
import { pinyin } from 'pinyin-pro'

/**
 * ✅ 目标（稳定版）：
 * 1) 模型常驻 update（眨眼/物理/动作不会断）
 * 2) 口型：ParamMouthOpenY（开合）+ ParamA/I/U/E/O（元音形状）
 * 3) 顺序固定：先 update motion/physics → 再覆盖嘴型参数 → 再 core.update 提交
 */

const MODEL_JSON_PATH = '/models/kei/kei_vowels_pro/runtime/kei_vowels_pro.model3.json'
const API_BASE = 'http://127.0.0.1:8000'

const emit = defineEmits(['subtitle', 'speaking'])
const wrap = ref(null)
let lipsyncHook = null
let forceTestUntil = 0
let app = null
let model = null

// audio
let currentAudio = null
let rafId = null

// offline envelope
let audioCtx = null
let envelope = null
let envelopeFps = 60
let vowelCues = null

// realtime analyser fallback
let analyser = null
let analyserSrc = null
let analyserData = null

// ticker
let masterTicker = null

// ---------------- Cubism Core 兜底加载 ----------------
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const exists = [...document.scripts].some(s => s.src && s.src.includes(src))
    if (exists) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.async = false
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(s)
  })
}
async function ensureCubismCore() {
  if (globalThis.Live2DCubismCore) return
  await loadScriptOnce('/live2d/live2dcubismcore.min.js')
  await new Promise(r => setTimeout(r, 0))
  if (!globalThis.Live2DCubismCore) throw new Error('Live2DCubismCore missing.')
}

// ---------------- 参数读写（稳健版）----------------
const _paramIndexCache = new Map()
const _idHandleCache = new Map()

function getCoreModel() {
  return (
    model?.internalModel?.coreModel ||
    model?.internalModel?._coreModel ||
    null
  )
}

function getIdHandle(idStr) {
  if (_idHandleCache.has(idStr)) return _idHandleCache.get(idStr)
  let handle = null
  try {
    const fw = globalThis?.Live2DCubismFramework?.CubismFramework
    const mgr = fw?.getIdManager?.()
    handle = mgr?.getId?.(idStr) ?? null
  } catch {}
  _idHandleCache.set(idStr, handle)
  return handle
}

function getParamIndex(idStr) {
  const core = getCoreModel()
  if (!core) return -1
  if (_paramIndexCache.has(idStr)) return _paramIndexCache.get(idStr)

  let idx = -1
  const handle = getIdHandle(idStr)

  if (typeof core.getParameterIndex === 'function') {
    if (handle) {
      try { idx = core.getParameterIndex(handle) } catch {}
    }
    if (idx < 0) {
      try { idx = core.getParameterIndex(idStr) } catch {}
    }
  }

  if (
    idx < 0 &&
    typeof core.getParameterCount === 'function' &&
    typeof core.getParameterId === 'function'
  ) {
    try {
      const n = core.getParameterCount()
      for (let i = 0; i < n; i++) {
        const pid = core.getParameterId(i)
        const s = (typeof pid === 'string') ? pid : (pid?.getString?.() || String(pid))
        if (s === idStr) { idx = i; break }
      }
    } catch {}
  }

  _paramIndexCache.set(idStr, idx)
  return idx
}

function safeSetParam(idStr, v) {
  const core = getCoreModel()
  if (!core) return
  const handle = getIdHandle(idStr)

  // 优先 byId
  if (typeof core.setParameterValueById === 'function') {
    if (handle) {
      try { core.setParameterValueById(handle, v); return } catch {}
    }
    try { core.setParameterValueById(idStr, v); return } catch {}
  }

  // 兜底 byIndex
  const idx = getParamIndex(idStr)
  if (idx >= 0 && typeof core.setParameterValueByIndex === 'function') {
    try { core.setParameterValueByIndex(idx, v); return } catch {}
  }
}

function clearVowels() {
  safeSetParam('ParamA', 0)
  safeSetParam('ParamI', 0)
  safeSetParam('ParamU', 0)
  safeSetParam('ParamE', 0)
  safeSetParam('ParamO', 0)
}

function setVowel(v) {
  clearVowels()
  if (v === 'A') safeSetParam('ParamA', 1)
  if (v === 'I') safeSetParam('ParamI', 1)
  if (v === 'U') safeSetParam('ParamU', 1)
  if (v === 'E') safeSetParam('ParamE', 1)
  if (v === 'O') safeSetParam('ParamO', 1)
}

// ---------------- audio tools ----------------
function teardownAnalyser() {
  try { analyserSrc?.disconnect() } catch {}
  try { analyser?.disconnect() } catch {}
  analyser = null
  analyserSrc = null
  analyserData = null
}

function setupAnalyser(audioEl) {
  if (!audioCtx) return false
  teardownAnalyser()
  try {
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    analyserData = new Uint8Array(analyser.fftSize)
    analyserSrc = audioCtx.createMediaElementSource(audioEl)
    analyserSrc.connect(analyser)
    analyser.connect(audioCtx.destination)
    return true
  } catch (e) {
    console.warn('[Lipsync] setupAnalyser failed:', e)
    teardownAnalyser()
    return false
  }
}

function analyserRms() {
  if (!analyser || !analyserData) return 0
  analyser.getByteTimeDomainData(analyserData)
  let sum = 0
  for (let i = 0; i < analyserData.length; i++) {
    const v = (analyserData[i] - 128) / 128
    sum += v * v
  }
  const rms = Math.sqrt(sum / analyserData.length)
  return Math.max(0, Math.min(1, rms * 3.5))
}

async function unlockAudio() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!audioCtx) audioCtx = new AC()
  if (audioCtx.state === 'suspended') {
    try { await audioCtx.resume() } catch {}
  }
  return true
}

// ---------------- envelope + vowels ----------------
function buildEnvelopeFromBuffer(audioBuffer, fps = 60) {
  const ch = audioBuffer.getChannelData(0)
  const sr = audioBuffer.sampleRate
  const hop = Math.max(1, Math.floor(sr / fps))
  const win = hop * 2
  const n = Math.ceil(ch.length / hop)
  const env = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const start = i * hop
    const end = Math.min(ch.length, start + win)
    let sum = 0
    for (let j = start; j < end; j++) {
      const v = ch[j]
      sum += v * v
    }
    const rms = Math.sqrt(sum / Math.max(1, end - start))
    env[i] = Math.max(0, Math.min(1, rms * 6.0))
  }
  return env
}

function envAt(t) {
  if (!envelope) return 0
  const idx = Math.max(0, Math.min(envelope.length - 1, Math.floor(t * envelopeFps)))
  return envelope[idx] || 0
}

function vowelFromSyllable(s) {
  const x = (s || '').toLowerCase()
  // 简单规则：按拼音/英文里出现的元音决定口型
  if (x.includes('a')) return 'A'
  if (x.includes('o')) return 'O'
  if (x.includes('e')) return 'E'
  if (x.includes('i')) return 'I'
  if (x.includes('u') || x.includes('v') || x.includes('ü')) return 'U'
  return 'A'
}

function buildVowelCuesFromText(text, duration) {
  const clean = (text || '').trim()
  if (!clean || !duration || duration <= 0) return null

  // 中文：用 pinyin-pro 拆成拼音数组；英文会原样混在数组里也能工作
  let syllables = []
  try {
    syllables = pinyin(clean, { toneType: 'none', type: 'array' })
      .map(s => String(s || '').trim())
      .filter(Boolean)
  } catch {
    syllables = []
  }

  // 兜底：拼音失败就按字符粗分
  if (!syllables.length) {
    syllables = [...clean].filter(ch => !/\s/.test(ch))
  }

  const vowels = syllables.map(vowelFromSyllable)
  const n = Math.max(1, vowels.length)
  const step = duration / n

  return vowels.map((v, i) => ({
    start: i * step,
    end: (i + 1) * step,
    v,
  }))
}

function vowelAt(t) {
  if (!vowelCues) return null
  for (const c of vowelCues) {
    if (t >= c.start && t < c.end) return c.v
  }
  return vowelCues.length ? vowelCues[vowelCues.length - 1].v : null
}

// ---------------- ✅ 核心：每帧更新顺序（确保嘴不会被覆盖） ----------------
function tickModel(tick) {
  if (!model) return

  // 1) 先让引擎跑 motion/physics（可能会改嘴）
  try {
    const dt = tick?.deltaTime ?? 0
    if (typeof model.update === 'function') {
      model.update(dt)
    } else if (typeof model?.internalModel?.update === 'function') {
      model.internalModel.update(dt)
    }
  } catch {}

  // 2) 再覆盖嘴型（说话时开合+AIUEO；不说话强制闭嘴）
  if (currentAudio && !currentAudio.paused && !currentAudio.ended) {
    const t = currentAudio.currentTime || 0
    const open = envelope ? envAt(t) : analyserRms()
    safeSetParam('ParamMouthOpenY', open)

    const v = vowelAt(t)
    if (v) setVowel(v)
    else clearVowels()
  } else {
    safeSetParam('ParamMouthOpenY', 0)
    clearVowels()
  }

  // 3) 提交到 drawable（确保你覆盖的嘴型生效）
  try {
    getCoreModel()?.update?.()
  } catch {}
}

// ---------------- public methods ----------------
async function speak(text, voice = 'zh-CN-XiaoxiaoNeural', rate = '+0%') {
  if (!model) return
  const t = String(text || '').trim()
  if (!t) return

  emit('speaking', true)
  emit('subtitle', '')

  // stop previous
  try {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }
  } catch {}
  currentAudio = null
  teardownAnalyser()
  envelope = null
  vowelCues = null
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null

  // 1) request TTS
  const resp = await fetch(`${API_BASE}/api/interview/sessions/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: t, voice, rate }),
  })
  if (!resp.ok) {
    let detail = ''
    try { detail = JSON.stringify(await resp.json()) } catch {}
    emit('speaking', false)
    throw new Error(`TTS failed: ${resp.status} ${detail}`)
  }
  const ab = await resp.arrayBuffer()
  if (!ab || ab.byteLength === 0) {
    emit('speaking', false)
    throw new Error('TTS returned empty audio')
  }

  const url = URL.createObjectURL(new Blob([ab], { type: 'audio/mpeg' }))

  // 2) offline analyse envelope + vowel cues（失败也不影响播放，只是退化）
  try {
    await unlockAudio()
    const buf = await audioCtx.decodeAudioData(ab.slice(0))
    envelopeFps = 60
    envelope = buildEnvelopeFromBuffer(buf, envelopeFps)
    vowelCues = buildVowelCuesFromText(t, buf.duration)
  } catch (e) {
    console.warn('[Lipsync] offline analysis failed:', e)
    envelope = null
    vowelCues = null
  }

  // 3) play
  const audio = new Audio(url)
  audio.volume = 1.0
  currentAudio = audio

  // 如果离线 envelope 没算出来，用 realtime analyser 兜底
  if (!envelope) {
    try { await unlockAudio() } catch {}
    setupAnalyser(audio)
  }

  // subtitle: 逐字显露
  const chars = [...t]
  let lastIdx = -1
  const subTick = () => {
    if (!currentAudio || currentAudio.paused || currentAudio.ended) return
    const dur = (currentAudio.duration && isFinite(currentAudio.duration) && currentAudio.duration > 0)
      ? currentAudio.duration
      : (chars.length / 4.5)
    const p = dur > 0 ? Math.min(1, Math.max(0, currentAudio.currentTime / dur)) : 0
    const idx = Math.min(chars.length, Math.floor(p * chars.length))
    if (idx !== lastIdx) {
      lastIdx = idx
      emit('subtitle', chars.slice(0, idx).join(''))
    }
    rafId = requestAnimationFrame(subTick)
  }

  audio.addEventListener('ended', () => {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null

    teardownAnalyser()
    currentAudio = null
    envelope = null
    vowelCues = null

    // 结束后马上闭嘴（masterTicker 也会持续保证）
    safeSetParam('ParamMouthOpenY', 0)
    clearVowels()

    emit('subtitle', '')
    emit('speaking', false)

    URL.revokeObjectURL(url)
  }, { once: true })

  try {
    await audio.play()
  } catch (e) {
    emit('speaking', false)
    URL.revokeObjectURL(url)
    throw e
  }

  rafId = requestAnimationFrame(subTick)
}

function debugMouth() {
  const idx = getParamIndex('ParamMouthOpenY')
  console.log('[debugMouth] ParamMouthOpenY index =', idx)
  forceTestUntil = performance.now() + 2000
  // 直接强制开嘴 1.0 + A 口型 1.0，持续 1.2 秒
  safeSetParam('ParamMouthOpenY', 1)
  safeSetParam('ParamA', 1)
  try { getCoreModel()?.update?.() } catch {}

  setTimeout(() => {
    safeSetParam('ParamMouthOpenY', 0)
    clearVowels()
    try { getCoreModel()?.update?.() } catch {}
  }, 1200)
}

defineExpose({ speak, unlockAudio, debugMouth })

// ---------------- lifecycle ----------------
onMounted(async () => {
  if (!wrap.value) return
  await ensureCubismCore()

  const mod = await import('untitled-pixi-live2d-engine/cubism')
  const Live2DModel = mod.Live2DModel

  app = new Application()
  await app.init({ resizeTo: wrap.value, backgroundAlpha: 0, antialias: true })
  wrap.value.appendChild(app.canvas)

  model = await Live2DModel.from(MODEL_JSON_PATH)
  app.stage.addChild(model)

  // ✅ 关闭引擎自带 lipSync（避免它将来介入）
try { model.internalModel.lipSync = false } catch {}

// ✅ 用 beforeModelUpdate 确保“最后覆盖”在 coreModel.update() 之前生效
lipsyncHook = () => {
  const now = performance.now()

  // 1) 自检：强制开嘴 2 秒（肉眼必定能看到）
  if (now < forceTestUntil) {
    safeSetParam('ParamMouthOpenY', 1)
    clearVowels()
    safeSetParam('ParamA', 1)
    return
  }

  // 2) 说话状态：开合 + AIUEO
  if (currentAudio && !currentAudio.paused && !currentAudio.ended) {
    const t = currentAudio.currentTime || 0
    const open = envelope ? envAt(t) : analyserRms()
    safeSetParam('ParamMouthOpenY', open)

    const v = vowelAt(t)
    if (v) setVowel(v)
    else clearVowels()
    return
  }

  // 3) 非说话：闭嘴
  safeSetParam('ParamMouthOpenY', 0)
  clearVowels()
}

model.internalModel.on('beforeModelUpdate', lipsyncHook)

  const fit = () => {
    if (!model || !wrap.value) return
    const w = wrap.value.clientWidth || 1
    const h = wrap.value.clientHeight || 1
    const bw = model.width || 1
    const bh = model.height || 1
    const s = Math.min(w / bw, h / bh) * 0.95
    model.scale.set(s)
    model.x = w * 0.5
    model.y = h * 0.98
    model.anchor?.set?.(0.5, 1.0)
  }
  fit()
  window.addEventListener('resize', fit)

  // 初始闭嘴
  safeSetParam('ParamMouthOpenY', 0)
  clearVowels()
  try { getCoreModel()?.update?.() } catch {}

  // ✅ 常驻 ticker：永远跑更新 + 永远覆盖嘴型
  masterTicker = (tick) => tickModel(tick)
  app.ticker.add(masterTicker)

  // 额外：启动时自检一下参数是否存在（不是报错，只打印）
  console.log('[Live2D] mouthIdx=', getParamIndex('ParamMouthOpenY'),
              'AIdx=', getParamIndex('ParamA'),
              'IIdx=', getParamIndex('ParamI'),
              'UIdx=', getParamIndex('ParamU'),
              'EIdx=', getParamIndex('ParamE'),
              'OIdx=', getParamIndex('ParamO'))
})

onBeforeUnmount(() => {
  // 1) 停止正在播放的音频
  try { currentAudio?.pause() } catch {}
  currentAudio = null

  // 2) 停止字幕的 requestAnimationFrame 循环
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null

  // 3) 清理 AudioContext analyser 相关连接
  teardownAnalyser()

  // ✅ 4) 解绑 beforeModelUpdate（这是你之前没有的、也是最关键的）
  // 你 onMounted 里用了：model.internalModel.on('beforeModelUpdate', lipsyncHook)
  // 这里必须反过来解除绑定：
  if (model?.internalModel && lipsyncHook) {
    try { model.internalModel.off?.('beforeModelUpdate', lipsyncHook) } catch {}
    // 有的事件库用 removeListener，这里做个兼容兜底
    try { model.internalModel.removeListener?.('beforeModelUpdate', lipsyncHook) } catch {}
  }
  lipsyncHook = null

  // 5) 销毁 Pixi 应用（会释放 canvas、纹理等）
  if (app) {
    try { app.destroy(true, true) } catch {}
    app = null
  }

  // 6) 释放 model 引用
  model = null

  // 7) 关闭 AudioContext
  if (audioCtx) {
    try { audioCtx.close() } catch {}
    audioCtx = null
  }
})
</script>

<style scoped>
.avatar-wrap{
  width:100%;
  height:100%;
  border-radius: 18px;
  overflow:hidden;
}
</style>