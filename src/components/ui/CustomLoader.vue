<template>
  <div class="custom-loader" :style="{ '--loader-color': color }">
    <!-- 波浪点动画 -->
    <div class="loader-container" v-if="type === 'wave'">
      <div class="loader-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <p class="loader-text" v-if="text">{{ text }}</p>
    </div>
    
    <!-- 旋转渐变环 -->
    <div class="loader-container" v-else-if="type === 'ring'">
      <div class="loader-ring">
        <div class="ring"></div>
        <div class="ring"></div>
        <div class="ring"></div>
      </div>
      <p class="loader-text" v-if="text">{{ text }}</p>
    </div>
    
    <!-- 脉冲动画 -->
    <div class="loader-container" v-else-if="type === 'pulse'">
      <div class="loader-pulse">
        <div class="pulse"></div>
        <div class="pulse"></div>
        <div class="pulse"></div>
      </div>
      <p class="loader-text" v-if="text">{{ text }}</p>
    </div>
    
    <!-- 流动线条 -->
    <div class="loader-container" v-else-if="type === 'flow'">
      <div class="loader-flow">
        <div class="flow-line"></div>
        <div class="flow-line"></div>
        <div class="flow-line"></div>
        <div class="flow-line"></div>
        <div class="flow-line"></div>
      </div>
      <p class="loader-text" v-if="text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  color: {
    type: String,
    default: 'var(--brand)'
  },
  type: {
    type: String,
    default: 'wave',
    validator: (value) => ['wave', 'ring', 'pulse', 'flow'].includes(value)
  },
  text: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.custom-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.loader-text {
  font-size: 14px;
  color: var(--loader-color, var(--brand));
  opacity: 0.8;
  animation: textPulse 2s ease-in-out infinite;
  letter-spacing: 2px;
}

/* ========== 波浪点动画 ========== */
.loader-dots {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--loader-color, var(--brand)) 0%, #764ba2 100%);
  box-shadow: 
    0 4px 15px rgba(91, 124, 250, 0.3),
    0 0 0 4px rgba(91, 124, 250, 0.1);
  animation: waveScale 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.1s;
}

.dot:nth-child(3) {
  animation-delay: 0.2s;
}

.dot:nth-child(4) {
  animation-delay: 0.3s;
}

.dot:nth-child(5) {
  animation-delay: 0.4s;
}

@keyframes waveScale {
  0%, 100% {
    transform: scale(0.6) translateY(0);
    opacity: 0.4;
    box-shadow: 
      0 2px 8px rgba(91, 124, 250, 0.2),
      0 0 0 2px rgba(91, 124, 250, 0.05);
  }
  50% {
    transform: scale(1.4) translateY(-15px);
    opacity: 1;
    box-shadow: 
      0 8px 25px rgba(91, 124, 250, 0.5),
      0 0 0 6px rgba(91, 124, 250, 0.15);
  }
}

/* ========== 旋转渐变环 ========== */
.loader-ring {
  position: relative;
  width: 80px;
  height: 80px;
}

.ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: var(--loader-color, var(--brand));
  border-right-color: rgba(118, 75, 162, 0.5);
}

.ring:nth-child(1) {
  width: 60px;
  height: 60px;
  animation: ringRotate 2s linear infinite;
}

.ring:nth-child(2) {
  width: 45px;
  height: 45px;
  animation: ringRotate 1.5s linear infinite reverse;
  border-top-color: rgba(118, 75, 162, 0.7);
  border-right-color: var(--loader-color, var(--brand));
}

.ring:nth-child(3) {
  width: 30px;
  height: 30px;
  animation: ringRotate 1s linear infinite;
  border-width: 2px;
}

@keyframes ringRotate {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* ========== 脉冲动画 ========== */
.loader-pulse {
  position: relative;
  width: 60px;
  height: 60px;
}

.pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: linear-gradient(135deg, var(--loader-color, var(--brand)) 0%, #764ba2 100%);
  opacity: 0;
}

.pulse:nth-child(1) {
  width: 100%;
  height: 100%;
  animation: pulseWave 2s ease-out infinite;
}

.pulse:nth-child(2) {
  width: 70%;
  height: 70%;
  animation: pulseWave 2s ease-out infinite 0.4s;
}

.pulse:nth-child(3) {
  width: 40%;
  height: 40%;
  animation: pulseWave 2s ease-out infinite 0.8s;
}

@keyframes pulseWave {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

/* ========== 流动线条 ========== */
.loader-flow {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  height: 40px;
}

.flow-line {
  width: 6px;
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(180deg, var(--loader-color, var(--brand)) 0%, #764ba2 100%);
  animation: flowWave 1s ease-in-out infinite;
}

.flow-line:nth-child(1) {
  animation-delay: 0s;
  height: 60%;
}

.flow-line:nth-child(2) {
  animation-delay: 0.1s;
  height: 80%;
}

.flow-line:nth-child(3) {
  animation-delay: 0.2s;
  height: 100%;
}

.flow-line:nth-child(4) {
  animation-delay: 0.3s;
  height: 80%;
}

.flow-line:nth-child(5) {
  animation-delay: 0.4s;
  height: 60%;
}

@keyframes flowWave {
  0%, 100% {
    transform: scaleY(0.6);
    opacity: 0.4;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

@keyframes textPulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}
</style>