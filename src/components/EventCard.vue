<script setup>
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../stores/auth'
import { submitRating, getMyRating } from '../services/db'
import { downloadIcs } from '../services/export'
import { formatDate } from '../utils/format'
import { toast } from '../composables/useToast'

const props = defineProps({ event: { type: Object, required: true } })
const { isLoggedIn, state } = useAuth()

const selectedRating = ref('')
const saving = ref(false)
const myRating = ref(null)

const average = computed(() => {
  const n = props.event.ratingCount || 0
  return n ? (props.event.ratingSum / n).toFixed(1) : null
})

watch(
  () => [state.user?.uid, props.event.id],
  async ([uid]) => {
    myRating.value = null
    if (uid) {
      try { myRating.value = await getMyRating(uid, props.event.id); if (myRating.value) selectedRating.value = String(myRating.value) } catch { /* ignore */ }
    }
  },
  { immediate: true },
)

const rate = async () => {
  if (!selectedRating.value) return toast('Please choose a rating first.', 'warning')
  saving.value = true
  try {
    await submitRating(state.user.uid, props.event.id, selectedRating.value)
    myRating.value = Number(selectedRating.value)
    toast(`Thanks! You rated "${props.event.title}" ${selectedRating.value}/5.`)
  } catch {
    toast('Could not save your rating.', 'danger')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <article class="card shadow-sm border-success h-100 w-100">
    <div class="card-body d-flex flex-column">
      <span class="badge bg-success align-self-start mb-2">{{ event.category }}</span>
      <h3 class="card-title h5">{{ event.title }}</h3>
      <p class="mb-1"><span class="visually-hidden">Date: </span>📅 <time :datetime="event.date">{{ formatDate(event.date) }}</time> at {{ event.time }}</p>
      <p class="mb-1"><span class="visually-hidden">Location: </span>📍 {{ event.location }}</p>
      <p class="small text-muted">{{ event.description }}</p>

      <div class="d-flex flex-wrap gap-2 mb-3 mt-auto">
        <RouterLink class="btn btn-eco btn-sm" :to="{ name: 'join', query: { event: event.id } }">Register</RouterLink>
        <RouterLink class="btn btn-outline-eco btn-sm" :to="{ name: 'map', query: { event: event.id } }">Directions<span class="visually-hidden"> to {{ event.title }}</span></RouterLink>
        <button type="button" class="btn btn-outline-secondary btn-sm" @click="downloadIcs(event)">Add to calendar<span class="visually-hidden"> (.ics) for {{ event.title }}</span></button>
      </div>

      <hr class="mt-0" />
      <p class="mb-2">
        <span aria-hidden="true">⭐</span> Average rating:
        <strong v-if="average">{{ average }}/5</strong><span v-else>no ratings yet</span>
        <span v-if="event.ratingCount" class="text-muted small"> ({{ event.ratingCount }})</span>
      </p>
      <div v-if="isLoggedIn">
        <label :for="`rate-${event.id}`" class="form-label small mb-1">Your rating</label>
        <div class="d-flex gap-2">
          <select :id="`rate-${event.id}`" v-model="selectedRating" class="form-select form-select-sm">
            <option value="">Select rating</option>
            <option v-for="n in 5" :key="n" :value="String(n)">{{ n }} star{{ n > 1 ? 's' : '' }}</option>
          </select>
          <button type="button" class="btn btn-warning btn-sm text-nowrap" :disabled="saving" @click="rate">{{ myRating ? 'Update' : 'Submit' }}</button>
        </div>
      </div>
      <p v-else class="small mb-0"><RouterLink :to="{ name: 'login' }">Log in</RouterLink> to rate this event.</p>
    </div>
  </article>
</template>
