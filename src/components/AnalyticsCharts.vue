<script setup>
// Server-aggregated analytics (Cloud Function getAnalytics) drawn with Chart.js, plus accessible data tables.
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Chart, BarController, BarElement, LineController, LineElement, PointElement, DoughnutController, ArcElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { getAnalytics, apiError } from '../services/api'

Chart.register(BarController, BarElement, LineController, LineElement, PointElement, DoughnutController, ArcElement, CategoryScale, LinearScale, Tooltip, Legend)

const data = ref(null)
const loading = ref(true)
const error = ref('')
const barEl = ref(null)
const lineEl = ref(null)
const pieEl = ref(null)
let charts = []

// Colour-blind-safe palette
const PALETTE = ['#146c43', '#0b5ed7', '#e8710a', '#7b3fa0', '#b3261e', '#00838f', '#6d4c41']

const draw = () => {
  charts.forEach((c) => c.destroy())
  charts = []
  if (!data.value) return
  const d = data.value
  charts.push(new Chart(barEl.value, {
    type: 'bar',
    data: { labels: d.perEvent.map((e) => e.title), datasets: [{ label: 'Registrations', data: d.perEvent.map((e) => e.registrations), backgroundColor: PALETTE[0] }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { display: false } } },
  }))
  charts.push(new Chart(lineEl.value, {
    type: 'line',
    data: { labels: d.byDay.map((x) => x.date), datasets: [{ label: 'Sign-ups per day', data: d.byDay.map((x) => x.count), borderColor: PALETTE[1], backgroundColor: PALETTE[1], tension: 0.25 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
  }))
  charts.push(new Chart(pieEl.value, {
    type: 'doughnut',
    data: { labels: d.byCategory.map((x) => x.category), datasets: [{ data: d.byCategory.map((x) => x.count), backgroundColor: PALETTE }] },
    options: { responsive: true, maintainAspectRatio: false },
  }))
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    data.value = await getAnalytics()
    await nextTick()
    draw()
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => charts.forEach((c) => c.destroy()))
watch(data, async () => { await nextTick(); draw() })
defineExpose({ reload: load })
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="h5 mb-0">Analytics overview</h3>
      <button type="button" class="btn btn-sm btn-outline-eco" :disabled="loading" @click="load">Refresh</button>
    </div>
    <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
    <p v-if="loading" role="status">Loading analytics…</p>

    <div v-show="data" class="row g-3 mb-4">
      <div class="col-6 col-md-3" v-for="(t, i) in [
        ['Events', data?.totals.events],
        ['Registrations', data?.totals.registrations],
        ['Volunteers', data?.totals.volunteers],
        ['Avg rating', data?.totals.avgRating ?? '–'],
      ]" :key="i">
        <div class="card text-center shadow-sm"><div class="card-body py-3"><div class="display-6 text-eco">{{ t[1] }}</div><div class="small">{{ t[0] }}</div></div></div>
      </div>
    </div>

    <div v-show="data" class="row g-4">
      <div class="col-lg-7">
        <div class="card shadow-sm"><div class="card-body">
          <h4 class="h6">Registrations per event</h4>
          <div class="chart-box"><canvas ref="barEl" role="img" aria-label="Bar chart of registrations per event. Data table follows."></canvas></div>
        </div></div>
      </div>
      <div class="col-lg-5">
        <div class="card shadow-sm"><div class="card-body">
          <h4 class="h6">Registrations by event category</h4>
          <div class="chart-box"><canvas ref="pieEl" role="img" aria-label="Doughnut chart of registrations by category. Data table follows."></canvas></div>
        </div></div>
      </div>
      <div class="col-12">
        <div class="card shadow-sm"><div class="card-body">
          <h4 class="h6">Sign-ups in the last 14 days</h4>
          <div class="chart-box"><canvas ref="lineEl" role="img" aria-label="Line chart of daily sign-ups for the last 14 days. Data table follows."></canvas></div>
        </div></div>
      </div>
      <div v-if="data" class="col-12">
        <details>
          <summary>View chart data as tables (text alternative)</summary>
          <div class="table-responsive mt-2">
            <table class="table table-sm">
              <caption>Registrations and average rating per event</caption>
              <thead><tr><th scope="col">Event</th><th scope="col">Registrations</th><th scope="col">Average rating</th></tr></thead>
              <tbody><tr v-for="e in data.perEvent" :key="e.title"><th scope="row">{{ e.title }}</th><td>{{ e.registrations }}</td><td>{{ e.avgRating ?? '–' }}</td></tr></tbody>
            </table>
            <table class="table table-sm">
              <caption>Registrations by category</caption>
              <thead><tr><th scope="col">Category</th><th scope="col">Registrations</th></tr></thead>
              <tbody><tr v-for="c in data.byCategory" :key="c.category"><th scope="row">{{ c.category }}</th><td>{{ c.count }}</td></tr></tbody>
            </table>
            <table class="table table-sm">
              <caption>Sign-ups per day (last 14 days)</caption>
              <thead><tr><th scope="col">Date</th><th scope="col">Sign-ups</th></tr></thead>
              <tbody><tr v-for="d in data.byDay" :key="d.date"><th scope="row">{{ d.date }}</th><td>{{ d.count }}</td></tr></tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>
