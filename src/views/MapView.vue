<script setup>
import { useRoute } from 'vue-router'
import EventMap from '../components/EventMap.vue'
import { useEvents } from '../composables/useEvents'

const route = useRoute()
const { events, loading } = useEvents()
</script>

<template>
  <h1 id="page-heading" tabindex="-1" class="mb-2">Event map</h1>
  <p class="mb-4">Search for a place or use your location to find the nearest events, then get directions by bike, foot or car.</p>
  <p v-if="loading" role="status">Loading events…</p>
  <EventMap :events="events" :focus-id="typeof route.query.event === 'string' ? route.query.event : ''" />
</template>
