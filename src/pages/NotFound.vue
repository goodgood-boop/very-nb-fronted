<template>
  <div class="container">
    <div class="card" style="padding:18px;">
      <div style="font-size:18px; font-weight:950;">404</div>
      <div class="muted" style="margin-top:10px;">页面不存在。</div>
      <div class="row gap10" style="margin-top:12px;">
        <RouterLink class="btn primary" to="/">回到首页</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
