<script setup>
// "Eco Points" gamification: points, badges, personal activity and a top-10 leaderboard.
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import DataTable from '../components/DataTable.vue'
import { useAuth } from '../stores/auth'
import { getUserDoc, listMyRegistrations, getLeaderboard, removeRegistration } from '../services/db'
import { downloadIcs } from '../services/export'
import { useEvents } from '../composables/useEvents'
import { formatDate } from '../utils/format'
import { toast } from '../composables/useToast'

const { state, displayName } = useAuth()
const { events } = useEvents()
const points = ref(state.profile?.points || 0)
const regs = ref([])
const board = ref([])
const loading = ref(true)

const TIERS = [
  { name: 'Seedling', min: 0, icon: '🌱' },
  { name: 'Sprout', min: 20, icon: '🌿' },
  { name: 'Sapling', min: 50, icon: '🌳' },
  { name: 'Tree', min: 100, icon: '🌲' },
  { name: 'Forest Guardian', min: 200, icon: '🏞️' },
]
const tier = computed(() => [...TIERS].reverse().find((t) => points.value >= t.min))
const nextTier = computed(() => TIERS.find((t) => t.min > points.value))
const progress = computed(() => {
  if (!nextTier.value) return 100
  const span = nextTier.value.min - tier.value.min
  return Math.round(((points.value - tier.value.min) / span) * 100)
})

const regColumns = [
  { key: 'eventTitle', label: 'Event' },
  { key: 'eventDate', label: 'Date', exportValue: (r) => r.eventDate },
  { key: 'suburb', label: 'Suburb' },
]

const load = async () => {
  loading.value = true
  try {
    const [u, r, b] = await Promise.all([getUserDoc(state.user.uid), listMyRegistrations(state.user.uid), getLeaderboard()])
    points.value = u?.points || 0
    regs.value = r
    board.value = b.map((x, i) => ({ ...x, rank: i + 1 }))
  } catch {
    toast('Could not load your impact data.', 'danger')
  } finally {
    loading.value = false
  }
}
onMounted(load)

const cancel = async (row) => {
  if (!window.confirm(`Cancel your registration for ${row.eventTitle}?`)) return
  await removeRegistration(row.id)
  toast('Registration cancelled.', 'info')
  load()
}
const ics = (row) => {
  const ev = events.value.find((e) => e.id === row.eventId)
  if (ev) downloadIcs(ev)
}
</script>

<template>
  <h1 id="page-heading" tabindex="-1" class="mb-4">My impact</h1>
  <div class="row g-4 mb-4">
    <div class="col-md-6">
      <section class="card shadow-sm h-100" aria-labelledby="pts-h">
        <div class="card-body">
          <h2 id="pts-h" class="h5">{{ displayName }}</h2>
          <p class="display-5 mb-0 text-eco">{{ points }} <span class="fs-6">eco points</span></p>
          <p class="fs-4 mb-2"><span aria-hidden="true">{{ tier.icon }}</span> {{ tier.name }}</p>
          <div class="progress" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100" :aria-label="nextTier ? `Progress to ${nextTier.name}` : 'Top tier reached'" style="height: 1.25rem">
            <div class="progress-bar bg-success" :style="{ width: progress + '%' }">{{ progress }}%</div>
          </div>
          <p class="small mt-2 mb-0">{{ nextTier ? `${nextTier.min - points} more points to reach ${nextTier.name}.` : 'You reached the top tier. Thank you!' }}</p>
          <hr />
          <p class="small mb-0">Earn <strong>+10</strong> points for each event registration and <strong>+2</strong> for each rating.</p>
        </div>
      </section>
    </div>
    <div class="col-md-6">
      <section class="card shadow-sm h-100" aria-labelledby="lb-h">
        <div class="card-body">
          <h2 id="lb-h" class="h5">Leaderboard (top 10)</h2>
          <ol v-if="board.length" class="list-group list-group-numbered">
            <li v-for="b in board" :key="b.id" class="list-group-item d-flex justify-content-between" :class="{ 'list-group-item-success': b.id === state.user.uid }">
              <span class="me-auto ms-2">{{ b.displayName }}<span v-if="b.id === state.user.uid"> (you)</span></span>
              <strong>{{ b.points }} pts</strong>
            </li>
          </ol>
          <p v-else class="mb-0">No points yet. Register for an event to get on the board!</p>
        </div>
      </section>
    </div>
  </div>

  <DataTable :columns="regColumns" :rows="regs" caption="My registrations" export-name="my-registrations" :loading="loading" has-actions empty-text="You have not registered for any events yet.">
    <template #cell-eventDate="{ value }">{{ formatDate(value) }}</template>
    <template #actions="{ row }">
      <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="ics(row)">Add to calendar<span class="visually-hidden"> {{ row.eventTitle }}</span></button>
      <button type="button" class="btn btn-sm btn-outline-danger" @click="cancel(row)">Cancel<span class="visually-hidden"> {{ row.eventTitle }}</span></button>
    </template>
  </DataTable>
  <RouterLink class="btn btn-eco" to="/events">Find more events</RouterLink>
</template>
