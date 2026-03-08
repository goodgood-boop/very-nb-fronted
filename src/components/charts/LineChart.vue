<template>
  <canvas ref="el"></canvas>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const props = defineProps({
  labels: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] },
  title: { type: String, default: '' },
})

const el = ref(null)
let chart = null

function render(){
  if (!el.value) return
  if (chart) { chart.destroy(); chart=null }
  chart = new Chart(el.value.getContext('2d'), {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: [{
        label: props.title || 'Score',
        data: props.data,
        tension: 0.35,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { suggestedMin: 0, suggestedMax: 100 } },
    }
  })
}

onMounted(render)
watch(()=>[props.labels, props.data], render, { deep: true })
onBeforeUnmount(()=>{ if(chart) chart.destroy() })
</script>
