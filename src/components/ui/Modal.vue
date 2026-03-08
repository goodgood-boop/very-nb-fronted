<template>
  <div v-if="open" class="modal-backdrop" @mousedown.self="$emit('close')">
    <div class="modal">
      <div class="mhead">
        <div>
          <div style="font-weight:950;">{{ title }}</div>
          <div v-if="subtitle" class="muted" style="font-size:12px; margin-top:4px;">{{ subtitle }}</div>
        </div>
        <button class="btn ghost" @click="$emit('close')">关闭</button>
      </div>
      <div class="mbody">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: Boolean,
  title: String,
  subtitle: String,
})
defineEmits(['close'])
</script>
