<script setup>
import { toasts, dismissToast } from '../composables/useToast'
</script>

<template>
  <div class="toast-region" aria-live="polite" aria-atomic="false" role="status">
    <div v-for="t in toasts" :key="t.id" class="alert shadow d-flex justify-content-between align-items-start gap-2 mb-2" :class="`alert-${t.type}`">
      <span>{{ t.message }}</span>
      <button type="button" class="btn-close" aria-label="Dismiss message" @click="dismissToast(t.id)"></button>
    </div>
  </div>
</template>
