<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import EventCard from '../components/EventCard.vue'
import ResourceCard from '../components/ResourceCard.vue'
import { useEvents } from '../composables/useEvents'
import { resources } from '../data/seedEvents'

const route = useRoute()
const { events, loading } = useEvents()
const today = new Date().toISOString().slice(0, 10)
const upcoming = computed(() => events.value.filter((e) => e.date >= today).slice(0, 3))
</script>

<template>
  <div v-if="route.query.denied" class="alert alert-warning" role="alert">You need an administrator account to open that page.</div>

  <section class="hero text-center py-5 px-3 mb-5 rounded shadow" aria-labelledby="page-heading">
    <h1 id="page-heading" tabindex="-1" class="display-4 fw-bold">EcoCycle Melbourne</h1>
    <p class="lead">Reduce waste. Recycle better. Volunteer with your community.</p>
    <div class="d-flex flex-wrap justify-content-center gap-2">
      <RouterLink class="btn btn-light btn-lg" to="/join">Get involved</RouterLink>
      <RouterLink class="btn btn-outline-light btn-lg" to="/map">Find events near me</RouterLink>
    </div>
  </section>

  <section aria-labelledby="up-h" class="mb-5">
    <h2 id="up-h" class="text-center mb-4 text-eco">Upcoming events</h2>
    <p v-if="loading" class="text-center" role="status">Loading events…</p>
    <p v-else-if="!upcoming.length" class="text-center">No upcoming events yet. Check back soon!</p>
    <div class="row g-4 justify-content-center">
      <div v-for="e in upcoming" :key="e.id" class="col-12 col-md-6 col-lg-4 d-flex"><EventCard :event="e" /></div>
    </div>
    <p class="text-center mt-4"><RouterLink class="btn btn-outline-eco" to="/events">See all events</RouterLink></p>
  </section>

  <section aria-labelledby="res-h">
    <h2 id="res-h" class="text-center mb-4 text-primary">Educational resources</h2>
    <div class="row g-4 justify-content-center">
      <div v-for="r in resources" :key="r.id" class="col-12 col-md-6 col-lg-4 d-flex"><ResourceCard :resource="r" /></div>
    </div>
  </section>
</template>
