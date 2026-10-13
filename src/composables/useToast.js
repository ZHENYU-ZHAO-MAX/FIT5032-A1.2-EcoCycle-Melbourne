import { reactive } from 'vue'

// Global toast queue rendered by <ToastRegion> inside an aria-live region.
export const toasts = reactive([])
let id = 0

export const toast = (message, type = 'success', ms = 6000) => {
  const t = { id: ++id, message, type }
  toasts.push(t)
  setTimeout(() => dismissToast(t.id), ms)
}
export const dismissToast = (tid) => {
  const i = toasts.findIndex((t) => t.id === tid)
  if (i >= 0) toasts.splice(i, 1)
}
