<script setup>
import { ref, computed } from 'vue'
import EventCard from '../components/EventCard.vue'
import { useEvents } from '../composables/useEvents'

const { events, loading, error } = useEvents()
const q = ref('')
const category = ref('')
const categories = computed(() => [...new Set(events.value.map((e) => e.category).filter(Boolean))])
const shown = computed(() =>
  events.value.filter((e) => (!category.value || e.category === category.value) &&
    (!q.value || `${e.title} ${e.location} ${e.description}`.toLowerCase().includes(q.value.toLowerCase()))),
)
</script>

<template>
  <h1 id="page-heading" tabindex="-1" class="mb-4">Events</h1>
  <form class="row g-3 mb-4" role="search" @submit.prevent>
    <div class="col-md-6">
      <label for="ev-q" class="form-label">Search events</label>
      <input id="ev-q" v-model="q" type="search" class="form-control" placeholder="Title, suburb or keyword" />
    </div>
    <div class="col-md-3">
      <label for="ev-cat" class="form-label">Category</label>
      <select id="ev-cat" v-model="category" class="form-select">
        <option value="">All categories</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>
  </form>
  <p class="visually-hidden" role="status" aria-live="polite">{{ shown.length }} events shown</p>
  <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
  <p v-if="loading" role="status">Loading events…</p>
  <p v-else-if="!shown.length">No events match your search.</p>
  <div class="row g-4">
    <div v-for="e in shown" :key="e.id" class="col-12 col-md-6 col-lg-4 d-flex"><EventCard :event="e" /></div>
  </div>
</template>
