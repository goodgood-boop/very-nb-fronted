<template>
  <div class="windmill-container" :class="[currentTimeMode, currentWeatherMode]">
    <!-- 晚霞天空背景 -->
    <div class="sky">
      <!-- 太阳 -->
      <div class="sun"></div>
      <!-- 月亮 -->
      <div class="moon"></div>
      <!-- 星星 -->
      <div class="stars">
        <div v-for="s in 50" :key="s" class="star" :style="starStyle(s)"></div>
      </div>
      <!-- 云朵 -->
      <div v-for="n in 12" :key="n" class="cloud" :class="`cloud-${n}`" :style="cloudStyle(n)"></div>
      
      <!-- 雨天效果 -->
      <div class="rain-container">
        <div v-for="r in 100" :key="r" class="raindrop" :style="raindropStyle(r)"></div>
      </div>
      
      <!-- 雪花效果 -->
      <div class="snow-container">
        <div v-for="s in 50" :key="s" class="snowflake" :style="snowflakeStyle(s)">❄</div>
      </div>
    </div>
    
    <!-- Background Elements: Field, Trees, Path, Animals -->
    <div class="scenery">
       <div class="ground"></div>
       <div class="path"></div>
       <div class="tree tree-1">
         <!-- Realistic SVG Tree -->
         <svg class="tree-svg" viewBox="0 0 100 150">
           <defs>
             <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#3e2723" />
                <stop offset="40%" stop-color="#5d4037" />
                <stop offset="100%" stop-color="#3e2723" />
             </linearGradient>
           </defs>
           <path d="M45,150 Q40,120 45,100 Q40,60 50,40 Q60,60 55,100 Q60,120 55,150 Z" fill="url(#trunkGrad)" />
           <g class="tree-leaves">
             <path d="M50,10 C20,20 10,50 20,80 C30,100 70,100 80,80 C90,50 80,20 50,10 Z" fill="#2e7d32" opacity="0.9" />
             <path d="M50,5 C25,15 15,45 25,75 C35,95 65,95 75,75 C85,45 75,15 50,5 Z" fill="#388e3c" opacity="0.8" />
             <path d="M50,0 C30,10 20,40 30,70 C40,90 60,90 70,70 C80,40 70,10 50,0 Z" fill="#43a047" opacity="0.8" />
           </g>
         </svg>
       </div>
       <div class="tree tree-2">
         <!-- Realistic SVG Tree (Same structure, different scale via CSS) -->
         <svg class="tree-svg" viewBox="0 0 100 150">
           <defs>
             <linearGradient id="trunkGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#3e2723" />
                <stop offset="40%" stop-color="#5d4037" />
                <stop offset="100%" stop-color="#3e2723" />
             </linearGradient>
           </defs>
           <path d="M45,150 Q40,120 45,100 Q40,60 50,40 Q60,60 55,100 Q60,120 55,150 Z" fill="url(#trunkGrad2)" />
           <g class="tree-leaves">
             <path d="M50,10 C20,20 10,50 20,80 C30,100 70,100 80,80 C90,50 80,20 50,10 Z" fill="#2e7d32" opacity="0.9" />
             <path d="M50,5 C25,15 15,45 25,75 C35,95 65,95 75,75 C85,45 75,15 50,5 Z" fill="#388e3c" opacity="0.8" />
             <path d="M50,0 C30,10 20,40 30,70 C40,90 60,90 70,70 C80,40 70,10 50,0 Z" fill="#43a047" opacity="0.8" />
           </g>
         </svg>
       </div>
       
       <div class="tree tree-3">
         <svg class="tree-svg" viewBox="0 0 100 150">
           <defs>
             <linearGradient id="trunkGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#3e2723" />
                <stop offset="40%" stop-color="#5d4037" />
                <stop offset="100%" stop-color="#3e2723" />
             </linearGradient>
           </defs>
           <path d="M45,150 Q40,120 45,100 Q40,60 50,40 Q60,60 55,100 Q60,120 55,150 Z" fill="url(#trunkGrad3)" />
           <g class="tree-leaves">
             <path d="M50,10 C20,20 10,50 20,80 C30,100 70,100 80,80 C90,50 80,20 50,10 Z" fill="#2e7d32" opacity="0.9" />
             <path d="M50,5 C25,15 15,45 25,75 C35,95 65,95 75,75 C85,45 75,15 50,5 Z" fill="#388e3c" opacity="0.8" />
             <path d="M50,0 C30,10 20,40 30,70 C40,90 60,90 70,70 C80,40 70,10 50,0 Z" fill="#43a047" opacity="0.8" />
           </g>
         </svg>
       </div>
       <div class="tree tree-4">
         <svg class="tree-svg" viewBox="0 0 100 150">
           <defs>
             <linearGradient id="trunkGrad4" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#3e2723" />
                <stop offset="40%" stop-color="#5d4037" />
                <stop offset="100%" stop-color="#3e2723" />
             </linearGradient>
           </defs>
           <path d="M45,150 Q40,120 45,100 Q40,60 50,40 Q60,60 55,100 Q60,120 55,150 Z" fill="url(#trunkGrad4)" />
           <g class="tree-leaves">
             <path d="M50,10 C20,20 10,50 20,80 C30,100 70,100 80,80 C90,50 80,20 50,10 Z" fill="#2e7d32" opacity="0.9" />
             <path d="M50,5 C25,15 15,45 25,75 C35,95 65,95 75,75 C85,45 75,15 50,5 Z" fill="#388e3c" opacity="0.8" />
             <path d="M50,0 C30,10 20,40 30,70 C40,90 60,90 70,70 C80,40 70,10 50,0 Z" fill="#43a047" opacity="0.8" />
           </g>
         </svg>
       </div>
       <div class="tree tree-5">
         <svg class="tree-svg" viewBox="0 0 100 150">
           <defs>
             <linearGradient id="trunkGrad5" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#3e2723" />
                <stop offset="40%" stop-color="#5d4037" />
                <stop offset="100%" stop-color="#3e2723" />
             </linearGradient>
           </defs>
           <path d="M45,150 Q40,120 45,100 Q40,60 50,40 Q60,60 55,100 Q60,120 55,150 Z" fill="url(#trunkGrad5)" />
           <g class="tree-leaves">
             <path d="M50,10 C20,20 10,50 20,80 C30,100 70,100 80,80 C90,50 80,20 50,10 Z" fill="#2e7d32" opacity="0.9" />
             <path d="M50,5 C25,15 15,45 25,75 C35,95 65,95 75,75 C85,45 75,15 50,5 Z" fill="#388e3c" opacity="0.8" />
             <path d="M50,0 C30,10 20,40 30,70 C40,90 60,90 70,70 C80,40 70,10 50,0 Z" fill="#43a047" opacity="0.8" />
           </g>
         </svg>
       </div>
       
       <div class="tree tree-6">
         <svg class="tree-svg" viewBox="0 0 100 150">
           <defs>
             <linearGradient id="trunkGrad6" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#3e2723" />
                <stop offset="40%" stop-color="#5d4037" />
                <stop offset="100%" stop-color="#3e2723" />
             </linearGradient>
           </defs>
           <path d="M45,150 Q40,120 45,100 Q40,60 50,40 Q60,60 55,100 Q60,120 55,150 Z" fill="url(#trunkGrad6)" />
           <g class="tree-leaves">
             <path d="M50,10 C20,20 10,50 20,80 C30,100 70,100 80,80 C90,50 80,20 50,10 Z" fill="#2e7d32" opacity="0.9" />
             <path d="M50,5 C25,15 15,45 25,75 C35,95 65,95 75,75 C85,45 75,15 50,5 Z" fill="#388e3c" opacity="0.8" />
             <path d="M50,0 C30,10 20,40 30,70 C40,90 60,90 70,70 C80,40 70,10 50,0 Z" fill="#43a047" opacity="0.8" />
           </g>
         </svg>
       </div>
       <div class="tree tree-7">
         <svg class="tree-svg" viewBox="0 0 100 150">
           <defs>
             <linearGradient id="trunkGrad7" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#3e2723" />
                <stop offset="40%" stop-color="#5d4037" />
                <stop offset="100%" stop-color="#3e2723" />
             </linearGradient>
           </defs>
           <path d="M45,150 Q40,120 45,100 Q40,60 50,40 Q60,60 55,100 Q60,120 55,150 Z" fill="url(#trunkGrad7)" />
           <g class="tree-leaves">
             <path d="M50,10 C20,20 10,50 20,80 C30,100 70,100 80,80 C90,50 80,20 50,10 Z" fill="#2e7d32" opacity="0.9" />
             <path d="M50,5 C25,15 15,45 25,75 C35,95 65,95 75,75 C85,45 75,15 50,5 Z" fill="#388e3c" opacity="0.8" />
             <path d="M50,0 C30,10 20,40 30,70 C40,90 60,90 70,70 C80,40 70,10 50,0 Z" fill="#43a047" opacity="0.8" />
           </g>
         </svg>
       </div>
       <div class="tree tree-8">
         <svg class="tree-svg" viewBox="0 0 100 150">
           <defs>
             <linearGradient id="trunkGrad8" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#3e2723" />
                <stop offset="40%" stop-color="#5d4037" />
                <stop offset="100%" stop-color="#3e2723" />
             </linearGradient>
           </defs>
           <path d="M45,150 Q40,120 45,100 Q40,60 50,40 Q60,60 55,100 Q60,120 55,150 Z" fill="url(#trunkGrad8)" />
           <g class="tree-leaves">
             <path d="M50,10 C20,20 10,50 20,80 C30,100 70,100 80,80 C90,50 80,20 50,10 Z" fill="#2e7d32" opacity="0.9" />
             <path d="M50,5 C25,15 15,45 25,75 C35,95 65,95 75,75 C85,45 75,15 50,5 Z" fill="#388e3c" opacity="0.8" />
             <path d="M50,0 C30,10 20,40 30,70 C40,90 60,90 70,70 C80,40 70,10 50,0 Z" fill="#43a047" opacity="0.8" />
           </g>
         </svg>
       </div>
       
       <div class="animals">
         <div class="sheep sheep-1">
           <!-- Realistic SVG Sheep -->
           <svg class="sheep-svg" viewBox="0 0 60 45">
             <g class="sheep-legs">
               <rect x="15" y="30" width="4" height="12" rx="2" fill="#333" />
               <rect x="25" y="30" width="4" height="12" rx="2" fill="#333" />
               <rect x="40" y="30" width="4" height="12" rx="2" fill="#333" />
               <rect x="50" y="30" width="4" height="12" rx="2" fill="#333" />
             </g>
             <path class="sheep-body" d="M10,20 Q10,10 20,5 Q40,0 55,10 Q65,25 50,35 Q30,40 10,35 Q0,30 10,20 Z" fill="#f5f5f5" stroke="#e0e0e0" stroke-width="1" />
             <circle cx="15" cy="20" r="12" fill="#f5f5f5" />
             <g class="sheep-head">
               <ellipse cx="10" cy="18" rx="8" ry="10" fill="#333" /> <!-- Head -->
               <ellipse cx="5" cy="15" rx="3" ry="6" fill="#333" transform="rotate(-30 5 15)" /> <!-- Ear L -->
               <ellipse cx="15" cy="15" rx="3" ry="6" fill="#333" transform="rotate(30 15 15)" /> <!-- Ear R -->
             </g>
           </svg>
         </div>
         <div class="sheep sheep-2">
           <!-- Realistic SVG Sheep -->
           <svg class="sheep-svg" viewBox="0 0 60 45">
             <g class="sheep-legs">
               <rect x="15" y="30" width="4" height="12" rx="2" fill="#333" />
               <rect x="25" y="30" width="4" height="12" rx="2" fill="#333" />
               <rect x="40" y="30" width="4" height="12" rx="2" fill="#333" />
               <rect x="50" y="30" width="4" height="12" rx="2" fill="#333" />
             </g>
             <path class="sheep-body" d="M10,20 Q10,10 20,5 Q40,0 55,10 Q65,25 50,35 Q30,40 10,35 Q0,30 10,20 Z" fill="#f5f5f5" stroke="#e0e0e0" stroke-width="1" />
             <circle cx="15" cy="20" r="12" fill="#f5f5f5" />
             <g class="sheep-head">
               <ellipse cx="10" cy="18" rx="8" ry="10" fill="#333" /> <!-- Head -->
               <ellipse cx="5" cy="15" rx="3" ry="6" fill="#333" transform="rotate(-30 5 15)" /> <!-- Ear L -->
               <ellipse cx="15" cy="15" rx="3" ry="6" fill="#333" transform="rotate(30 15 15)" /> <!-- Ear R -->
             </g>
           </svg>
         </div>
       </div>
    </div>

    <!-- Windmill Base/Tower -->
    <div class="windmill-tower">
      <!-- Realistic SVG Tower Base -->
      <svg class="tower-svg" viewBox="0 0 200 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="towerBrick" x1="0%" y1="0%" x2="100%" y2="0%">
             <stop offset="0%" stop-color="#8d6e63" />
             <stop offset="20%" stop-color="#a1887f" />
             <stop offset="50%" stop-color="#8d6e63" />
             <stop offset="80%" stop-color="#6d4c41" />
             <stop offset="100%" stop-color="#5d4037" />
          </linearGradient>
          <pattern id="brickPattern" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse">
             <rect width="20" height="10" fill="url(#towerBrick)" />
             <path d="M0,10 L20,10 M10,0 L10,10" stroke="#5d4037" stroke-width="1" opacity="0.3" />
          </pattern>
        </defs>
        
        <!-- Tower Body -->
        <path d="M50,0 L150,0 L180,300 L20,300 Z" fill="url(#brickPattern)" stroke="#5d4037" stroke-width="2" />
        
        <!-- Door -->
        <path d="M80,300 L80,240 Q100,220 120,240 L120,300 Z" fill="#3e2723" />
        
        <!-- Windows -->
        <rect x="90" y="100" width="20" height="25" fill="#4e342e" stroke="#3e2723" stroke-width="2" />
        <rect x="90" y="180" width="20" height="25" fill="#4e342e" stroke="#3e2723" stroke-width="2" />
        
        <!-- Wooden Beams -->
        <path d="M40,50 L160,50 M30,150 L170,150 M25,250 L175,250" stroke="#3e2723" stroke-width="3" />
      </svg>
    </div>

    <!-- Windmill Wheel -->
    <div 
      class="wheel-wrapper"
      ref="wheelRef"
      @mousedown="startDrag"
      @touchstart="startDrag"
      :style="{ transform: `rotate(${rotation}deg)` }"
    >
      <div class="wheel-hub"></div>
      
      <!-- Blades / Navigation Items -->
      <div 
        v-for="(item, index) in fullItems" 
        :key="index"
        class="blade-wrapper"
        :style="{ transform: `rotate(${index * 30}deg)` }"
      >
        <div 
          class="blade-container"
          @click.stop="!item.isBlank && navigate(item.path, index)"
          @mouseenter="!item.isBlank && (hoveredIndex = index)"
          @mouseleave="hoveredIndex = null"
          :class="{ active: hoveredIndex === index, blank: item.isBlank }"
        >
          <!-- Realistic Blade SVG -->
          <svg class="blade-svg" viewBox="0 0 400 120" preserveAspectRatio="none">
             <!-- Blade body with texture -->
             <defs>
               <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" style="stop-color:#f0e6d2;stop-opacity:1" />
                 <stop offset="100%" style="stop-color:#d4c5a9;stop-opacity:1" />
               </linearGradient>
               <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                 <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                 <feOffset dx="2" dy="2" result="offsetblur"/>
                 <feComponentTransfer>
                   <feFuncA type="linear" slope="0.3"/>
                 </feComponentTransfer>
                 <feMerge> 
                   <feMergeNode/>
                   <feMergeNode in="SourceGraphic"/> 
                 </feMerge>
               </filter>
             </defs>
             <!-- Main Blade Shape -->
             <path d="M20,60 C20,10 50,5 380,15 C395,16 400,30 400,60 C400,90 395,104 380,105 C50,115 20,110 20,60 Z" 
                   fill="url(#woodGradient)" stroke="#c0b090" stroke-width="2" filter="url(#shadow)" />
             
             <!-- Wooden Slats / Texture Lines -->
             <g stroke="#c0b090" stroke-width="1" opacity="0.5">
               <line x1="60" y1="10" x2="60" y2="110" />
               <line x1="100" y1="12" x2="100" y2="108" />
               <line x1="140" y1="13" x2="140" y2="107" />
               <line x1="180" y1="14" x2="180" y2="106" />
               <line x1="220" y1="14" x2="220" y2="106" />
               <line x1="260" y1="14" x2="260" y2="106" />
               <line x1="300" y1="14" x2="300" y2="106" />
               <line x1="340" y1="15" x2="340" y2="105" />
               
               <!-- Cross bracing -->
               <line x1="40" y1="60" x2="380" y2="60" stroke-width="2" />
             </g>
             
             <!-- Blade Base / Connector -->
             <path d="M0,50 L20,50 L20,70 L0,70 Z" fill="#8d7d65" />
          </svg>

          <div v-if="!item.isBlank" class="blade-content" :style="{ transform: `rotate(${-rotation - (index * 30)}deg)` }">
            <component :is="item.icon" :size="28" class="icon" />
            <span class="label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Drag Hint -->
    <div class="drag-hint" v-if="showHint">
      <Move :size="24" />
      <span>拖动转轮选择功能</span>
    </div>
    
    <!-- 天气/时间提示栏 -->
    <div class="info-bar">
      <div class="info-time">{{ currentTimeDisplay }}</div>
      <div class="info-weather">{{ weatherDisplay }}</div>
      <div class="info-tip">{{ weatherTip }}</div>
    </div>
    
    <!-- Settings Button -->
    <button class="settings-btn" @click="showSettings = true" title="设置">
      <Settings :size="24" />
    </button>
    
    <!-- Settings Modal -->
    <Transition name="slide-fade">
      <div v-if="showSettings" class="settings-backdrop" @click.self="showSettings = false">
        <div class="settings-modal">
          <div class="settings-header">
            <h2>设置</h2>
            <button class="close-btn" @click="showSettings = false">
              <X :size="24" />
            </button>
          </div>
          
          <div class="settings-content">
            <!-- 时间选择 -->
            <div class="setting-section">
              <h3>🌅 时间模式</h3>
              <div class="option-grid">
                <button 
                  v-for="t in timeOptions" 
                  :key="t.value"
                  class="option-btn"
                  :class="{ active: selectedTime === t.value }"
                  @click="selectedTime = t.value"
                >
                  <span class="option-icon">{{ t.icon }}</span>
                  <span class="option-label">{{ t.label }}</span>
                </button>
              </div>
            </div>
            
            <!-- 天气选择 -->
            <div class="setting-section">
              <h3>🌧️ 天气模式</h3>
              <div class="option-grid">
                <button 
                  v-for="w in weatherOptions" 
                  :key="w.value"
                  class="option-btn"
                  :class="{ active: selectedWeather === w.value }"
                  @click="selectedWeather = w.value"
                >
                  <span class="option-icon">{{ w.icon }}</span>
                  <span class="option-label">{{ w.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  LayoutDashboard, 
  Mic, 
  History, 
  ChartLine, 
  BookOpen, 
  Calendar, 
  User, 
  Settings,
  Move,
  X,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Snowflake,
  Wind,
  Sunrise,
  Sunset
} from 'lucide-vue-next'

const router = useRouter()
const wheelRef = ref(null)
const rotation = ref(0)
const isDragging = ref(false)
const hoveredIndex = ref(null)
const hasMoved = ref(false)
const showHint = ref(true)

// 设置相关
const showSettings = ref(false)
const selectedTime = ref('')
const selectedWeather = ref('')

const timeOptions = [
  { value: 'dawn', label: '凌晨', icon: '🌅' },
  { value: 'day', label: '白天', icon: '☀️' },
  { value: 'sunset', label: '傍晚', icon: '🌇' },
  { value: 'night', label: '夜晚', icon: '🌙' }
]

const weatherOptions = [
  { value: 'clear', label: '晴天', icon: '☀️' },
  { value: 'cloudy', label: '阴天', icon: '⛅' },
  { value: 'rain', label: '小雨', icon: '🌧️' },
  { value: 'heavyRain', label: '大雨', icon: '⛈️' },
  { value: 'snow', label: '下雪', icon: '❄️' },
  { value: 'windy', label: '大风', icon: '💨' }
]

// 自动检测当前时间段
const getAutoTime = () => {
  const hour = new Date().getHours()
  if (hour >= 0 && hour < 6) return 'dawn'
  if (hour >= 6 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'sunset'
  return 'night'
}

// 当前时间模式（用户选择优先，否则自动检测）
const currentTimeMode = computed(() => {
  return selectedTime.value || getAutoTime()
})

// 当前天气模式
const currentWeatherMode = computed(() => {
  return selectedWeather.value || 'clear'
})

// 当前时间显示
const currentTimeDisplay = computed(() => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
})

// 天气显示文字
const weatherDisplay = computed(() => {
  const weatherMap = {
    clear: '☀️ 晴天',
    cloudy: '⛅ 阴天',
    rain: '🌧️ 小雨',
    heavyRain: '⛈️ 大雨',
    snow: '❄️ 下雪',
    windy: '💨 大风'
  }
  return weatherMap[currentWeatherMode.value] || '☀️ 晴天'
})

// 天气暖心提示
const weatherTip = computed(() => {
  const tips = {
    clear: '🌈 今日天气晴朗，适合外出~',
    cloudy: '☁️ 天空有点阴沉，但心情要保持明亮哦~',
    rain: '☔ 当前有小雨，出门记得带伞~',
    heavyRain: '⛈️ 大雨天气，请注意安全，尽量待在室内~',
    snow: '❄️ 雪花飘落，注意保暖和防滑~',
    windy: '💨 风有点大，注意发型哦~'
  }
  return tips[currentWeatherMode.value] || tips.clear
})

// 云朵参数缓存 - 解决鼠标悬停时云朵刷新的问题
const cloudParamsCache = ref([])

// 雨滴参数缓存
const raindropParamsCache = ref([])

// 雪花参数缓存
const snowflakeParamsCache = ref([])

// 星星参数缓存
const starParamsCache = ref([])

const initCloudParams = () => {
  if (cloudParamsCache.value.length > 0) return
  for (let n = 1; n <= 12; n++) {
    const layer = Math.ceil(n / 4)
    const depthFactor = 0.5 + (layer - 1) * 0.3
    cloudParamsCache.value.push({
      baseDuration: 120 + Math.random() * 120,
      delay: Math.random() * -150,
      scale: 0.3 + Math.random() * 0.7 * depthFactor,
      width: 80 + Math.random() * 60,
      height: 30 + Math.random() * 25,
      bump1Size: 30 + Math.random() * 25,
      bump1Top: -15 - Math.random() * 15,
      bump1Left: 10 + Math.random() * 20,
      bump2Size: 35 + Math.random() * 30,
      bump2Top: -20 - Math.random() * 15,
      bump2Left: 30 + Math.random() * 25,
      layer,
      opacity: 0.5 + depthFactor * 0.5,
      blur: Math.max(0, (3 - layer) * 0.5)
    })
  }
}

const lastX = ref(0)
const lastY = ref(0)
const dragStartRotation = ref(0)
const startMouseAngle = ref(0)

const items = [
  { label: '工作台', path: '/app/dashboard', icon: LayoutDashboard },
  { label: '开始面试', path: '/app/interview', icon: Mic },
  { label: '面试记录', path: '/app/records', icon: History },
  { label: '面试统计', path: '/app/analytics', icon: ChartLine },
  { label: '题库练习', path: '/app/bank', icon: BookOpen },
  { label: '打卡中心', path: '/app/checkin', icon: Calendar },
  { label: '个人中心', path: '/app/profile', icon: User },
  { label: '设置', path: '/app/settings', icon: Settings },
]

// Create a full 12-blade structure (360 / 30 = 12 items needed)
// We have 8 real items, so we need 4 blank ones to complete the wheel.
const fullItems = [...items, ...Array(4).fill({ label: '', path: '', icon: null, isBlank: true })]
const totalBlades = 12

const cloudSpeedMultiplier = computed(() => {
  return isDragging.value ? 1.5 : 1
})

// 初始化星星参数
const initStarParams = () => {
  if (starParamsCache.value.length > 0) return
  for (let n = 1; n <= 50; n++) {
    starParamsCache.value.push({
      size: 1 + Math.random() * 2,
      top: Math.random() * 60,
      left: Math.random() * 100,
      delay: Math.random() * 3
    })
  }
}

const starStyle = (n) => {
  if (starParamsCache.value.length === 0) {
    initStarParams()
  }
  const params = starParamsCache.value[n - 1]
  if (!params) return {}
  return {
    width: params.size + 'px',
    height: params.size + 'px',
    top: params.top + '%',
    left: params.left + '%',
    animationDelay: params.delay + 's'
  }
}

// 初始化雨滴参数
const initRaindropParams = () => {
  if (raindropParamsCache.value.length > 0) return
  for (let n = 1; n <= 100; n++) {
    raindropParamsCache.value.push({
      left: Math.random() * 100,
      delay: Math.random() * 2,
      height: 15 + Math.random() * 25,
      duration: 0.5 + Math.random() * 0.5,
      opacity: 0.3 + Math.random() * 0.7
    })
  }
}

// 初始化雪花参数
const initSnowflakeParams = () => {
  if (snowflakeParamsCache.value.length > 0) return
  for (let n = 1; n <= 50; n++) {
    snowflakeParamsCache.value.push({
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 10 + Math.random() * 10,
      opacity: 0.6 + Math.random() * 0.4
    })
  }
}

const raindropStyle = (n) => {
  if (raindropParamsCache.value.length === 0) {
    initRaindropParams()
  }
  const params = raindropParamsCache.value[n - 1]
  if (!params) return {}
  return {
    left: params.left + '%',
    top: '-20px',
    height: params.height + 'px',
    animationDelay: params.delay + 's',
    animationDuration: params.duration + 's',
    opacity: params.opacity
  }
}

const snowflakeStyle = (n) => {
  if (snowflakeParamsCache.value.length === 0) {
    initSnowflakeParams()
  }
  const params = snowflakeParamsCache.value[n - 1]
  if (!params) return {}
  return {
    left: params.left + '%',
    top: '-20px',
    fontSize: params.size + 'px',
    animationDelay: params.delay + 's',
    animationDuration: params.duration + 's',
    opacity: params.opacity
  }
}

const cloudStyle = (n) => {
  // 确保缓存已初始化
  if (cloudParamsCache.value.length === 0) {
    initCloudParams()
  }
  
  const params = cloudParamsCache.value[n - 1]
  if (!params) return {}
  
  // 始终使用固定的 baseDuration，不根据 isDragging 变化
  // 这样可以避免动画刷新问题
  const duration = params.baseDuration
  
  const rotationRad = (rotation.value * Math.PI) / 180
  const parallax = Math.sin(rotationRad) * (8 + params.layer * 3)
  
  const top = (10 + (n - 1) * 7) % 50 + '%'
  const left = ((n * 17) % 100) + '%'
  
  return {
    top,
    left,
    animationDuration: duration + 's',
    animationDelay: params.delay + 's',
    transform: `scale(${params.scale}) translateX(${parallax}px)`,
    zIndex: params.layer,
    '--cloud-width': params.width + 'px',
    '--cloud-height': params.height + 'px',
    '--bump1-size': params.bump1Size + 'px',
    '--bump1-top': params.bump1Top + 'px',
    '--bump1-left': params.bump1Left + 'px',
    '--bump2-size': params.bump2Size + 'px',
    '--bump2-top': params.bump2Top + 'px',
    '--bump2-left': params.bump2Left + 'px',
    opacity: params.opacity,
    filter: `blur(${params.blur}px)`
  }
}

// Global rotation state using a simple module-level variable (in a real app, use Pinia)
// This persists as long as the app is loaded
// Initial position: "Start Interview" (index 1) at Center (-135).
// rotation = -135 - 1*30 = -165
const globalRotation = { value: -165 } 

onMounted(() => {
  // 初始化云朵参数缓存
  initCloudParams()
  // Restore rotation
  rotation.value = globalRotation.value
})

onUnmounted(() => {
  // Save rotation
  globalRotation.value = rotation.value
  
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
})

const animationFrameId = ref(null)

const getAngle = (x, y) => {
  const rect = wheelRef.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  return Math.atan2(y - centerY, x - centerX) * (180 / Math.PI)
}

const startDrag = (event) => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
  }

  const touch = event.touches ? event.touches[0] : event
  const startAngleNow = getAngle(touch.clientX, touch.clientY)
  dragStartRotation.value = rotation.value
  startMouseAngle.value = startAngleNow
  
  isDragging.value = true
  hasMoved.value = false
  showHint.value = false
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)
}

const animateRotation = (target) => {
  if (animationFrameId.value) cancelAnimationFrame(animationFrameId.value)
  
  const start = rotation.value
  const change = target - start
  const startTime = performance.now()
  const duration = 800 // Slower, heavier feel

  const animate = (currentTime) => {
    const elapsed = currentTime - startTime
    if (elapsed < duration) {
      // Elastic Out Easing
      const t = elapsed / duration
      // Simplified elastic: overshoots slightly then settles? 
      // Or just easeOutBack for a "snap" feel
      // c1 = 1.70158; c3 = c1 + 1; 
      // 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
      const x = t - 1
      const c1 = 1.70158
      const c3 = c1 + 1
      const ease = 1 + c3 * Math.pow(x, 3) + c1 * Math.pow(x, 2)
      
      rotation.value = start + change * ease
      globalRotation.value = rotation.value // Sync during animation
      animationFrameId.value = requestAnimationFrame(animate)
    } else {
      rotation.value = target
      globalRotation.value = target
      animationFrameId.value = null
    }
  }
  animationFrameId.value = requestAnimationFrame(animate)
}

const onDrag = (event) => {
  if (!isDragging.value) return
  const touch = event.touches ? event.touches[0] : event
  const currentMouseAngle = getAngle(touch.clientX, touch.clientY)
  
  // 计算角度差，并处理跨越 -180/180 边界的情况
  let angleDiff = currentMouseAngle - startMouseAngle.value
  
  // 如果角度差超过 180 度，说明跨越了边界，取相反方向
  if (angleDiff > 180) {
    angleDiff -= 360
  } else if (angleDiff < -180) {
    angleDiff += 360
  }
  
  if (Math.abs(angleDiff) > 3) {
    hasMoved.value = true
  }
  
  let newRotation = dragStartRotation.value + angleDiff
  
  const centerOffset = -135
  const itemStep = 30
  const lastRealIndex = items.length - 1
  const validMax = centerOffset
  const validMin = centerOffset - lastRealIndex * itemStep
  
  const overShootLimit = 12
  const dampingScale = 50
  
  if (newRotation > validMax) {
    const diff = newRotation - validMax
    const progress = Math.min(1, diff / dampingScale)
    const eased = 1 - Math.pow(1 - progress, 3)
    newRotation = validMax + overShootLimit * eased
  } else if (newRotation < validMin) {
    const diff = validMin - newRotation
    const progress = Math.min(1, diff / dampingScale)
    const eased = 1 - Math.pow(1 - progress, 3)
    newRotation = validMin - overShootLimit * eased
  }
  
  rotation.value = newRotation
  globalRotation.value = rotation.value
}

const stopDrag = () => {
  isDragging.value = false
  
  // Elastic bounce back
  const centerOffset = -135
  const itemStep = 30
  const lastRealIndex = items.length - 1
  const validMax = centerOffset
  const validMin = centerOffset - lastRealIndex * itemStep
  
  // Check if we are out of bounds
  // Use a small epsilon to avoid unnecessary animations for float errors
  if (rotation.value > validMax + 0.1) {
    animateRotation(validMax)
  } else if (rotation.value < validMin - 0.1) {
    animateRotation(validMin)
  }
  
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

const navigate = (path, index) => {
  if (!hasMoved.value) { 
     // Center the clicked item at -135 degrees
     const targetRotation = -135 - (index * 30)
     
     globalRotation.value = targetRotation
     rotation.value = targetRotation
     
     router.push(path)
  }
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
})
</script>

<style scoped>
.windmill-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  user-select: none;
  transition: background 1s ease;
}

/* ===== 时间模式背景 ===== */

/* 凌晨模式 */
.windmill-container.dawn {
  background: 
    radial-gradient(ellipse 100% 60% at 70% 80%, rgba(255,180,100,0.3) 0%, transparent 50%),
    radial-gradient(ellipse 80% 40% at 30% 70%, rgba(255,150,80,0.2) 0%, transparent 40%),
    linear-gradient(to bottom,
      #1a1a3a 0%,
      #2d1f4a 20%,
      #4a3060 40%,
      #8b5a7a 55%,
      #d4a574 70%,
      #f4c794 85%,
      #ffe4b5 100%
    );
}

/* 白天模式 */
.windmill-container.day {
  background: 
    radial-gradient(ellipse 100% 60% at 50% 0%, rgba(135,206,235,0.3) 0%, transparent 50%),
    linear-gradient(to bottom,
      #1e90ff 0%,
      #4da6ff 20%,
      #87ceeb 50%,
      #b0e0e6 70%,
      #e0f7fa 90%,
      #f0f8ff 100%
    );
}

/* 傍晚模式 */
.windmill-container.sunset {
  background: 
    radial-gradient(ellipse 120% 80% at 50% 100%, rgba(255,140,0,0.4) 0%, transparent 50%),
    radial-gradient(ellipse 100% 60% at 70% 30%, rgba(255,100,50,0.3) 0%, transparent 40%),
    radial-gradient(ellipse 80% 50% at 30% 20%, rgba(255,180,100,0.25) 0%, transparent 35%),
    linear-gradient(to bottom, 
      #1a1a2e 0%,
      #16213e 10%,
      #1f4068 30%,
      #e94560 55%,
      #ff6b35 70%,
      #ffa500 80%,
      #ffd700 88%,
      #87CEEB 95%,
      #b0e0e6 100%
    );
}

/* 夜晚模式 */
.windmill-container.night {
  background: 
    radial-gradient(ellipse 80% 40% at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 30%),
    linear-gradient(to bottom,
      #000011 0%,
      #000022 15%,
      #000033 30%,
      #0a0a2e 50%,
      #0f0f3d 70%,
      #1a1a4a 100%
    );
}

/* 太阳 - 默认显示 */
.sun {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff9c4, #ffd54f, #ff9800);
  box-shadow: 
    0 0 40px rgba(255,215,0,0.8),
    0 0 80px rgba(255,140,0,0.5),
    0 0 120px rgba(255,100,0,0.3);
  top: 8%;
  right: 15%;
  z-index: 1;
  transition: opacity 1s ease;
}

/* 太阳光晕 */
.sun::after {
  content: '';
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%);
  animation: sunGlow 4s ease-in-out infinite;
}

@keyframes sunGlow {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
}

/* 凌晨时太阳位置更低 */
.windmill-container.dawn .sun {
  top: 15%;
  right: 25%;
}

/* 夜晚隐藏太阳 */
.windmill-container.night .sun {
  opacity: 0;
}

/* 月亮 */
.moon {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fffef0, #f0f0d0, #d4d4aa);
  box-shadow: 
    0 0 20px rgba(255,255,240,0.6),
    0 0 40px rgba(255,255,240,0.3);
  top: 10%;
  right: 20%;
  z-index: 1;
  opacity: 0;
  transition: opacity 1s ease;
}

/* 夜晚显示月亮 */
.windmill-container.night .moon {
  opacity: 1;
}

/* 星星 */
.stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 1s ease;
}

.windmill-container.night .stars {
  opacity: 1;
}

.star {
  position: absolute;
  background: #fff;
  border-radius: 50%;
  animation: twinkle 2s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* ===== 天气效果 ===== */

/* 雨滴容器 */
.rain-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.windmill-container.rain .rain-container,
.windmill-container.heavyRain .rain-container {
  opacity: 1;
}

.raindrop {
  position: absolute;
  width: 2px;
  background: linear-gradient(to bottom, transparent, rgba(174,194,224,0.8));
  animation: fall linear infinite;
}

@keyframes fall {
  from { transform: translateY(-10vh); }
  to { transform: translateY(110vh); }
}

/* 雪花容器 */
.snow-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.windmill-container.snow .snow-container {
  opacity: 1;
}

.snowflake {
  position: absolute;
  color: #fff;
  font-size: 14px;
  animation: snowfall linear infinite;
  text-shadow: 0 0 5px rgba(255,255,255,0.8);
}

@keyframes snowfall {
  from { 
    transform: translateY(-10vh) translateX(0) rotate(0deg); 
  }
  to { 
    transform: translateY(110vh) translateX(30px) rotate(360deg); 
  }
}

/* 云层 - 阴天时显示 */
.cloud-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 1s ease;
}

.windmill-container.cloudy .cloud-layer {
  opacity: 1;
}

.cloud-layer .dark-cloud {
  position: absolute;
  background: linear-gradient(to bottom, #666, #888);
  border-radius: 50px;
  filter: blur(10px);
}

/* 夜晚天气效果调整 */
.windmill-container.night.rain .rain,
.windmill-container.night.heavyRain .rain {
  background: rgba(100,100,150,0.3);
}

/* 草地雪地效果 */
.windmill-container.snow .ground::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.3);
  animation: snowCover 2s ease-in;
}

@keyframes snowCover {
  from { opacity: 0; }
  to { opacity: 0.3; }
}

/* ===== 天气模式下的背景调整 ===== */

/* 阴天 - 天空变灰 */
.windmill-container.day.cloudy {
  background: 
    linear-gradient(to bottom,
      #5a6a7a 0%,
      #7888a0 30%,
      #9aa8b8 60%,
      #b8c4d0 100%
    );
}

/* 白天下雨 */
.windmill-container.day.rain,
.windmill-container.day.heavyRain {
  background: 
    linear-gradient(to bottom,
      #4a5568 0%,
      #5a6a7a 30%,
      #718096 60%,
      #a0aec0 100%
    );
}

/* 夜晚阴天 */
.windmill-container.night.cloudy {
  background: 
    linear-gradient(to bottom,
      #0a0a15 0%,
      #1a1a2a 30%,
      #2a2a3a 60%,
      #3a3a4a 100%
    );
}

/* 夜晚下雨 */
.windmill-container.night.rain,
.windmill-container.night.heavyRain {
  background: 
    linear-gradient(to bottom,
      #0a0a12 0%,
      #15152a 30%,
      #252545 60%,
      #353560 100%
    );
}

/* 下雪时天空 */
.windmill-container.day.snow {
  background: 
    linear-gradient(to bottom,
      #a8b8c8 0%,
      #c8d8e8 40%,
      #e0e8f0 70%,
      #f0f8ff 100%
    );
}

.windmill-container.night.snow {
  background: 
    linear-gradient(to bottom,
      #1a1a2a 0%,
      #2a2a3a 30%,
      #4a4a5a 60%,
      #6a6a7a 100%
    );
}

/* 大风时云朵快速移动 */
.windmill-container.windy .cloud {
  animation-duration: 15s !important;
}

/* 大风时云朵倾斜 */
.windmill-container.windy .cloud::after,
.windmill-container.windy .cloud::before {
  transform: skewX(-20deg);
}

.scenery {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
  pointer-events: none;
}

/* 改进的草地 - 带纹理 */
.ground {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 晚霞映照下的草地 - 多层渐变 */
  background: 
    /* 草地纹理 - 细条纹 */
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 2px,
      rgba(80,120,40,0.1) 2px,
      rgba(80,120,40,0.1) 4px
    ),
    /* 晚霞映照的草地渐变 */
    linear-gradient(180deg, 
      #c9b037 0%,      /* 晚霞金黄 */
      #b8952f 15%,
      #7c9c3c 35%,     /* 黄绿过渡 */
      #5a8c32 50%,     /* 草绿 */
      #4a7c2a 70%,     /* 深草绿 */
      #3d6b22 100%    /* 最深草绿 */
    );
  clip-path: ellipse(150% 100% at 50% 100%);
}

/* 草地前景 - 更细腻的纹理 */
.ground::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    repeating-linear-gradient(
      75deg,
      transparent 0px,
      transparent 3px,
      rgba(60,100,30,0.08) 3px,
      rgba(60,100,30,0.08) 6px
    );
  pointer-events: none;
}

/* 草地边缘光晕 */
.ground::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(180deg, 
    rgba(255,180,100,0.15) 0%,
    transparent 100%
  );
  pointer-events: none;
}

/* 晚霞映照的小路 */
.path {
  position: absolute;
  bottom: 0;
  left: 30%;
  width: 200px;
  height: 100%;
  /* 晚霞映照的小路颜色 */
  background: linear-gradient(180deg,
    #d4b896 0%,
    #c9a97c 50%,
    #b8952f 100%
  );
  clip-path: polygon(40% 0, 60% 0, 100% 100%, 0% 100%);
  opacity: 0.85;
  transform: skewX(-20deg);
  /* 添加小路纹理 */
  background-image: 
    repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 8px,
      rgba(139,90,43,0.1) 8px,
      rgba(139,90,43,0.1) 10px
    );
}

  /* Background Elements */
  
  /* Tree Styles - Updated for more realism */
  .tree {
    position: absolute;
    bottom: 20%;
    z-index: 5;
    transform-origin: bottom center;
    filter: drop-shadow(5px 5px 10px rgba(0,0,0,0.2));
  }
  
  .tree-1 { left: 10%; transform: scale(1.2); }
  .tree-2 { left: 25%; bottom: 25%; transform: scale(0.9) scaleX(-1); } /* Flipped for variety */
  
  .tree-svg {
    width: 150px;
    height: 200px;
    overflow: visible;
  }
  
  .tree-leaves {
    transform-origin: 50% 80%;
    animation: treeSway 4s ease-in-out infinite alternate;
  }
  
  .tree-1 .tree-leaves { animation-duration: 5s; }
  
  @keyframes treeSway {
    0% { transform: rotate(-2deg); }
    100% { transform: rotate(2deg); }
  }

  /* Animal Styles - Updated */
  .animals {
    position: absolute;
    bottom: 15%;
    left: 0;
    width: 100%;
    height: 100px;
    pointer-events: none;
  }

  .sheep-svg {
    width: 60px;
    height: 45px;
    filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.2));
  }
  
  .sheep-1 {
    left: 15%;
    animation: graze 12s ease-in-out infinite alternate;
  }
  
  .sheep-2 {
    left: 40%;
    bottom: 10px;
    animation: walk 20s linear infinite reverse;
  }

  .sheep-head {
    transform-origin: 20% 50%;
  }

  .sheep-1 .sheep-head {
    animation: sheepHeadBob 4s ease-in-out infinite;
  }

  @keyframes sheepHeadBob {
    0%, 100% { transform: rotate(0deg); }
    30% { transform: rotate(15deg); } /* Head down */
    60% { transform: rotate(5deg); }
  }

  /* Windmill Base - Updated */
  .windmill-tower {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 500px;
    height: 600px;
    z-index: 5;
    pointer-events: none;
  }

  .tower-svg {
    position: absolute;
    bottom: -50px;
    right: -100px;
    width: 100%;
    height: 100%;
    transform: rotate(-15deg); /* Slight angle to match corner perspective */
    filter: drop-shadow(-10px 10px 20px rgba(0,0,0,0.3));
  }


.sky {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 改进的晚霞云朵 */
.cloud {
  position: absolute;
  width: var(--cloud-width, 100px);
  height: var(--cloud-height, 40px);
  /* 晚霞云朵颜色 - 渐变 */
  background: linear-gradient(180deg, 
    rgba(255,255,255,0.95) 0%, 
    rgba(255,220,180,0.85) 50%,
    rgba(255,180,140,0.75) 100%
  );
  border-radius: 50px;
  /* 多层阴影效果 */
  box-shadow: 
    0 8px 20px rgba(255,150,100,0.3),
    0 4px 10px rgba(255,120,80,0.2),
    inset 0 -5px 15px rgba(255,100,50,0.1),
    inset 0 5px 15px rgba(255,255,255,0.5);
  animation: float linear infinite;
}

/* 云朵的第一层凸起 */
.cloud::after, .cloud::before {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: inherit;
}

/* 云朵凸起 1 */
.cloud::after {
  width: var(--bump1-size, 40px);
  height: var(--bump1-size, 40px);
  top: var(--bump1-top, -20px);
  left: var(--bump1-left, 15px);
  box-shadow: 
    0 4px 8px rgba(255,150,100,0.25),
    inset 0 -3px 8px rgba(255,100,50,0.15),
    inset 0 3px 8px rgba(255,255,255,0.4);
}

/* 云朵凸起 2 */
.cloud::before {
  width: var(--bump2-size, 50px);
  height: var(--bump2-size, 50px);
  top: var(--bump2-top, -25px);
  left: var(--bump2-left, 35px);
  box-shadow: 
    0 4px 8px rgba(255,150,100,0.25),
    inset 0 -3px 8px rgba(255,100,50,0.15),
    inset 0 3px 8px rgba(255,255,255,0.4);
}

@keyframes float {
  from { transform: translateX(-100vw); }
  to { transform: translateX(100vw); }
}

.wheel-wrapper {
  position: absolute;
  bottom: -30vw; /* Adjust based on screen size */
  right: -30vw;
  width: 80vw;
  height: 80vw;
  border-radius: 50%;
  /* background: rgba(255, 255, 255, 0.1); */
  transform-origin: center center;
  transition: transform 0.1s linear; /* Smooth drag */
  cursor: grab;
  z-index: 10;
}

.wheel-wrapper:active {
  cursor: grabbing;
  transition: none; /* Instant follow */
}

.wheel-hub {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle at 30% 30%, #e0d5c0, #8d7d65);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3), inset 0 2px 5px rgba(255,255,255,0.4);
  border: 4px solid #6b5d48;
}

/* Hub Detail - Center Bolt */
.wheel-hub::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  background: radial-gradient(circle at 30% 30%, #a09075, #504030);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 4px rgba(0,0,0,0.4);
}

.blade-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  /* Blade wrapper spacing - adjusted for 4 items visibility */
  width: 50%; /* Radius */
  height: 0;
  transform-origin: left center;
  pointer-events: none; /* Let clicks pass to blade */
}

.blade-container {
  position: absolute;
  left: 45px; /* Offset from center hub */
  top: -60px; /* Half of height */
  width: 35vw;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy effect */
  pointer-events: auto;
  cursor: pointer;
  transform-origin: left center;
}

.blade-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
  transition: all 0.3s ease;
}

/* Tree styles update for new trees */
.tree-3 { left: 5%; bottom: 35%; transform: scale(0.7); filter: brightness(0.9); z-index: 4; }
.tree-4 { left: 35%; bottom: 22%; transform: scale(0.5); filter: brightness(0.85); z-index: 3; }
.tree-5 { left: 18%; bottom: 40%; transform: scale(0.6) scaleX(-1); filter: brightness(0.9); z-index: 3; }
.tree-6 { left: 50%; bottom: 25%; transform: scale(0.6); filter: brightness(0.9); z-index: 2; }
.tree-7 { left: 60%; bottom: 35%; transform: scale(0.8) scaleX(-1); filter: brightness(0.95); z-index: 4; }
.tree-8 { left: 75%; bottom: 20%; transform: scale(0.7); filter: brightness(0.9); z-index: 3; }

.tree-3 .tree-leaves { animation-duration: 4.5s; animation-delay: 1s; }
.tree-4 .tree-leaves { animation-duration: 6s; animation-delay: 2s; }
.tree-5 .tree-leaves { animation-duration: 5.5s; animation-delay: 0.5s; }
.tree-6 .tree-leaves { animation-duration: 5s; animation-delay: 1.5s; }
.tree-7 .tree-leaves { animation-duration: 6.5s; animation-delay: 0.2s; }
.tree-8 .tree-leaves { animation-duration: 4.8s; animation-delay: 2.2s; }


.blade-container:hover {
  transform: scale(1.08) rotate(2deg);
  z-index: 15;
}

.blade-container:hover .blade-svg {
  filter: drop-shadow(0 15px 15px rgba(0,0,0,0.3));
}

.blade-container:hover .blade-svg path[fill="url(#woodGradient)"] {
  fill: #fff9f0; /* Lighter wood on hover */
  stroke: #d4c5a9;
}

.blade-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: row; /* Horizontal layout on blade */
  align-items: center;
  gap: 12px;
  color: #5d4d35;
  padding-left: 40px; /* Push content further out */
  text-shadow: 0 1px 0 rgba(255,255,255,0.6);
}

.icon {
  color: #8b4513; /* Wood brown color */
}

.label {
  font-weight: 800;
  font-size: 1.3rem;
  letter-spacing: 0.5px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.drag-hint {
  position: absolute;
  bottom: 40px;
  left: 40px;
  background: rgba(255,255,255,0.8);
  padding: 12px 20px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  color: #555;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* 天气/时间提示栏 - 玻璃态 */
.info-bar {
  position: absolute;
  top: 80px;
  left: 20px;
  width: 200px;
  padding: 16px 20px;
  border-radius: 16px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  z-index: 50;
  color: #fff;
  font-size: 14px;
  line-height: 1.6;
}

.info-time {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.info-weather {
  font-size: 14px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.info-tip {
  font-size: 12px;
  opacity: 0.8;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.2);
}

/* Settings Button */
.settings-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.85);
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
  z-index: 100;
}

.settings-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}

/* Settings Modal Backdrop */
.settings-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 20px;
  z-index: 9999;
}

/* Settings Modal */
.settings-modal {
  width: 320px;
  max-height: 90vh;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.3);
  background: linear-gradient(145deg, rgba(255,255,255,0.95), rgba(245,252,245,0.95));
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.settings-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.05);
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(0,0,0,0.1);
  color: #333;
}

.settings-content {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 80px);
}

.setting-section {
  margin-bottom: 28px;
}

.setting-section:last-child {
  margin-bottom: 0;
}

.setting-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #444;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.option-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  border-radius: 12px;
  border: 2px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.8);
  cursor: pointer;
  transition: all 0.25s ease;
}

.option-btn:hover {
  border-color: rgba(0,0,0,0.15);
  background: rgba(255,255,255,1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.option-btn.active {
  border-color: #4CAF50;
  background: rgba(76,175,80,0.1);
}

.option-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.option-label {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

/* Modal transition */
.slide-fade-enter-active {
  animation: fadeIn 0.2s ease-out;
}

.slide-fade-leave-active {
  animation: fadeOut 0.15s ease-in forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .wheel-wrapper {
    width: 120vw;
    height: 120vw;
    bottom: -40vw;
    right: -40vw;
  }
  
  .blade {
    width: 50vw;
    height: 80px;
    top: -40px;
  }
  
  .label {
    font-size: 1rem;
  }
}
</style>